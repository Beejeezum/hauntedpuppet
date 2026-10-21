"""Review the real writing-to-departure join without spending generation credits.

The suspended lettering here is a temporary plate, not the finished bat scene.
Run from repository root; requires OpenCV, numpy and ffmpeg. No overwrite.
"""
from pathlib import Path
import os, shutil, subprocess, json, hashlib
import cv2
import numpy as np
root = Path('source/wisp-performance-reference/tonight-demo')
output = root / 'writing-departure-handoff-v4.mp4'
report = output.with_suffix('.json')
if output.exists() or report.exists():
    raise SystemExit('Preserve existing handoff export')
ff = os.environ.get('HAUNT_FFMPEG') or shutil.which('ffmpeg') or 'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
def smooth(x):
    x = np.clip(x, 0, 1)
    return x*x*(3-2*x)
def matte(f):
    f = np.rint(f.astype(np.float32)*smooth((f.max(2).astype(np.float32)-12)/12)[:,:,None]).astype('uint8')
    f[f.max(2)<=3] = 0
    return f
letter = cv2.imread(str(root/'writing-final-letter-layer-frame.png'))
assert letter.shape == (720,1280,3)
letter = cv2.warpAffine(matte(letter), np.array([[.85,0,96],[0,.85,54]],np.float32),(1280,720),flags=cv2.INTER_AREA)
e = subprocess.Popen([ff,'-hide_banner','-loglevel','error','-n','-f','rawvideo','-pix_fmt','bgr24','-s','1280x720','-r','24','-i','pipe:0','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(output)],stdin=subprocess.PIPE)
counts = []
try:
    for name, tail in [('writing-story-staged-v1.mp4',36),('departure-story-staged-v1.mp4',None)]:
        cap=cv2.VideoCapture(str(root/name));assert cap.isOpened() and cap.get(cv2.CAP_PROP_FPS)==24
        total=int(cap.get(cv2.CAP_PROP_FRAME_COUNT));start=total-tail if tail else 0
        cap.set(cv2.CAP_PROP_POS_FRAMES,start);count=0
        while True:
            ok,f=cap.read()
            if not ok:break
            if tail is None:
                # Match the writing endpoint's authored leftward staging, then
                # ease out that offset as the native backturn travels into depth.
                offset=-289*(1-smooth(count/24/2.4))
                f=cv2.warpAffine(f,np.array([[1,0,offset],[0,1,0]],np.float32),(1280,720),flags=cv2.INTER_LINEAR)
                f=np.rint(255-(255-f.astype(np.float32))*(255-letter.astype(np.float32))/255).astype('uint8')
            e.stdin.write(f.tobytes());count+=1
        cap.release();counts.append(count)
    e.stdin.close();assert e.wait()==0
except BaseException:
    e.kill();e.wait();raise
assert counts==[36,145]
report.write_text(json.dumps({'status':'join study, not a finished story or runtime asset','frames':sum(counts),'fps':24,'joinAtFrame':36,'sourcePictures':['writing-story-staged-v1.mp4','departure-story-staged-v1.mp4'],'departureXOffset':'-289px; smoothstep to zero between 0 and 2.4 seconds to retain waving-hand safety clearance','lettering':'temporary held source plate, to be replaced by corrected native bat footage; no claim of finished fog motion','sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'releaseApproved':False},indent=2))
print(output)
