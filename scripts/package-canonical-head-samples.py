"""Package original-film RGB samples for a source-only registration study."""
from pathlib import Path
import base64,hashlib,json,subprocess,sys
import numpy as np
root=Path(__file__).resolve().parents[1]
source=root/'source/wisp-performance-reference/runway-pilots/continuous-loop-study/wisp-continuous-loop-v28.mp4'
sha=hashlib.sha256(source.read_bytes()).hexdigest()
assert sha=='52d54d03c0f0406a9724c7c04b9e2fa0557a675486edfaa40fd0ca2e24a682bd'
ffmpeg=sys.argv[1] if len(sys.argv)>1 else str(root/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1')
raw=subprocess.run([ffmpeg,'-v','error','-i',str(source),'-vf','crop=220:240:850:370','-pix_fmt','rgb24','-f','rawvideo','pipe:1'],capture_output=True,check=True).stdout
assert len(raw)==122*220*240*3
samples=np.frombuffer(raw,np.uint8).reshape(122,240,220,3)[:,2::4,2::20,:]
assert samples.shape==(122,60,11,3)
result={'status':'canonical_registration_study_not_runtime_approval','sourceSha256':sha,'width':1916,'height':1080,'frames':122,'fps':24,'crop':{'x':850,'y':370,'width':220,'height':240},'sample':{'offset':2,'xStep':20,'yStep':4},'fingerprints':[base64.b64encode(frame.tobytes()).decode() for frame in samples]}
out=root/'source/wisp-art-reference/painted-speech-study/native-lip-mesh-study/friendly-v28-canonical-head-samples-v1.json'
out.write_text(json.dumps(result,indent=2)+'\n')
print('Packaged122 original source fingerprints; no reference painting or movie pixels changed.')
