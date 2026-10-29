"""Stage native whole-body acting along a fixed-scale drift behind the lettering.

No new provider call. Retains the real wave/backturn, full body/arm motion and
smoke puff. Only the separated whole-character layer follows an authored translation
path, without shrinking. This is 2.5D compositing, not an autonomous 3D character rig.
"""
from pathlib import Path
import hashlib,json,os,shutil,subprocess
import cv2
import numpy as np
root=Path('source/wisp-performance-reference/tonight-demo')
output=root/'departure-drift-staged-v7.mp4';report=output.with_suffix('.json')
if output.exists() or report.exists():raise SystemExit('Preserve existing departure export')
sources=[(root/'departure-story-revised-v2.mp4',36),(root/'departure-flight-revised-v3.mp4',None)]
for path,_ in sources:
    if not path.is_file():raise SystemExit('Missing native source')
def smooth(x):
    x=np.clip(x,0,1);return x*x*(3-2*x)
def matte(f):
    a=smooth((f.max(2).astype(np.float32)-12)/12)
    f=np.rint(f.astype(np.float32)*a[:,:,None]).astype('uint8');f[f.max(2)<=3]=0
    return f
ff=os.environ.get('HAUNT_FFMPEG') or shutil.which('ffmpeg') or 'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
encoder=subprocess.Popen([ff,'-hide_banner','-loglevel','error','-n','-f','rawvideo','-pix_fmt','bgr24','-s','1280x720','-r','24','-i','pipe:0','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(output)],stdin=subprocess.PIPE)
count=0;clips=[]
try:
    for source,limit in sources:
        cap=cv2.VideoCapture(str(source));assert cap.isOpened() and abs(cap.get(cv2.CAP_PROP_FPS)-24)<.001;n=0
        while limit is None or n<limit:
            ok,f=cap.read()
            if not ok:break
            assert f.shape==(720,1280,3)
            f=matte(f)
            ghost=f.copy();ghost[:,470:]=0
            letters=f.copy();letters[:,:470]=0
            if limit is None:
                t=n/24;p=smooth(t/2.6);depth=1
                x=390+80*p;y=340+35*p
                transform=np.array([[depth,0,x-depth*270],[0,depth,y-depth*340]],np.float32)
            else:
                # Counter the native leftward turn with a continuous rightward
                # flight lead; match its endpoint at the exact frame36 join.
                transform=np.array([[1,0,120*smooth(n/36)],[0,1,0]],np.float32)
            ghost=cv2.warpAffine(ghost,transform,(1280,720),flags=cv2.INTER_AREA)
            occlusion=smooth((letters.max(2).astype(np.float32)-8)/72)
            ghost=ghost.astype(np.float32)*(1-occlusion[:,:,None])
            f=np.rint(255-(255-ghost)*(255-letters.astype(np.float32))/255).astype('uint8')
            f=cv2.warpAffine(f,np.array([[.85,0,96],[0,.85,54]],np.float32),(1280,720),flags=cv2.INTER_AREA)
            encoder.stdin.write(f.tobytes());n+=1;count+=1
        cap.release();clips.append({'file':source.name,'frames':n,'sha256':hashlib.sha256(source.read_bytes()).hexdigest()})
    encoder.stdin.close();assert encoder.wait()==0
except BaseException:
    encoder.kill();encoder.wait();raise
report.write_text(json.dumps({'frames':count,'fps':24,'sources':clips,'stageFit':.85,'depth':'NO animated scale: whole-character transform linear scale stays1.0; constant outerstage fit.85','path':'wave/backturn lead120px over36frames, then gentle80px right/35px down drift over2.6sec; native body and vapor motion preserved','blackGapLayerSplitX':470,'releaseApproved':False,'scope':'Authored2.5D depth staging of real full-body video; no separate body-part puppeting or retiming. Must inspect anatomy/layer separation, actual joins, scale and vapor motion, bounds and human direction before final acceptance.','sha256':hashlib.sha256(output.read_bytes()).hexdigest()},indent=2))
print(output)
