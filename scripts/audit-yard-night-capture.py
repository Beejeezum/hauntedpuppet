"""Audit the recorded browser picture and sparse audio on their original timestamps.
MediaRecorder may omit silent audio packets; never concatenate those packets and
claim the resulting short PCM duration describes the complete performance.
"""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import numpy as np
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[1]
folder=ROOT/'work/yard-audio/chromium'
source=folder/'night-watch-dry-effects.webm'
ff=ROOT/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
run=subprocess.run([str(ff),'-hide_banner','-i',str(source),'-vf','showinfo','-an','-f','null','-'],stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,text=True,check=True)
pts=[float(x) for x in re.findall(r'pts_time:([\d.]+)',run.stderr)]
assert len(pts)>100 and pts[-1]>120
duration=pts[-1]+1/30
raw=subprocess.check_output([str(ff),'-v','error','-i',str(source),'-vn','-af','aresample=async=1:first_pts=0,apad','-t',str(duration),'-f','f32le','-ac','2','-ar','48000','pipe:1'])
audio=np.frombuffer(raw,dtype='<f4').reshape(-1,2)
report={'capture':str(source.relative_to(ROOT)),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'scope':'Actual browser picture/Web Audio capture, hardware bus silenced. Sparse audio packets expanded to their original timestamps. No physical projector or human listening approval.','videoFrames':len(pts),'durationSeconds':duration,'decodedAudioSeconds':len(audio)/48000,'decodedAudioPeak':float(abs(audio).max()),'clippedSamples':int(np.count_nonzero(abs(audio)>=.999)),'nonSilentHalfSecondWindows':[]}
for i in range(0,len(audio),24000):
 block=audio[i:i+24000]
 if abs(block).max()>.002:report['nonSilentHalfSecondWindows'].append({'at':i/48000,'peak':float(abs(block).max())})
assert abs(report['durationSeconds']-report['decodedAudioSeconds'])<.001
assert report['clippedSamples']==0
(folder/'capture-audit.json').write_text(json.dumps(report,indent=2)+'\n')
sheet=Image.new('RGB',(768,5*248),'#15191c');draw=ImageDraw.Draw(sheet)
for i,t in enumerate([4,17,42,55,65,78,89,101,114,122]):
 data=subprocess.check_output([str(ff),'-v','error','-ss',str(t),'-i',str(source),'-frames:v','1','-vf','scale=384:216','-f','rawvideo','-pix_fmt','rgb24','pipe:1'])
 assert len(data)==384*216*3
 x=(i%2)*384;y=(i//2)*248;sheet.paste(Image.frombytes('RGB',(384,216),data),(x,y));draw.text((x+12,y+224),f'{t}s — actual browser render',fill='white')
sheet.save(folder/'contact.png')
print(json.dumps({k:v for k,v in report.items() if k!='nonSilentHalfSecondWindows'}))
