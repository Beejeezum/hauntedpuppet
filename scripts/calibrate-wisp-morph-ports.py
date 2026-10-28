"""Calibrate authored morph staging by cropping only verified black matte.
Preserves all source frames and AAC packets; no overwrite or approval change.
"""
from pathlib import Path
import json,hashlib,subprocess,cv2,numpy as np,os,shutil
root=Path(__file__).resolve().parents[1];folder=root/'source/wisp-performance-reference/button-cue-batch';ff=Path(os.environ.get('FFMPEG') or shutil.which('ffmpeg') or root/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1')
for cue in ['cute-to-evil','evil-to-cute']:
 old=folder/(cue+'-runtime-candidate-v1.mp4');out=folder/(cue+'-runtime-candidate-v2.mp4');meta=json.loads(old.with_suffix('.json').read_text())
 cap=cv2.VideoCapture(str(old));outsidePeak=0;count=0
 while True:
  ok,frame=cap.read()
  if not ok:break
  assert frame.shape[:2]==(1080,1920)
  outsidePeak=max(outsidePeak,int(frame[:81].max()),int(frame[999:].max()),int(frame[:,:144].max()),int(frame[:,1776:].max()));count+=1
 cap.release();assert count==121 and outsidePeak<=4,(cue,outsidePeak)
 filt='format=rgb24,crop=1632:918:144:81:exact=1,scale=1280:720:flags=lanczos,format=yuv420p'
 subprocess.run([str(ff),'-v','error','-n','-i',str(old),'-map','0:v:0','-map','0:a:0','-vf',filt,'-c:v','libx264','-preset','slow','-crf','18','-c:a','copy','-movflags','+faststart',str(out)],check=True)
 cap=cv2.VideoCapture(str(out));fail={str(t):0 for t in (4,8,16)};margins={str(t):[1.]*4 for t in (4,8,16)};n=0
 while True:
  ok,frame=cap.read()
  if not ok:break
  h,w=frame.shape[:2];bright=frame.max(axis=2)
  for t in (4,8,16):
   y,x=np.where(bright>t)
   if len(x):
    m=[x.min()/w,y.min()/h,(w-1-x.max())/w,(h-1-y.max())/h];margins[str(t)]=[min(a,float(b)) for a,b in zip(margins[str(t)],m)];fail[str(t)]+=int(min(m)<.15)
  n+=1
 cap.release();assert n==121 and not any(fail.values()),(cue,fail,margins)
 def audio_hash(p):return subprocess.check_output([str(ff),'-v','error','-i',str(p),'-map','0:a:0','-c','copy','-f','hash','-hash','sha256','pipe:1'],text=True).strip()
 assert audio_hash(old)==audio_hash(out)
 meta.update(file=out.name,sha256=hashlib.sha256(out.read_bytes()).hexdigest(),videoEssenceIdentical=False,calibrationSource=old.name,calibrationSourceSha256=hashlib.sha256(old.read_bytes()).hexdigest(),compressedVideoEssence=None,frameCount=n,framing=dict(reserve=.15,reserveFailures=fail,minimumMarginsLTRB=margins),staticViewportCalibration=dict(filter=filt,removedBorderMaximumRGB=outsidePeak,removedBorderOnly=True),audioPacketsIdenticalToV1=True,processing='Static85percent source viewport calibration into canonical1280x720 staging. Only black matte is cropped; frame order, timing, anatomy and source painted performance retained. Video re-encoded once atCRF18; AAC audio packets copied unchanged. No animated resize, warping, crossfade, reversal or added frames.')
 out.with_suffix('.json').write_text(json.dumps(meta,indent=2)+'\n');print(json.dumps(dict(cue=cue,frames=n,removedBorderPeak=outsidePeak,reserveFailures=fail,minimumMargins=margins,audioCopied=True)))
