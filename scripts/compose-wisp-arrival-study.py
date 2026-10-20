"""Cost-free spatial arrival study from existing articulated painted footage.
Requires OpenCV/numpy and the existing local FFmpeg binary. Source remains unchanged.
A2.5D composite, not new3D geometry, new poses, a native poof, or an accepted loop.
"""
from pathlib import Path
import cv2,numpy as np,subprocess,hashlib,json,math
root=Path(__file__).resolve().parents[1]
source=root/'source/wisp-performance-reference/runway-pilots/wisp-continuous-idle-v15.mp4'
out=root.parent/'wisp-vision/wisp-friendly-arrival-v26.mp4';out.parent.mkdir(parents=True,exist_ok=True)
cap=cv2.VideoCapture(str(source));w=int(cap.get(3));h=int(cap.get(4));n=int(cap.get(7));assert cap.isOpened() and n>24
ff=root/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
p=subprocess.Popen([str(ff),'-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','bgr24','-s',f'{w}x{h}','-r','24','-i','pipe:0','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p',str(out)],stdin=subprocess.PIPE)
for _ in range(12):p.stdin.write(bytes(w*h*3))
for i in range(n):
 ok,frame=cap.read();assert ok
 phase=i/(n-1);ease=phase*phase*(3-2*phase)
 scale=.7/(1+5*(1-ease))
 bank=-6*math.sin(math.pi*ease)
 transform=cv2.getRotationMatrix2D((w/2,h/2),bank,scale)
 transform[0,2]+=w*.15*math.cos(ease*math.pi/2)
 transform[1,2]-=h*.07*math.sin(math.pi*ease)
 frame=cv2.warpAffine(frame,transform,(w,h),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
 arrival=min(1,i/18);alpha=arrival*arrival*(3-2*arrival)
 frame=np.round(frame.astype(np.float32)*alpha).astype(np.uint8)
 p.stdin.write(frame.tobytes())
p.stdin.close();assert p.wait()==0;cap.release()
meta={'file':out.name,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'source':str(source.relative_to(root)),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'frames':n+12,'fps':24,'authoredOpeningBlackFrames':12,'method':'Unretimed fuller articulated v15 footage, fixed-camera curved perspective approach with6degree bank, safe70percent near fit,12black opening frames and18-frame opacity reformation. No interpolation or reversal.','limits':'Existing painted pose motion plus2.5D compositing, not additional3D articulation or an outward poof. Ending has no validated join to another film; not a finished loop or live interaction proof.'}
(root/'work/friendly-arrival-v26.json').write_text(json.dumps(meta,indent=2)+'\n');print(out)
