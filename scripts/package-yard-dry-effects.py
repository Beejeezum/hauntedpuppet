"""Reuse existing dry, nonmusical air gestures as an optional browser sound palette.
No provider, voice, new noise synthesis or source overwrite. New mix is unapproved.
"""
from pathlib import Path
import hashlib
import json
import subprocess
import wave
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'source/wisp-performance-reference/button-cue-batch/wisp-morph-dry-swishes-v2.wav'
OUT=ROOT/'source/attraction-v2/console/media'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(SOURCE)=='040f3712ba542d39d2a587d6a11fbeb4e4ea4e87a61c7e2689eeb11e2e2ab715'
with wave.open(str(SOURCE)) as source:
 assert (source.getframerate(),source.getsampwidth(),source.getnchannels())==(48000,2,2)
 pcm=np.frombuffer(source.readframes(source.getnframes()),dtype='<i2').reshape(-1,2).astype(float)/32768
rate=48000
plans=[('wake',1.5,.55,.40),('drift',6.45,1.15,.60),('vapor',16.1,1.05,.60)]
palette=np.zeros((round(4.1*rate),2),float);offset=.2;cues={}
for name,start,duration,target in plans:
 block=pcm[round(start*rate):round((start+duration)*rate)].copy()
 block*=target/max(abs(block).max(),1e-9)
 # Quiet exact edges protect independently triggered playback from click artifacts.
 edge=round(.025*rate);ramp=np.linspace(0,1,edge)
 block[:edge]*=ramp[:,None];block[-edge:]*=ramp[::-1,None]
 at=round(offset*rate);palette[at:at+len(block)]=block
 cues[name]={'offset':offset,'duration':duration,'sourceSeconds':[start,start+duration],'peak':float(abs(block).max())}
 offset+=duration+.2
work=ROOT/'work/yard-audio';work.mkdir(parents=True,exist_ok=True)
wav=work/'dry-air-palette.wav'
with wave.open(str(wav),'wb') as target:
 target.setframerate(rate);target.setnchannels(2);target.setsampwidth(2);target.writeframes((palette*32767).astype('<i2').tobytes())
ff=ROOT/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
output=OUT/'dry-air-palette.mp4'
subprocess.run([str(ff),'-v','error','-y','-i',str(wav),'-c:a','aac','-b:a','160k','-movflags','+faststart',str(output)],check=True)
decoded=np.frombuffer(subprocess.check_output([str(ff),'-v','error','-i',str(output),'-f','f32le','-ac','2','-ar',str(rate),'pipe:1']),dtype='<f4').reshape(-1,2)
assert abs(decoded).max()<.8
manifest={'schema':1,'url':'./media/dry-air-palette.mp4','sha256':sha(output),'bytes':output.stat().st_size,'cues':cues,'sampleRate':rate,'channels':2,'source':str(SOURCE.relative_to(ROOT)),'sourceSha256':sha(SOURCE),'scope':'Audio-only AAC container; repackaged original dry air gestures, no score, voice or new generation. New level/timing needs human listening acceptance.','humanApproval':False,'generationCredits':0,'decodedPeak':float(abs(decoded).max()),'decodedSamples':len(decoded)}
(OUT/'dry-air-palette.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'file':str(output.relative_to(ROOT)),'bytes':output.stat().st_size,'decodedPeak':manifest['decodedPeak'],'cues':list(cues),'credits':0}))
