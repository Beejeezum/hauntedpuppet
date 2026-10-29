import os,shutil
from pathlib import Path
import cv2,numpy as np,subprocess,json,hashlib
r=Path('source/wisp-performance-reference/tonight-demo');source=Path('source/wisp-performance-reference/runway-pilots/film-return-handoff-study/wisp-round-trip-v40-review.mp4');out=r/'story-prefix-picture-v1.mp4';assert not out.exists();assert hashlib.sha256(source.read_bytes()).hexdigest()=='40f4e00b9b26da6ea69206e2025bba0ae5473c84eabe7669f606a32f97bb68cf'
ff=os.environ.get('HAUNT_FFMPEG') or shutil.which('ffmpeg') or 'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1';e=subprocess.Popen([ff,'-hide_banner','-loglevel','error','-n','-f','rawvideo','-pix_fmt','bgr24','-s','1280x720','-r','24','-i','pipe:0','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(out)],stdin=subprocess.PIPE);c=cv2.VideoCapture(str(source));assert c.get(cv2.CAP_PROP_FPS)==24;n=0
smooth=lambda x:(lambda y:y*y*(3-2*y))(np.clip(x,0,1))
try:
 while n<364:
  ok,f=c.read();assert ok;t=n/24;b=f.max(2).astype(np.float32);a=smooth((b-12)/12)*smooth(t/.6);clean=np.rint(f.astype(np.float32)*a[:,:,None]).astype('uint8');clean[clean.max(2)<=3]=0;canvas=np.zeros((720,1280,3),dtype='uint8');canvas[54:666,96:1184]=cv2.resize(clean,(1088,612),interpolation=cv2.INTER_AREA);e.stdin.write(canvas.tobytes());n+=1
 c.release();e.stdin.close();assert e.wait()==0
except BaseException:
 e.kill();e.wait();raise
(r/'story-prefix-staging-v1.json').write_text(json.dumps({'source':str(source),'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'sourceFrameRange':[0,364],'frames':n,'fps':24,'chapters':[{'id':'friendly-showoff','frames':[0,122]},{'id':'cute-to-scary-morph','frames':[122,243]},{'id':'menacing-performance','frames':[243,364]}],'stageScale':.85,'blackMatte':'same smoothstep12..24 maxRGB as approved scare/apology','entry':'0.6second smoothstep opacity ramp over moving friendly performance; no tiny-dot arrival','sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'scope':'Existing reviewed-motion studies assembled; final context and exact joins remain human-review-pending. No old return morph appended; new approved scare/apology replaces it.'},indent=2))
