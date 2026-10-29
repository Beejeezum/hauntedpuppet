"""Pin native neutral-movie color samples; never use a reencoded review proxy."""
from pathlib import Path
import base64, hashlib, json, subprocess, sys
import numpy as np

root = Path(__file__).resolve().parents[1]
folder = root/'source/wisp-art-reference/scary-speaking-study/neutral-motion-base-study'
source = folder/'scary-neutral-body-base-v1.mp4'
sha = hashlib.sha256(source.read_bytes()).hexdigest()
assert sha == '27ac763bbf5d6349737b751a22abae5adba410872a5fd2d08b4bd483157750eb'
ffmpeg = sys.argv[1] if len(sys.argv)>1 else str(root/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1')
# Convert before cropping: the odd height/y must not be rounded to a YUV grid.
raw = subprocess.run([ffmpeg,'-v','error','-i',str(source),'-vf',
    'format=rgb24,crop=100:85:490:295','-pix_fmt','rgb24','-f','rawvideo','pipe:1'],
    capture_output=True,check=True).stdout
assert len(raw) == 193*100*85*3
pictures = np.frombuffer(raw,np.uint8).reshape(193,85,100,3).astype(np.float64)
samples = np.floor(sum(pictures[:,1+dy:84+dy:2,1+dx:98+dx:3,:] for dy in [-1,0,1] for dx in [-1,0,1])/9+.5).astype(np.uint8)
assert samples.shape == (193,42,33,3)
result = {'status':'source_only_picture_registration_not_runtime_approval',
    'sourceSha256':sha,'width':1088,'height':704,'frames':193,'fps':24,
    'crop':{'x':490,'y':295,'width':100,'height':85},
    'sample':{'offset':1,'xStep':3,'yStep':2,'radius':1},
    'fingerprints':[base64.b64encode(frame.tobytes()).decode() for frame in samples]}
(folder/'neutral-canonical-head-samples-v1.json').write_text(json.dumps(result,indent=2)+'\n')
print('Packaged 193 native neutral pictures; no film or character pixels changed.')
