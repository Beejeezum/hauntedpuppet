import os,shutil
from pathlib import Path
import cv2,numpy as np,subprocess,json,hashlib
root=Path('source/wisp-performance-reference/tonight-demo');ff=os.environ.get('HAUNT_FFMPEG') or shutil.which('ffmpeg') or 'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
out=root/'scare-apology-picture-review-v1.mp4';assert not out.exists()
encoder=subprocess.Popen([ff,'-hide_banner','-loglevel','error','-n','-f','rawvideo','-pix_fmt','bgr24','-s','1280x720','-r','24','-i','pipe:0','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(out)],stdin=subprocess.PIPE)
counts=[];ends=[]
try:
 for filename in ['roar-recovery-proof-v2.mp4','apology-proof-v1.mp4']:
  c=cv2.VideoCapture(str(root/filename));assert abs(c.get(cv2.CAP_PROP_FPS)-24)<.001;n=0;first=None;last=None
  while True:
   ok,f=c.read()
   if not ok:break
   brightness=f.max(2).astype(np.float32);x=np.clip((brightness-12)/12,0,1);a=x*x*(3-2*x);clean=np.rint(f.astype(np.float32)*a[:,:,None]).astype('uint8');clean[clean.max(2)<=3]=0
   canvas=np.zeros((720,1280,3),dtype='uint8');scaled=cv2.resize(clean,(1088,612),interpolation=cv2.INTER_AREA);canvas[54:666,96:1184]=scaled
   encoder.stdin.write(canvas.tobytes());n+=1
   if first is None:first=canvas.copy()
   last=canvas
  c.release();counts.append(n);ends.append((first,last))
 encoder.stdin.close();assert encoder.wait()==0
except BaseException:
 encoder.kill();encoder.wait();raise
before,after=ends[0][1],ends[1][0];mask=(before.max(2)>16)|(after.max(2)>16)
report={'sources':['roar-recovery-proof-v2.mp4','apology-proof-v1.mp4'],'frames':counts,'fps':24,'duration':sum(counts)/24,'stageScale':.85,'blackMatte':'RGB multiplied by smoothstep(12,24,maxRGB); resulting RGB<=3 set to black','scope':'Fixed whole-frame fit and soft black-level cleanup, no crop, interpolation of time, retiming, pose registration or crossfade. Exact straight cut requires human playback review. Not final story or physical projection acceptance.','joinAtFrame':counts[0],'joinAtSeconds':counts[0]/24,'joinVisibleRGBDifference':float(np.abs(before.astype(float)-after.astype(float))[mask].mean()),'sha256':hashlib.sha256(out.read_bytes()).hexdigest()};(root/'scare-apology-edit-review-v1.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
