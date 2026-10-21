"""Join the retained native wave/backturn to its newly anchored native flight.

Frames0..35 of the six-second study end immediately before the exact frame36
used to seed the flight. No crop, pose warp, crossfade or time interpolation.
Actual full-resolution join and full movie still need review.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import cv2

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--flight',required=True,type=Path)
parser.add_argument('--output',required=True,type=Path)
args=parser.parse_args()
report=args.output.with_suffix('.json')
if args.output.exists() or report.exists():
    raise SystemExit('Preserve existing departure review')
root=Path('source/wisp-performance-reference/tonight-demo')
sources=[(root/'departure-story-revised-v2.mp4',36),(args.flight,None)]
for file,_ in sources:
    if not file.is_file():raise SystemExit('Missing native source')
ff=os.environ.get('HAUNT_FFMPEG') or shutil.which('ffmpeg') or 'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
encoder=subprocess.Popen([ff,'-hide_banner','-loglevel','error','-n','-f','rawvideo','-pix_fmt','bgr24','-s','1280x720','-r','24','-i','pipe:0','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(args.output)],stdin=subprocess.PIPE)
clips=[]
try:
    for path,limit in sources:
        cap=cv2.VideoCapture(str(path))
        if not cap.isOpened() or abs(cap.get(cv2.CAP_PROP_FPS)-24)>.001:raise RuntimeError('Expected native24fps')
        count=0
        while limit is None or count<limit:
            ok,frame=cap.read()
            if not ok:break
            if frame.shape!=(720,1280,3):raise RuntimeError('Expected native1280x720')
            encoder.stdin.write(frame.tobytes());count+=1
        cap.release()
        if limit is not None and count!=limit:raise RuntimeError('Incomplete selected wave/backturn')
        if count<24:raise RuntimeError('Incomplete selected native flight')
        clips.append({'file':str(path),'frames':count,'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest()})
    encoder.stdin.close()
    if encoder.wait()!=0:raise RuntimeError('Encode failed')
except BaseException:
    encoder.kill();encoder.wait();raise
report.write_text(json.dumps({'frames':sum(c['frames'] for c in clips),'fps':24,'clips':clips,'joinAtFrame':36,'sha256':hashlib.sha256(args.output.read_bytes()).hexdigest(),'releaseApproved':False,'scope':'Native-frame assembly only; source motion and actual join, fog geometry and boundaries remain subject to review.'},indent=2))
print(args.output)
