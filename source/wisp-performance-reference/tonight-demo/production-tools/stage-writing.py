import os,shutil
from pathlib import Path
import cv2,numpy as np,subprocess,json,hashlib
r=Path('source/wisp-performance-reference/tonight-demo');source=r/'writing-story-proof-v1.mp4';out=r/'writing-story-staged-v1.mp4';assert not out.exists();ff=os.environ.get('HAUNT_FFMPEG') or shutil.which('ffmpeg') or 'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1';e=subprocess.Popen([ff,'-hide_banner','-loglevel','error','-n','-f','rawvideo','-pix_fmt','bgr24','-s','1280x720','-r','24','-i','pipe:0','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(out)],stdin=subprocess.PIPE);c=cv2.VideoCapture(str(source));n=0
smooth=lambda x:(lambda y:y*y*(3-2*y))(np.clip(x,0,1))
try:
 while True:
  ok,f=c.read()
  if not ok:break
  t=n/24;fit=.85-.13*smooth((t-.75)/1.25)+.13*smooth((t-5.25)/.75);b=f.max(2).astype(np.float32);a=smooth((b-12)/12);clean=np.rint(f.astype(np.float32)*a[:,:,None]).astype('uint8');clean[clean.max(2)<=3]=0;matrix=np.array([[fit,0,640*(1-fit)],[0,fit,360*(1-fit)]],dtype=np.float32);canvas=cv2.warpAffine(clean,matrix,(1280,720),flags=cv2.INTER_AREA,borderMode=cv2.BORDER_CONSTANT);e.stdin.write(canvas.tobytes());n+=1
 c.release();e.stdin.close();assert e.wait()==0
except BaseException:
 e.kill();e.wait();raise
(r/'writing-story-staging-v1.json').write_text(json.dumps({'source':source.name,'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'output':out.name,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'frames':n,'fps':24,'fit':'Entry.85; smoothstep to.72 during.75..2seconds; hold.72 until5.25; smoothstepreturn.85 by6seconds','blackMatte':'same smoothstep12..24 maxRGB as approved scare/apology','scope':'Authored whole-frame safety envelope, no art crop or time interpolation/retiming; entry/exit keep.85 authored pose scale. Rawsource15percentreserve fails; stagedpicture requires its own allframe checks and human review.'},indent=2))
