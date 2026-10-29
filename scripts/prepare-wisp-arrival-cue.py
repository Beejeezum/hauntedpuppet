"""Reuse one complete original arrival with a sparse dry soundtrack; no new pictures."""
from pathlib import Path
import hashlib,json,subprocess,wave
import cv2,numpy as np
ROOT=Path(__file__).resolve().parents[1];F=ROOT/'source/wisp-performance-reference/button-cue-batch'
SOURCE=ROOT/'source/wisp-performance-reference/runway-pilots/friendly-depth-arrival-study/wisp-friendly-depth-arrival-black-lead-v1.mp4'
OUT=F/'friendly-reform-runtime-candidate-v1.mp4';SOUND=F/'friendly-reform-dry-air-v1.wav'
FF=ROOT/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(SOURCE)=='955635d3b7ed8353c0a514fbf4d18c557e02131b6a443866b94a57fdfabb7345'
for p in [OUT,SOUND,OUT.with_suffix('.json')]:assert not p.exists(),'Refuse overwrite: '+str(p)
frames=133;fps=24;rate=48000;samples=frames*2000;rng=np.random.default_rng(68186);audio=np.zeros((samples,2),np.float64)
events=[('distant glimmer gathers',1.6,2.9,.025,650,3200),('body and attached hands form',2.8,4.65,.11,160,2300),('small welcoming hand opening',4.05,4.95,.04,450,3400)]
for label,start,end,peak,low,high in events:
 n=round((end-start)*rate);freq=np.fft.rfftfreq(n,1/rate);noise=rng.normal(size=(n,3));filt=(freq/(freq+low))**2/(1+(freq/high)**4);air=np.fft.irfft(np.fft.rfft(noise,axis=0)*filt[:,None],n=n,axis=0);stereo=air[:,[0,0]]*.85+air[:,1:]*.15;stereo*=np.sin(np.linspace(0,np.pi,n))[:,None]**2;stereo*=peak/max(1e-12,float(abs(stereo).max()));first=round(start*rate);audio[first:first+n]+=stereo
with wave.open(str(SOUND),'wb')as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(rate);w.writeframes((audio*32767).astype('<i2').tobytes())
subprocess.run([str(FF),'-v','error','-n','-i',str(SOURCE),'-i',str(SOUND),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-video_track_timescale','24000','-movflags','+faststart',str(OUT)],check=True)
def essence(path):return subprocess.check_output([str(FF),'-v','error','-i',str(path),'-map','0:v:0','-c','copy','-f','hash','-hash','sha256','pipe:1'],text=True).strip()
assert essence(SOURCE)==essence(OUT),'Compressed painted pictures changed'
a=cv2.VideoCapture(str(SOURCE));b=cv2.VideoCapture(str(OUT));count=0;maxima=[];margins={t:[1.]*4 for t in [4,8,16]};bad={t:[]for t in margins};previous=None;last_diffs=[]
while True:
 ok,x=a.read();ok2,y=b.read();assert ok==ok2
 if not ok:break
 assert np.array_equal(x,y),'Decoded picture changed';h,w=y.shape[:2];level=y.max(2);maxima.append(int(level.max()))
 for threshold in margins:
  yy,xx=np.where(level>threshold)
  if len(xx):
   reserve=[xx.min()/w,yy.min()/h,(w-1-xx.max())/w,(h-1-yy.max())/h];margins[threshold]=[min(float(v),m)for v,m in zip(reserve,margins[threshold])]
   if min(reserve)<.15:bad[threshold].append(count)
 if previous is not None and count>=frames-24:
  mask=(y.max(2)>16)|(previous.max(2)>16);last_diffs.append(float(abs(y.astype(float)-previous.astype(float))[mask].mean()))
 previous=y;count+=1
a.release();b.release();assert count==frames and not any(bad.values());assert min(last_diffs)>0,'Exact repeated ending picture'
head=next((i for i,v in enumerate(maxima)if v!=0),count);assert head>=12
decoded=np.frombuffer(subprocess.check_output([str(FF),'-v','error','-i',str(OUT),'-map','0:a:0','-ac','2','-ar',str(rate),'-f','f32le','pipe:1']),dtype='<f4').reshape(-1,2);peak=float(abs(decoded).max());tail=float(abs(decoded[-24000:]).max());assert len(decoded)>=samples and peak<.5 and tail==0
report={'cueId':'friendly-reform','briefAdaptation':'Existing footage forms in depth from a small glimmer, rather than a fog knot in place. This adaptation and the small early silhouette need human review before this can satisfy the finite reform slot.','file':OUT.name,'sha256':sha(OUT),'status':'source-only complete original arrival plus dry-effects candidate; human review pending','humanReview':'pending','fps':fps,'frameCount':frames,'entryPort':'empty','exitPort':'friendly-rest','entryReview':'pending','exitReview':'pending','emptyStartFrames':head,'emptyEndFrames':0,'audioTailSilenceSeconds':.5,'source':str(SOURCE.relative_to(ROOT)),'sourceSha256':sha(SOURCE),'allDecodedFramesPixelIdentical':True,'compressedVideoEssenceUnchanged':True,'processing':'Every original source frame in original order. No picture encoding, resizing, retiming, reversal, interpolation, body crossfade or visual fade. Existing source has a12frame prepended black lead; this package does not change that edit. One new continuous embedded AAC soundtrack.','minimumMarginsLTRB':margins,'reserveFailureFrames':bad,'lastSecondAdjacentForegroundMeanDifferences':last_diffs,'sound':SOUND.name,'soundSha256':sha(SOUND),'audio':{'sampleRate':rate,'peak':peak,'firstHalfSecondPeak':float(abs(decoded[:24000]).max()),'lastHalfSecondPeak':tail,'scope':'Decoded measurements; not human listening or proof of perceived timing.'},'audioRecipe':{'seed':68186,'method':'Deterministic shaped broadband air, smooth stereo envelopes; no recorded voices, notes, choir or music.','events':[{'label':a,'start':b,'end':c,'targetPeak':d,'highpassHz':e,'lowpassHz':f}for a,b,c,d,e,f in events]},'generationCreditsSpent':0,'humanApproval':False,'runtimePublication':False,'scope':'Technical video identity, all-frame clearance, exact empty arrival handle, non-identical ending frames and encoded sound checks. This does not establish convincing depth, no perceived pause, character anatomy, matching scale/pose to the current desk idle, human sound/acting approval or physical projection. Small distant glimmer and arrival pacing require human review.'}
OUT.with_suffix('.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'file':OUT.name,'frames':count,'blackHead':head,'minimumMargin':min(min(m)for m in margins.values()),'audioPeak':peak,'silentTail':tail,'endingMinDifference':min(last_diffs)}))
