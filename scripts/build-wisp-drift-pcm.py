"""Rebuild idle audio from decoded PCM; preserve compressed painted pictures."""
from pathlib import Path
import subprocess,hashlib,json
import numpy as np
R=Path(__file__).resolve().parents[1]
F=R/'source/wisp-performance-reference/button-cue-batch'
FF=R/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
d=json.loads((F/'friendly-drift-candidate-v1.json').read_text())
src=R/d['videoSource']; sound=R/d['audioSource']; rate=48000; total=244000
assert hashlib.sha256(src.read_bytes()).hexdigest()=='52d54d03c0f0406a9724c7c04b9e2fa0557a675486edfaa40fd0ca2e24a682bd'
assert hashlib.sha256(sound.read_bytes()).hexdigest()=='12ee31d2a08bb8d581de4bdddd04e037dc2b37d902e1865c35f9d55f7cbe1206'
pcm=np.frombuffer(subprocess.check_output([str(FF),'-v','error','-i',str(sound),'-ac','2','-ar',str(rate),'-f','f32le','pipe:1']),dtype='<f4').reshape(-1,2).copy()
assert len(pcm)>rate and np.isfinite(pcm).all()
overlap=1920; result=pcm.copy(); joins=[]
while len(result)<total:
    start=len(result)-overlap; joins.append(start)
    theta=np.linspace(0,np.pi/2,overlap,endpoint=True)[:,None]
    mix=result[-overlap:]*np.cos(theta)+pcm[:overlap]*np.sin(theta)
    result=np.concatenate([result[:-overlap],mix,pcm[overlap:]])
result=result[:total]*.8
result[:12000]*=np.linspace(0,1,12000)[:,None]
result[-24000:]*=np.linspace(1,0,24000)[:,None]
assert np.max(abs(result))<.98
out=F/'friendly-drift-candidate-v2.mp4'
subprocess.run([str(FF),'-v','error','-y','-i',str(src),'-f','f32le','-ar',str(rate),'-ac','2','-i','pipe:0','-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart',str(out)],input=result.astype('<f4').tobytes(),check=True)
def essence(p):
    return subprocess.check_output([str(FF),'-v','error','-i',str(p),'-map','0:v:0','-c','copy','-f','hash','-hash','sha256','pipe:1']).decode().strip()
assert essence(src)==essence(out)==d['compressedVideoEssence']
d.update(file=out.name,sha256=hashlib.sha256(out.read_bytes()).hexdigest(),status='candidate: PCM repeat timing repaired; human sound and exact-media loop review pending',processing='Decode source once to stereo48000Hz PCM; repeat with40ms equal-power crossfades; trim244000 samples; gain0.8,250ms onset/500ms tail; AAC192k; copy original compressed video unchanged',supersedes='friendly-drift-candidate-v1: two approximately25ms encoded-source repeat timestamp gaps',pcmRepair={'sampleRate':rate,'samples':total,'sourceSamples':len(pcm),'crossfadeSamples':overlap,'joinStartSamples':joins,'sourceSha256':hashlib.sha256(sound.read_bytes()).hexdigest(),'videoEssenceVerified':True})
(F/'friendly-drift-candidate-v2.json').write_text(json.dumps(d,indent=2)+'\n')
print(json.dumps(d['pcmRepair']))
