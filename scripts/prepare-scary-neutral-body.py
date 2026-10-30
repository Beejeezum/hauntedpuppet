"""Prepare a silent native moving base; no talking/loop/art approval implied."""
from pathlib import Path
import hashlib,json,subprocess
import cv2,numpy as np
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'source/wisp-performance-reference/runway-pilots/whole-character-talking-study/neutral-mouth-audio-pilot-v2.mp4'
expected='86c71acf6b44eee413afc6b756e32511d9a145f7d967431bd175ee72ca79ffae'
assert hashlib.sha256(source.read_bytes()).hexdigest()==expected
out=ROOT/'source/wisp-art-reference/scary-speaking-study/neutral-motion-base-study/scary-neutral-body-base-v1.mp4'
if out.exists():raise SystemExit('Refusing to overwrite an existing motion base')
ffmpeg=ROOT/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
subprocess.run([str(ffmpeg),'-hide_banner','-loglevel','error','-i',str(source),'-an','-c:v','copy','-movflags','+faststart',str(out)],check=True)
a,b=cv2.VideoCapture(str(source)),cv2.VideoCapture(str(out));count=0;maximum=0;total=0;pixels=0
while True:
    good,x=a.read();got,y=b.read();assert good==got
    if not good:break
    assert y.shape==(704,1088,3)
    crop=y;mask=x.max(2)>16;delta=np.abs(crop.astype(np.int16)-x.astype(np.int16))[mask]
    maximum=max(maximum,int(delta.max()));total+=int(delta.sum());pixels+=delta.size;count+=1
a.release();b.release();assert count==193 and maximum==0
def essence(p):
    raw=subprocess.run([str(ffmpeg),'-v','error','-i',str(p),'-map','0:v:0','-c','copy','-f','hash','-hash','sha256','-'],capture_output=True,check=True).stdout.decode().strip();return raw.split('=')[-1]
compressed=essence(source);assert compressed==essence(out)
record={'status':'source-only neutral full-body motion candidate; not a finished speech rig or loop',
    'file':out.name,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'source':str(source.relative_to(ROOT)),'sourceSha256':expected,
    'frames':count,'fps':24,'dimensions':[1088,704],'nativePictureRect':[0,0,1088,704],'compressedVideoEssenceSha256':compressed,
    'processing':'Video stream copied exactly; all193decoded native RGB pictures identical. No scaling, re-encoding, retiming, reversal, interpolation or body/face replacement. Baked audition sound removed; future voice belongs to laptop speech playback.',
    'nativeDecodedPictureDifference':{'meanAbsoluteRGB':total/pixels,'maximumRGB':maximum,'threshold':16},
    'paddedReview':'scary-neutral-body-review-v1.mp4','paddedReviewScope':'Constant black-padding/re-encoded viewing proxy only; separate from exact native master.','origin':'Earlier2credit whole-character speech audition, rejected for closed mouth through dialogue. Reuse is only for its moving closed-mouth body/fog, not a reversal of that speech rejection.',
    'generationCreditsSpent':0,'humanApproval':False,'runtimePublication':False,
    'remaining':['Human character/material review','Connected jaw/cheek/teeth/OO mechanics','Verified picture-to-track registration before live use','Spoken motion/voice review','Authored loop and entrance/exit qualification','Browser/phone/projector integration and soak']}
out.with_suffix('.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps({'frames':count,'sha256':record['sha256'],'nativePictureDifference':record['nativeDecodedPictureDifference']}))
