"""Decode the actual master score and check continuity/effect presence, not human mix quality."""
from pathlib import Path
import hashlib,json,re,os,shutil,subprocess
import numpy as np
ROOT=Path(__file__).resolve().parents[1];FOLDER=ROOT/'source/wisp-performance-reference/button-cue-batch'
FF=os.environ.get('FFMPEG') or shutil.which('ffmpeg') or str(ROOT/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1')
data=json.loads((FOLDER/'wisp-eyes-context-review-v1.json').read_text());movie=FOLDER/data['file']
assert hashlib.sha256(movie.read_bytes()).hexdigest()==data['sha256']
decoded=np.frombuffer(subprocess.check_output([FF,'-v','error','-i',str(movie),'-map','0:a:0','-ac','2','-ar','48000','-f','f32le','pipe:1']),dtype='<f4').reshape(-1,2)
assert data['audioSamples']<=len(decoded)<=data['audioSamples']+1024
assert np.isfinite(decoded).all() and float(abs(decoded).max())<.3
v7=json.loads((FOLDER/'wisp-morph-roundtrip-review-v7.json').read_text());eyes=json.loads((FOLDER/'scary-eyes-runtime-candidate-v1.json').read_text())
windows=[]
for start,duration,*_ in v7['soundRevision']['events']:
    shifted=start+(241/24 if start>=243/24 else 0)
    windows.append(('original dry effect',shifted,shifted+duration))
for event in eyes['audioRecipe']['events']:windows.append((event['label'],243/24+event['start'],243/24+event['end']))
events=[]
for label,start,end in sorted(windows,key=lambda w:w[1]):
    a=decoded[round(start*48000):round(end*48000)]
    rms=float(np.sqrt(np.mean(a.astype(np.float64)**2)));peak=float(abs(a).max());assert rms>.0002,(label,start,rms)
    events.append({'label':label,'start':start,'end':end,'decodedRms':rms,'decodedPeak':peak})
log=subprocess.run([FF,'-hide_banner','-i',str(movie),'-vn','-af','ashowinfo','-f','null','-'],capture_output=True,text=True,check=True).stderr
blocks=[(float(t),int(n)) for t,n in re.findall(r'pts_time:\s*([-\d.]+).*?nb_samples:(\d+)',log)]
assert blocks
position=0;maxerror=0
for at,n in blocks:maxerror=max(maxerror,abs(at-position/48000));position+=n
assert maxerror<.0001,'Decoded audio presentation gap'
head=float(abs(decoded[:24000]).max());tail=float(abs(decoded[data['audioSamples']-24000:data['audioSamples']]).max());assert head==0 and tail==0
report={'passed':True,'movie':movie.name,'sha256':data['sha256'],'sampleRate':48000,'sourceSamples':data['audioSamples'],'decodedSamplesIncludingAacPadding':len(decoded),'continuousAudioBlocks':len(blocks),'maximumTimestampErrorSeconds':maxerror,'peak':float(abs(decoded).max()),'firstHalfSecondPeak':head,'lastHalfSecondPeak':tail,'expectedEffects':events,'scope':'Actual encoded AAC decode and monotonic contiguous presentation clock, all10expected dry effect windows have nonzero energy, quiet handles preserved. Intentional gaps remain quiet; no human listening, perceived mix/sync/voice or physical projection acceptance.'}
(FOLDER/'wisp-eyes-context-audio-validation-v1.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
