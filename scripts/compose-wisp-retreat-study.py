"""Video compositing study: preserve painted footage, animate a soft extinction matte.
Never rewrites original art/film. Not a new poof illustration or accepted performance.
"""
from pathlib import Path
import cv2,numpy as np,subprocess,json,hashlib,math
root=Path(__file__).resolve().parents[1]
source=root/'source/wisp-performance-reference/runway-pilots/scary-identity-study/wisp-scary-guided-turn-v18-safe-framing.mp4'
out=root.parent/'wisp-vision/wisp-turn-vapor-dissolve-v24.mp4'
ff=root/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
out.parent.mkdir(parents=True,exist_ok=True)
cap=cv2.VideoCapture(str(source));w=int(cap.get(3));h=int(cap.get(4));fps=24;n=int(cap.get(7))
rng=np.random.default_rng(2301);field=np.zeros((h,w),np.float32)
for sh,sw,weight in [(5,9,.45),(13,23,.3),(33,59,.18),(81,145,.07)]:
 noise=rng.random((sh,sw)).astype(np.float32);field+=cv2.resize(noise,(w,h),interpolation=cv2.INTER_CUBIC)*weight
field=(field-field.min())/(field.max()-field.min());field=cv2.GaussianBlur(field,(0,0),5)
cmd=[str(ff),'-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','bgr24','-s',f'{w}x{h}','-r','24','-i','pipe:0','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p',str(out)]
p=subprocess.Popen(cmd,stdin=subprocess.PIPE)
for i in range(n):
 ok,frame=cap.read();assert ok
 progress=max(0,min(1,(i-(n-25))/24))
 if progress:
  # Soft cloud-scale uneven extinction; no displaced/rotated body parts.
  drift=cv2.warpAffine(field,np.float32([[1,0,12*progress],[0,1,-20*progress]]),(w,h),borderMode=cv2.BORDER_REFLECT)
  cutoff=-.25+1.5*progress
  # Keep all painted regions connected in opacity: no isolated claw remnants.
  alpha=(1-progress)**1.4*(1-.35*progress*(1-drift))
  frame=np.round(frame.astype(np.float32)*alpha[:,:,None]).astype(np.uint8)
 # Articulated source supplies genuine side/back views; this pass adds a fixed-camera depth path.
 travel=max(0,min(1,(i/24-1)/4));ease=travel*travel*(3-2*travel)
 depth=1+5*ease;scale=1/depth
 dx=w*.14*math.sin(ease*math.pi*.85);dy=-h*.08*math.sin(ease*math.pi*.7)
 bank=8*math.sin(math.pi*ease)
 transform=cv2.getRotationMatrix2D((w/2,h/2),bank,scale)
 transform[0,2]+=dx;transform[1,2]+=dy
 frame=cv2.warpAffine(frame,transform,(w,h),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
 p.stdin.write(frame.tobytes())
for _ in range(48):p.stdin.write(bytes(w*h*3))
p.stdin.close();assert p.wait()==0;cap.release()
meta={'file':out.name,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'source':str(source.relative_to(root)),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'frames':n+48,'fps':24,'dissolveFrames':[n-25,n-1],'emptyHoldFrames':48,'spatialMethod':'Fixed-camera2.5D compositing: authored side/back video plus perspective scale1/(1+5*ease), curved offset and8degree bank; not a reconstructed3D model.', 'method':'Whole painted source film, deterministic multiscale coherent cloud-modulated opacity extinction during final second, then48 authored black frames. No interpolation, part displacement or generated starburst.','limits':'Compositing study, not native fluid simulation or new hand-drawn animation; does not create an outward poof, new source articulation, reappearance or a seamless loop. Needs normal-speed visual approval.'}
(root/'work/vapor-dissolve-v24.json').write_text(json.dumps(meta,indent=2)+'\n');print(out)
