"""Rebuild the canonical morph review without overwriting an existing export.
Requires OpenCV, NumPy and FFmpeg. Streams original frames sequentially with
one24fps picture clock and a contiguous48kHz soundtrack; not an approval tool.
"""
from pathlib import Path
import subprocess,json,hashlib,cv2,numpy as np,wave,os,shutil
root=Path(__file__).resolve().parents[1];folder=root/'source/wisp-performance-reference/button-cue-batch';ff=Path(os.environ.get('FFMPEG') or shutil.which('ffmpeg') or root/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1');out=folder/'wisp-morph-roundtrip-review-v5.mp4';assert not out.exists()
sources=[folder/'friendly-drift-candidate-v1.mp4',folder/'cute-to-evil-runtime-candidate-v2.mp4',root/'source/wisp-performance-reference/runway-pilots/motion-transfer-study/wisp-scary-motion-transfer-v35.mp4',folder/'evil-to-cute-runtime-candidate-v2.mp4',folder/'friendly-drift-candidate-v1.mp4'];counts=[122,121,121,121,122];segments=[]
for i,(p,n) in enumerate(zip(sources,counts)):
 samples=n*2000
 if i==2:
  rng=np.random.default_rng(68178);freq=np.fft.rfftfreq(samples,1/48000);weight=(freq/(freq+90))**2/(1+(freq/2000)**4)/np.maximum(freq,90)
  a=np.fft.irfft(np.fft.rfft(rng.normal(size=(samples,2)),axis=0)*weight[:,None],n=samples,axis=0);a*=.025/max(float(abs(a).max()),1e-12);a[:12000]*=np.linspace(0,1,12000)[:,None];a[-24000:]*=np.linspace(1,0,24000)[:,None]
 else:
  raw=subprocess.check_output([str(ff),'-v','error','-i',str(p),'-vn','-ar','48000','-ac','2','-f','f32le','pipe:1']);a=np.frombuffer(raw,np.float32).reshape(-1,2).copy();a=np.pad(a[:samples],((0,max(0,samples-len(a))),(0,0)))
 assert a.shape==(samples,2);segments.append(a)
audio=np.concatenate(segments);assert abs(audio).max()<.8
wav=root/'work/wisp-morph-roundtrip-review-v5.wav'
with wave.open(str(wav),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(48000);w.writeframes((audio*32767).astype('<i2').tobytes())
cmd=[str(ff),'-v','error','-n','-f','rawvideo','-pixel_format','bgr24','-video_size','1280x720','-framerate','24','-i','pipe:0','-i',str(wav),'-map','0:v','-map','1:a','-frames:v',str(sum(counts)),'-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-video_track_timescale','24000','-c:a','aac','-b:a','192k','-movflags','+faststart',str(out)]
process=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=subprocess.PIPE);submitted=0
try:
 for p,n in zip(sources,counts):
  cap=cv2.VideoCapture(str(p));read=0
  while True:
   ok,f=cap.read()
   if not ok:break
   h,w=f.shape[:2];fit=min(1280/w,720/h);nw,nh=round(w*fit),round(h*fit);f=cv2.resize(f,(nw,nh),interpolation=cv2.INTER_LANCZOS4);stage=np.zeros((720,1280,3),np.uint8);x,y=(1280-nw)//2,(720-nh)//2;stage[y:y+nh,x:x+nw]=f;process.stdin.write(stage.tobytes());submitted+=1;read+=1
  cap.release();assert read==n,(p,read,n)
 process.stdin.close();error=process.stderr.read().decode();assert process.wait()==0,error
except Exception:
 process.kill();process.wait();raise
assert submitted==sum(counts)
cap=cv2.VideoCapture(str(out));decoded=0;minimum=[1.]*4;failures=0
while True:
 ok,f=cap.read()
 if not ok:break
 y,x=np.where(f.max(axis=2)>4)
 if len(x):
  margins=[x.min()/1280,y.min()/720,(1279-x.max())/1280,(719-y.max())/720];minimum=[min(a,float(b)) for a,b in zip(minimum,margins)];failures+=int(min(margins)<.15)
 decoded+=1
fps=cap.get(cv2.CAP_PROP_FPS);cap.release();assert decoded==submitted and abs(fps-24)<1e-8 and failures==0,(decoded,fps,minimum)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();report=dict(file=out.name,sha256=sha(out),status='human review only; not approved show',frameCount=decoded,fps=24,seconds=decoded/24,joinsSeconds=[sum(counts[:i])/24 for i in range(1,5)],reserve=.15,reserveFailuresRGB4=failures,minimumMarginsLTRB=minimum,audioSampleRate=48000,audioSamples=len(audio),audioPeak=float(abs(audio).max()),inputs=[dict(file=str(p.relative_to(root)),sha256=sha(p),frames=n) for p,n in zip(sources,counts)],processing='Sequential decode of every original frame, fixed whole-frame letterbox fit and one24fps encode; contiguous48kHz sample soundtrack. No dropped/inserted/interpolated/reversed frames, animated resize or body crossfade. Four visible authored cuts. Original candidate SFX retained, deterministic nonmusical brown-air seed68178 for scary idle. One audiovisual movie; loop and four artistic joins unapproved.',generationCreditsSpent=0,humanMotionSoundJoinReview='pending',physicalProjection='unavailable')
out.with_suffix('.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:report[k] for k in ['file','frameCount','fps','seconds','audioSamples','reserveFailuresRGB4','minimumMarginsLTRB']}))
