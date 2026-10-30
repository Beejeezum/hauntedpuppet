"""Prepare cached fictional Wisp pictures/audio for the private jaw mechanism test.
No provider, camera, microphone, user recordings or running server is involved.
"""
from pathlib import Path
import hashlib,json,subprocess,wave
import numpy as np
ROOT=Path(__file__).resolve().parents[1];WORK=ROOT/'work/scary-neutral-jaw-proof-v1';WORK.mkdir(exist_ok=True)
ff=ROOT/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
sources={
 'body':('source/wisp-art-reference/scary-speaking-study/neutral-motion-base-study/scary-neutral-body-base-v1.mp4','27ac763bbf5d6349737b751a22abae5adba410872a5fd2d08b4bd483157750eb'),
 'oral':('source/wisp-performance-reference/runway-pilots/motion-transfer-study/wisp-scary-motion-transfer-v35.mp4','21e8efec67ec7e024fc954cc16af458cad8f8427553a998341ff9d37286ca35a'),
 'voice':('source/wisp-performance-reference/tonight-demo/apology-proof-v1.mp4','d4dfefcfb62bbff4f32ba7b047a28a4bda5ab7b4def711c368f08d23213e819d')}
for filename,sha in sources.values():assert hashlib.sha256((ROOT/filename).read_bytes()).hexdigest()==sha
frames=WORK/'frames';frames.mkdir(exist_ok=True)
if not list(frames.glob('*.png')):subprocess.run([str(ff),'-v','error','-i',str(ROOT/sources['body'][0]),'-start_number','0','-fps_mode','passthrough',str(frames/'%04d.png')],check=True)
assert all((frames/f'{i:04d}.png').exists() for i in range(193))
if not (WORK/'native-oral.png').exists():subprocess.run([str(ff),'-v','error','-i',str(ROOT/sources['oral'][0]),'-frames:v','1',str(WORK/'native-oral.png')],check=True)
voice=WORK/'approved-apology-master.wav'
if not voice.exists():subprocess.run([str(ff),'-v','error','-i',str(ROOT/sources['voice'][0]),'-vn','-ac','1','-ar','48000','-c:a','pcm_s16le',str(voice)],check=True)
with wave.open(str(voice)) as w:
 assert w.getsampwidth()==2 and w.getnchannels()==1 and w.getframerate()==48000
 raw=w.readframes(w.getnframes())
assert hashlib.sha256(raw).hexdigest()=='2c0dca44096dfac9d7dfdf0e7594b010cd722cafec53d687f2b740aadb7988a5'
a=np.frombuffer(raw,'<i2')/32768;rows=[];previous=0
for i in range(193):
 center=round(i/24*48000);s=a[max(0,center-960):min(len(a),center+960)];rms=float(np.sqrt(np.mean(s*s))) if len(s) else 0
 target=float(np.clip((rms-.006)/.065,0,1));previous+=(target-previous)*(.75 if target>previous else .5);rows.append({'frame':i,'rms':rms,'open':previous})
(WORK/'apology-envelope.json').write_text(json.dumps({'source':str(voice.relative_to(ROOT)),'sourceSha256':hashlib.sha256(voice.read_bytes()).hexdigest(),'duration':len(a)/48000,'rows':rows,'scope':'Prerecorded amplitude-driven jaw attachment audition. Not phoneme timing, OO/EE, final scary voice or live latency.'},indent=2)+'\n')
(WORK/'inputs.json').write_text(json.dumps({'sources':sources,'frameCount':193,'voicePcmSha256':hashlib.sha256(raw).hexdigest(),'scope':'Known decoded offline frame ordinals only. Live picture identity matching remains required.'},indent=2)+'\n')
print('Prepared193known source pictures, oral diagnostic and the existing approved apology PCM;0new credits')
