"""Speech provider adapters, bounded memory cache and local English phoneme alignment."""
from pathlib import Path
import os, io, json, wave, array, math, re, base64, hashlib, threading, urllib.request
from collections import OrderedDict
try:
    from pocketsphinx import Decoder
except ImportError:
    Decoder = None
MOODS = ('neutral','curious','amused','sinister','angry')
PHONE_MAP = {'P':'MBP','B':'MBP','M':'MBP','F':'FV','V':'FV','AA':'A','AE':'A','AH':'A','AO':'O','AW':'A','AY':'A','EH':'E','ER':'E','EY':'E','IH':'E','IY':'E','OW':'O','OY':'O','UH':'U','UW':'U','W':'U','R':'U','L':'L','TH':'TH','DH':'TH','CH':'CH','JH':'CH','SH':'CH','ZH':'CH','S':'S','Z':'S','T':'S','D':'S','N':'S','NG':'S','Y':'E','K':'A','G':'A','HH':'A','SIL':'rest','+SPN+':'rest','<sil>':'rest'}
CACHE = OrderedDict(); CACHE_LOCK=threading.RLock(); ALIGN_LOCK=threading.Lock(); CACHE_BYTES=0
CACHE_LIMIT=100*1024*1024

def normalize_request(data):
    if not isinstance(data,dict):raise ValueError('Expected a speech request object')
    text=data.get('text','')
    if not isinstance(text,str):raise ValueError('Text must be a string')
    text=text.strip()
    if not isinstance(text,str) or not 1<=len(text)<=2000:raise ValueError('Enter 1–2000 characters')
    mood=data.get('mood','neutral')
    if mood not in MOODS:raise ValueError('Unknown mood')
    intensity=float(data.get('intensity',.5)); speed=float(data.get('speed',1))
    if not math.isfinite(intensity) or not 0<=intensity<=1 or not math.isfinite(speed) or not .5<=speed<=1.5:raise ValueError('Invalid delivery setting')
    voice=data.get('voice','onyx')
    if voice not in ('alloy','ash','ballad','coral','echo','fable','nova','onyx','sage','shimmer','verse','marin','cedar'):raise ValueError('Unknown voice')
    direction=data.get('instructions','')
    if not isinstance(direction,str) or len(direction)>1000:raise ValueError('Instructions too long')
    provider=data.get('provider','openai')
    if provider not in PROVIDERS:raise ValueError('Unknown speech provider')
    return dict(text=text,mood=mood,intensity=intensity,speed=speed,voice=voice,instructions=direction,provider=provider)

