"""One pinned eyes-only draft -> buffered, nonverbal sound candidate; never grants approval."""
from pathlib import Path
import hashlib,json,subprocess,wave
import cv2,numpy as np

ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'source/wisp-performance-reference/button-cue-batch'
SOURCE=FOLDER/'scary-eyes-pilot-v1.mp4'
OUTPUT=FOLDER/'scary-eyes-runtime-candidate-v1.mp4'
SOUND=FOLDER/'scary-eyes-dry-air-v1.wav'
FFMPEG=ROOT/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(SOURCE)=='b5892bcf0e8f3455a0c875d66984b7f19a594eb802b8b1c40520a4985d15283e','Source changed'
for p in [OUTPUT,SOUND,OUTPUT.with_suffix('.json')]:assert not p.exists(),'Refuse overwrite: '+str(p)
rate=48000;frames=241;fps=24;samples=frames*2000
rng=np.random.default_rng(68181);audio=np.zeros((samples,2),np.float64)
events=[('small hand lift',.65,1.45,.045,300,2400),('body exhales into fog',1.65,3.3,.14,100,2100),('eyes blink',4.9,5.15,.025,700,4300),('body reforms around eyes',6.05,8.9,.16,120,2800)]
for label,start,end,peak,low,high in events:
    n=round((end-start)*rate);freq=np.fft.rfftfreq(n,1/rate)
    noise=rng.normal(size=(n,3));filt=(freq/(freq+low))**2/(1+(freq/high)**4)
    air=np.fft.irfft(np.fft.rfft(noise,axis=0)*filt[:,None],n=n,axis=0)
    stereo=air[:,[0,0]]*.8+air[:,1:]*.2
    phase=np.linspace(0,1,n);envelope=np.sin(np.pi*phase)**2
    stereo*=envelope[:,None];stereo*=peak/max(1e-12,float(abs(stereo).max()))
    first=round(start*rate);audio[first:first+n]+=stereo
assert len(audio)==samples and float(abs(audio).max())<.5
with wave.open(str(SOUND),'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(rate);w.writeframes((audio*32767).astype('<i2').tobytes())
subprocess.run([str(FFMPEG),'-v','error','-n','-i',str(SOURCE),'-i',str(SOUND),'-map','0:v:0','-map','1:a:0','-vf','scale=1152:648:flags=lanczos,pad=1280:720:64:36:black','-frames:v',str(frames),'-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-video_track_timescale','24000','-c:a','aac','-b:a','192k','-movflags','+faststart',str(OUTPUT)],check=True)
cap=cv2.VideoCapture(str(OUTPUT));assert abs(cap.get(cv2.CAP_PROP_FPS)-fps)<.001
count=0;minimum=[1.]*4;failures=0
while True:
    ok,f=cap.read()
    if not ok:break
    y,x=np.where(f.max(axis=2)>4)
    if len(x):
        margins=[x.min()/1280,y.min()/720,(1279-x.max())/1280,(719-y.max())/720]
        minimum=[min(a,float(b)) for a,b in zip(minimum,margins)];failures+=int(min(margins)<.15)
    count+=1
cap.release();assert count==frames and failures==0,(count,failures,minimum)
decoded=np.frombuffer(subprocess.check_output([str(FFMPEG),'-v','error','-i',str(OUTPUT),'-map','0:a:0','-ar',str(rate),'-ac','2','-f','f32le','pipe:1']),dtype='<f4').reshape(-1,2)
assert len(decoded)>=samples
head=float(abs(decoded[:24000]).max());tail=float(abs(decoded[samples-24000:samples]).max())
assert head==0 and tail==0
report={'file':OUTPUT.name,'sha256':sha(OUTPUT),'humanReview':'pending','status':'source-only buffered eyes-only acting and dry-effects candidate','fps':fps,'frameCount':frames,'entryPort':'scary-rest','exitPort':'scary-rest','entryReview':'pending','exitReview':'pending','emptyStartFrames':0,'emptyEndFrames':0,'audioTailSilenceSeconds':.5,'audio':{'sampleRate':rate,'peak':float(abs(decoded).max()),'lastHalfSecondPeak':tail,'firstHalfSecondPeak':head,'scope':'Numerical decoded audio evidence only; no human listening or acoustic test.'},'source':SOURCE.name,'sourceSha256':sha(SOURCE),'sound':SOUND.name,'soundSha256':sha(SOUND),'processing':'Fixed0.9 whole-frame fit into1280x720; every original frame in order,24fps unchanged. No crop, animated resize, interpolation, reversal, body crossfade or added visual fade. Re-encoded picture for static staging only. One embedded continuous soundtrack, original draft was silent.','minimumMarginsLTRB_RGB4':minimum,'reserveFailuresRGB4':failures,'sourceGenerationTargetReserve':'20percent target failed;15percent export also failed before constant buffering. No original boundary clipping observed; buffering contains emitted vapor without reconstructing missing art.','audioRecipe':{'seed':68181,'method':'Deterministic broadband filtered noise and smooth air envelopes, no voices, tonal notes or music. No other recordings mixed.','events':[{'label':a,'start':b,'end':c,'targetPeak':d,'highpassHz':e,'lowpassHz':f} for a,b,c,d,e,f in events]},'generationCreditsSpent':0,'humanApproval':False,'runtimePublication':False,'scope':'Native whole-body/eyes/dissolve/reform draft preserved in time. New constant staging, dry sound, exact incoming/outgoing joins and full artistic motion remain unapproved. No physical projection.'}
OUTPUT.with_suffix('.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ['file','frameCount','minimumMarginsLTRB_RGB4','reserveFailuresRGB4','audio']}))
