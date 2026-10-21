"""Whole-frame projection fit and black-level cleanup for a selected closing film.

Never repairs source clipping or anatomy. Keep the raw source and review it
separately. No crop, interpolation, timing edits, depth scaling or overwrites.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import cv2
import numpy as np

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('source',type=Path)
parser.add_argument('output',type=Path)
args=parser.parse_args()
report=args.output.with_suffix('.json')
if args.output.exists() or report.exists():
    raise SystemExit('Preserve existing staged film')
cap=cv2.VideoCapture(str(args.source))
if not cap.isOpened() or abs(cap.get(cv2.CAP_PROP_FPS)-24)>.001:
    raise SystemExit('Expected complete native 24fps source; do not silently retime')
w,h=int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
scale=.85*min(1280/w,720/h)
transform=np.array([[scale,0,(1280-w*scale)/2],[0,scale,(720-h*scale)/2]],np.float32)
ff=os.environ.get('HAUNT_FFMPEG') or shutil.which('ffmpeg') or 'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
encoder=subprocess.Popen([ff,'-hide_banner','-loglevel','error','-n','-f','rawvideo','-pix_fmt','bgr24','-s','1280x720','-r','24','-i','pipe:0','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(args.output)],stdin=subprocess.PIPE)
count=0
try:
    while True:
        ok,frame=cap.read()
        if not ok:break
        a=np.clip((frame.max(2).astype(np.float32)-12)/12,0,1)
        a=a*a*(3-2*a)
        frame=np.rint(frame.astype(np.float32)*a[:,:,None]).astype('uint8')
        frame[frame.max(2)<=3]=0
        stage=cv2.warpAffine(frame,transform,(1280,720),flags=cv2.INTER_AREA,borderMode=cv2.BORDER_CONSTANT)
        encoder.stdin.write(stage.tobytes());count+=1
    cap.release();encoder.stdin.close()
    if encoder.wait()!=0:raise RuntimeError('Encoding failed')
except BaseException:
    encoder.kill();encoder.wait();raise
report.write_text(json.dumps({'source':str(args.source),'sourceSha256':hashlib.sha256(args.source.read_bytes()).hexdigest(),'output':str(args.output),'sha256':hashlib.sha256(args.output.read_bytes()).hexdigest(),'sourceSize':[w,h],'frames':count,'fps':24,'stageFit':.85,'blackMatte':'same smoothstep12..24 maxRGB as approved scare/apology; maxRGB<=3 becomes black','scope':'Constant whole-frame fit preserves source framing/timing. Does not restore source-clipped wings or fix rejected body motion. Raw and staged video both need review.'},indent=2))
print(json.dumps({'file':str(args.output),'frames':count}))