class OpenAISpeechProvider:
    """Adapter contract: generate(spec) -> {audio: WAV bytes, cues?: timed visemes}."""
    def generate(self,spec):
        direction=f"{spec['instructions']} Mood: {spec['mood']}. Delivery intensity: {round(spec['intensity']*100)} percent. Maintain clear intelligible words."
        upstream=os.getenv('HAUNT_SPEECH_UPSTREAM')
        if upstream:
            # Bridge to the already-running key-owning local process during upgrades.
            if upstream!='http://127.0.0.1:8765':raise ValueError('Unsupported local voice bridge')
            with urllib.request.urlopen(upstream+'/api/status',timeout=5) as r:status=json.load(r)
            payload=dict(text=spec['text'],voice=spec['voice'],instructions=direction[:1000])
            request=urllib.request.Request(upstream+'/api/speech',data=json.dumps(payload).encode(),headers={'Content-Type':'application/json','Origin':upstream,'X-Haunt-Token':status['token']})
            with urllib.request.urlopen(request,timeout=65) as r:audio=r.read(20000001)
            # Legacy bridge has no speed parameter. Apply speed in PCM and align the result.
            if spec['speed']!=1:audio=retime_wav(audio,spec['speed'])
        else:
            key=os.environ.get('OPENAI_API_KEY')
            if not key:raise ValueError('Connect an OpenAI API key using Connect OpenAI.command.')
            payload=dict(model=os.getenv('OPENAI_TTS_MODEL','gpt-4o-mini-tts'),voice=spec['voice'],input=spec['text'],instructions=direction[:1000],response_format='wav',speed=spec['speed'])
            request=urllib.request.Request('https://api.openai.com/v1/audio/speech',data=json.dumps(payload).encode(),headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'})
            with urllib.request.urlopen(request,timeout=65) as r:audio=r.read(20000001)
        if len(audio)>20000000:raise ValueError('Speech audio exceeds limit')
        return {'audio':audio}
PROVIDERS={'openai':OpenAISpeechProvider()}

def pcm_info(audio):
    with wave.open(io.BytesIO(audio),'rb') as w:
        channels,width,rate,frames=w.getnchannels(),w.getsampwidth(),w.getframerate(),w.getnframes()
        if width!=2 or channels not in (1,2):raise ValueError('Alignment requires PCM16 WAV, mono/stereo, at most 180 seconds')
        samples=array.array('h',w.readframes(min(frames,rate*181)))
        if len(samples)/channels>rate*180:raise ValueError('Audio exceeds 180 seconds')
    if channels==2:samples=array.array('h',((samples[i]+samples[i+1])//2 for i in range(0,len(samples),2)))
    return samples,rate

def resample(samples,ratio):
    count=int(len(samples)/ratio)
    return array.array('h',(int(samples[min(int(i*ratio),len(samples)-1)]*(1-(i*ratio%1))+samples[min(int(i*ratio)+1,len(samples)-1)]*(i*ratio%1)) for i in range(count)))

def retime_wav(audio,speed):
    samples,rate=pcm_info(audio);result=io.BytesIO()
    with wave.open(result,'wb') as w:w.setparams((1,2,rate,0,'NONE','not compressed'));w.writeframes(resample(samples,speed).tobytes())
    return result.getvalue()

def align_audio(audio,text):
    samples,rate=pcm_info(audio);duration=len(samples)/rate
    fallback={'duration':duration,'visemes':[],'syncMode':'amplitude-fallback','alignmentWarning':'Local English phoneme aligner is unavailable.'}
    if Decoder is None:return fallback
    words=re.findall(r"[a-z]+(?:'[a-z]+)?",text.lower().replace('’',"'"))
    if not words:return dict(fallback,alignmentWarning='No English words to align. Using audio-volume jaw fallback.')
    try:
        mapping=dict(PHONE_MAP)
        try:
            custom=json.loads((Path(__file__).parent/'assets/character.json').read_text()).get('phonemeMap',{})
            if isinstance(custom,dict):mapping.update(custom)
        except (OSError,ValueError):pass
        with ALIGN_LOCK:
            decoder=Decoder(lm=None,samprate=16000,logfn=os.devnull,bestpath=False)
            for word,phones in {'ahem':'AH HH EH M','practising':'P R AE K T IH S IH NG'}.items():
                if decoder.lookup_word(word) is None:decoder.add_word(word,phones)
            unknown=[word for word in words if decoder.lookup_word(word) is None]
            if unknown:return dict(fallback,alignmentWarning='A word is missing from the English pronunciation dictionary. Using audio-volume jaw fallback; load reviewed timings to override.')
            raw=resample(samples,rate/16000).tobytes()
            decoder.set_align_text(' '.join(words));decoder.start_utt();decoder.process_raw(raw,full_utt=True);decoder.end_utt()
            decoder.set_alignment();decoder.start_utt();decoder.process_raw(raw,full_utt=True);decoder.end_utt()
            cues=[]
            for phone in decoder.get_alignment().phones():
                start=max(0,phone.start/100);end=min(duration,(phone.start+phone.duration)/100)
                if end>start:cues.append(dict(start=round(start,3),end=round(end,3),shape=mapping.get(re.sub(r'\d','',phone.name),'rest'),phoneme=phone.name))
        if not cues or not any(c['shape']!='rest' for c in cues):raise ValueError('No speech alignment')
        # Energy-gate silence even when a forced phone spans a pause.
        gated=[]
        for cue in cues:
            at=cue['start']
            while at<cue['end']-.001:
                end=min(cue['end'],at+.02);a=int(at*rate);b=max(a+1,int(end*rate));chunk=samples[a:b]
                rms=math.sqrt(sum(x*x for x in chunk)/max(1,len(chunk)))/32768
                shape='rest' if rms<.008 else cue['shape']
                if gated and gated[-1]['shape']==shape and abs(gated[-1]['end']-at)<.003:gated[-1]['end']=round(end,3)
                else:gated.append(dict(start=round(at,3),end=round(end,3),shape=shape,phoneme=cue['phoneme']))
                at=end
        return dict(duration=duration,visemes=gated,syncMode='forced-phoneme-alignment',alignmentWarning='Automatic English alignment. Review names, whispers and unusually theatrical delivery.')
    except Exception:return dict(fallback,alignmentWarning='Local alignment could not resolve this performance. Using clearly labeled audio-volume jaw fallback.')

def performance(data):
    global CACHE_BYTES
    spec=normalize_request(data)
    rig_revision=hashlib.sha256((Path(__file__).parent/'assets/character.json').read_bytes()).hexdigest()
    key=hashlib.sha256(json.dumps(dict(spec,rig=rig_revision,model=os.getenv('OPENAI_TTS_MODEL','gpt-4o-mini-tts')),sort_keys=True).encode()).hexdigest()
    with CACHE_LOCK:
        if key in CACHE:
            result=CACHE.pop(key);CACHE[key]=result
            return dict(result,cacheHit=True)
        # Serialize generation to deduplicate concurrent identical prepares and bound memory.
        result=PROVIDERS[spec['provider']].generate(spec);audio=result['audio']
        alignment=align_audio(audio,spec['text']) if not result.get('cues') else dict(duration=pcm_info(audio)[0].__len__()/pcm_info(audio)[1],visemes=result['cues'],syncMode='provider-timings',alignmentWarning='')
        item=dict(id=key,spec=spec,audio=base64.b64encode(audio).decode(),mimeType='audio/wav',**alignment,moodCues=[dict(start=0,end=alignment['duration'],mood=spec['mood'],intensity=spec['intensity'])],cacheHit=False)
        size=len(item['audio'])
        while CACHE and CACHE_BYTES+size>CACHE_LIMIT:
            _,old=CACHE.popitem(last=False);CACHE_BYTES-=len(old['audio'])
        CACHE[key]=item;CACHE_BYTES+=size
        return item
