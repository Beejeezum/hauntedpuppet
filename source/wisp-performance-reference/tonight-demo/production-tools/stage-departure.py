import os,shutil
from pathlib import Path
import cv2,numpy as np,subprocess,json,hashlib
r=Path('source/wisp-performance-reference/tonight-demo');source=r/'departure-story-proof-v1.mp4';out=r/'departure-story-staged-v1.mp4';assert not out.exists();ff=os.environ.get('HAUNT_FFMPEG') or shutil.which('ffmpeg') or 'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
e=subprocess.Popen([ff,'-hide_banner','-loglevel','error','-n','-f','rawvideo','-pix_fmt','bgr24','-s','1280x720','-r','24','-i','pipe:0','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(out)],stdin=subprocess.PIPE)
c=cv2.VideoCapture(str(source));assert c.get(cv2.CAP_PROP_FPS)==24;n=0
smooth=lambda x:(lambda y:y*y*(3-2*y))(np.clip(x,0,1))
try:
 while True:
  ok,f=c.read()
  if not ok:break
  t=n/24;brightness=f.max(2).astype(np.float32);a=smooth((brightness-12)/12);depth=1-.6*smooth((t-2)/2);vapor=1-smooth((t-4.25)/1.05);clean=np.rint(f.astype(np.float32)*(a*vapor)[:,:,None]).astype('uint8');clean[clean.max(2)<=3]=0
  scale=.85*depth;tx=.85*800*(1-depth)+.15*640;ty=.85*340*(1-depth)+.15*360
  canvas=cv2.warpAffine(clean,np.array([[scale,0,tx],[0,scale,ty]],dtype=np.float32),(1280,720),flags=cv2.INTER_AREA,borderMode=cv2.BORDER_CONSTANT);e.stdin.write(canvas.tobytes());n+=1
 c.release();e.stdin.close();assert e.wait()==0
except BaseException:
 e.kill();e.wait();raise
report={'source':source.name,'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'output':out.name,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'frames':n,'fps':24,'stageScale':.85,'vanishingPointSourcePixels':[800,340],'additionalDepthScale':'1 to .4, smoothstep between2and4seconds; fixed.4duringactualvaporphase','vaporDissipation':'opacity smoothstep1to0 between4.25and5.3seconds over alreadydeforming nativefog, not intactbodyfade','blackMatte':'same smoothstep12..24 maxRGB asapprovedscare/apology','scope':'Existing generated backturn/curvedflight retained; authored screen-space depth staging corrects raw25percentbodytoward10percent, no retiming/reversal/crop, finalvaporspeckremovedwithplannedfogdissipation. Not autonomous3Drig or physicalprojection acceptance.'};(r/'departure-story-staging-v1.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
