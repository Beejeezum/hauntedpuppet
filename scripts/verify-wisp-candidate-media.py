"""Finite existing-candidate encoded-media audit. Never grants art approval."""
from pathlib import Path
import hashlib,json,os,shutil,subprocess,re,sys
import cv2,numpy as np
ROOT=Path(__file__).resolve().parents[1];F=ROOT/'source/wisp-performance-reference/button-cue-batch';FF=os.environ.get('FFMPEG') or shutil.which('ffmpeg') or str(ROOT/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1')
CAT=json.loads((ROOT/'source/wisp-performance-reference/ambient-show/catalog.json').read_text());clips={c['id']:c for c in CAT['clips']};assert len(clips)==16
ITEMS=[('friendly-drift','friendly-drift-candidate-v2'),('friendly-wave','friendly-wave-runtime-candidate-v3'),('friendly-boo-fail','friendly-boo-fail-runtime-candidate-v1'),('scary-reach','scary-reach-runtime-candidate-v1'),('friendly-depart','friendly-depart-runtime-candidate-v1'),('scary-eyes','scary-eyes-runtime-candidate-v1'),('cute-to-evil','cute-to-evil-runtime-candidate-v3'),('evil-to-cute','evil-to-cute-runtime-candidate-v3')]
rows=[]
for cue,name in ITEMS:
    d=json.loads((F/(name+'.json')).read_text());movie=F/d['file'];sha=hashlib.sha256(movie.read_bytes()).hexdigest();assert sha==d['sha256'];clip=clips[cue];fail=[]
    cap=cv2.VideoCapture(str(movie));fps=cap.get(cv2.CAP_PROP_FPS);assert fps>0
    maxima=[];bad={4:[],8:[],16:[]};margins={k:[1.,1.,1.,1.]for k in bad};size=None
    while True:
        ok,image=cap.read()
        if not ok:break
        h,w=image.shape[:2];size=[w,h];level=image.max(2);maxima.append(int(level.max()))
        for threshold in bad:
            yy,xx=np.where(level>threshold)
            if len(xx):
                reserve=[float(xx.min()/w),float(yy.min()/h),float((w-1-xx.max())/w),float((h-1-yy.max())/h)]
                margins[threshold]=[min(a,b)for a,b in zip(margins[threshold],reserve)]
                if min(reserve)<.15-1e-9:bad[threshold].append(len(maxima)-1)
    cap.release();assert maxima
    count=len(maxima);head=next((i for i,v in enumerate(maxima)if v!=0),count);tail=next((i for i,v in enumerate(reversed(maxima))if v!=0),count)
    if 'frameCount'in d and count!=d['frameCount']:fail.append('frame count differs from descriptor')
    if abs(fps-24)>.000001:fail.append('unexpected frame rate')
    if any(bad.values()):fail.append('15percent decoded reserve failure')
    if clip['entryPort']=='empty' and head/fps<.5:fail.append('insufficient exact-black arrival handle')
    if clip['exitPort']=='empty' and tail/fps<.5:fail.append('insufficient exact-black exit handle')
    raw=subprocess.check_output([FF,'-v','error','-i',str(movie),'-map','0:a:0','-ac','2','-ar','48000','-f','f32le','pipe:1']);audio=np.frombuffer(raw,dtype='<f4').reshape(-1,2);assert np.isfinite(audio).all();peak=float(abs(audio).max());rms=float(20*np.log10(max(1e-12,float(np.sqrt(np.mean(audio.astype(np.float64)**2))))));tailpeak=float(abs(audio[-24000:]).max());headpeak=float(abs(audio[:24000]).max());audioSeconds=len(audio)/48000;videoSeconds=count/fps
    if peak>=.98:fail.append('encoded soundtrack near clipping')
    if abs(audioSeconds-videoSeconds)>.12:fail.append('audio/video duration mismatch')
    if d.get('audioTailSilenceSeconds',0)>=.5 and tailpeak>.000001:fail.append('sound tail is not quiet')
    descriptor=d.get('audio',{});differences={};measurementChannels=descriptor.get('measurementChannels',2);measurementRate=descriptor.get('measurementSampleRate',48000);measured=audio
    if measurementChannels!=2 or measurementRate!=48000:
        measured=np.frombuffer(subprocess.check_output([FF,'-v','error','-i',str(movie),'-map','0:a:0','-ac',str(measurementChannels),'-ar',str(measurementRate),'-f','f32le','pipe:1']),dtype='<f4')
    measuredPeak=float(abs(measured).max());measuredRms=float(20*np.log10(max(1e-12,float(np.sqrt(np.mean(measured.astype(np.float64)**2))))))
    if 'peak'in descriptor:
        differences['peak']=measuredPeak-descriptor['peak']
        if abs(differences['peak'])>.003:fail.append('stale peak descriptor')
    if 'rmsDbFS'in descriptor:
        differences['rmsDbFS']=measuredRms-descriptor['rmsDbFS']
        if abs(differences['rmsDbFS'])>.05:fail.append('stale RMS descriptor')
    log=subprocess.run([FF,'-hide_banner','-i',str(movie),'-vn','-af','ashowinfo','-f','null','-'],capture_output=True,text=True,check=True).stderr
    blocks=[(float(t),int(c),int(r),int(n))for t,c,r,n in re.findall(r'pts_time:\s*([-\d.]+).*?channels:(\d+).*?rate:(\d+).*?nb_samples:(\d+)',log)];assert blocks;position=0.;error=0
    for at,channels,rate,n in blocks:error=max(error,abs(at-position));position+=n/rate
    if error>.0001:fail.append('audio presentation timestamp gap')
    rows.append({'cueId':cue,'file':movie.name,'sha256':sha,'frames':count,'fps':fps,'size':size,'exactBlackHeadFrames':head,'exactBlackTailFrames':tail,'minimumMarginsLTRB':margins,'reserveFailureFrames':bad,'audioSamples':len(audio),'audioSeconds':audioSeconds,'videoSeconds':videoSeconds,'peak':peak,'rmsDbFS':rms,'firstHalfSecondPeak':headpeak,'lastHalfSecondPeak':tailpeak,'descriptorMeasurement':{'channels':measurementChannels,'sampleRate':measurementRate,'peak':measuredPeak,'rmsDbFS':measuredRms},'encodedSampleRates':sorted({r for t,c,r,n in blocks}),'encodedChannelCounts':sorted({c for t,c,r,n in blocks}),'descriptorDifferences':differences,'maximumAudioTimestampErrorSeconds':error,'audioBlocks':len(blocks),'failures':fail,'humanApproval':False,'runtimeAdmission':False})
    print(json.dumps({'cue':cue,'failures':fail,'peak':peak,'tail':tailpeak,'black':[head,tail]}),flush=True)
report={'status':'technical_candidate_checks_pass' if not any(r['failures']for r in rows)else'candidate_defects_found','records':rows,'activeInventory':16,'scope':'Actual hashes/all decoded video bounds, exact-black handles where required, encoded audio levels/tails/durations and presentation continuity. No human acting, mix, absence-of-dialogue, perceived seam, browser playback or physical projection approval. All catalog slots stay unapproved.'}
(F/'candidate-media-validation-v1.json').write_text(json.dumps(report,indent=2)+'\n')
if any(r['failures']for r in rows):sys.exit(2)
