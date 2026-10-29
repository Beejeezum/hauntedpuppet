"""Package original-film RGB samples for a source-only registration study."""
from pathlib import Path
import base64,hashlib,json,subprocess,sys
import numpy as np
root=Path(__file__).resolve().parents[1]
source=root/'source/wisp-performance-reference/runway-pilots/motion-transfer-study/wisp-scary-motion-transfer-v35.mp4'
sha=hashlib.sha256(source.read_bytes()).hexdigest()
assert sha=='21e8efec67ec7e024fc954cc16af458cad8f8427553a998341ff9d37286ca35a'
ffmpeg=sys.argv[1] if len(sys.argv)>1 else str(root/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1')
raw=subprocess.run([ffmpeg,'-v','error','-i',str(source),'-vf','crop=200:180:540:240','-pix_fmt','rgb24','-f','rawvideo','pipe:1'],capture_output=True,check=True).stdout
assert len(raw)==121*200*180*3
samples=np.frombuffer(raw,np.uint8).reshape(121,180,200,3)[:,2::4,2::10,:]
assert samples.shape==(121,45,20,3)
result={'status':'canonical_registration_study_not_runtime_approval','sourceSha256':sha,'width':1280,'height':720,'frames':121,'fps':24,'crop':{'x':540,'y':240,'width':200,'height':180},'sample':{'offset':2,'xStep':10,'yStep':4},'fingerprints':[base64.b64encode(frame.tobytes()).decode() for frame in samples]}
out=root/'source/wisp-art-reference/scary-speaking-study/authored-face-study/scary-v35-canonical-head-samples-v1.json'
out.write_text(json.dumps(result,indent=2)+'\n')
print('Packaged121 original source fingerprints; no reference painting or movie pixels changed.')
