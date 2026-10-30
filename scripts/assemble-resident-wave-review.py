"""Review actual idle/action/idle cuts without fades, holds or pose adjustment."""
from pathlib import Path
import argparse, hashlib, json, subprocess
import cv2
import numpy as np
from PIL import Image, ImageDraw

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('wave',type=Path)
parser.add_argument('output',type=Path)
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
idle=root/'source/wisp-performance-reference/button-cue-batch/wisp-morph-roundtrip-review-v7.mp4'
sha=lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
assert sha(idle)=='275acb319821ed88d9eda3220f6c9a61e59d484450537293588d601784de08dc'
assert args.wave.exists() and args.wave!=args.output
assert not args.output.exists() and not args.output.with_suffix('.json').exists()
args.output.parent.mkdir(parents=True,exist_ok=True)
ff=root/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
encoder=subprocess.Popen([str(ff),'-v','error','-n','-f','rawvideo','-pix_fmt','bgr24',
    '-s','1280x720','-r','24','-i','pipe:0','-an','-c:v','libx264','-crf','16',
    '-pix_fmt','yuv420p','-movflags','+faststart',str(args.output)],stdin=subprocess.PIPE)
segments=[]
try:
    for label,file,limit in [('friendly-idle',idle,122),('resident-wave',args.wave,None),('friendly-idle-return',idle,122)]:
        capture=cv2.VideoCapture(str(file))
        assert capture.isOpened() and abs(capture.get(cv2.CAP_PROP_FPS)-24)<.01
        count=0;first=[];last=[];previous=None;exactRepeats=0;maxRepeats=0;deltas=[]
        while limit is None or count<limit:
            ok,frame=capture.read()
            if not ok:break
            height,width=frame.shape[:2]
            assert abs(width/height-16/9)<.01,'No crop or distorted fit'
            if (width,height)!=(1280,720):frame=cv2.resize(frame,(1280,720),interpolation=cv2.INTER_AREA)
            encoder.stdin.write(frame.tobytes())
            if previous is not None:
                mask=(frame.max(2)>16)|(previous.max(2)>16)
                deltas.append(float(np.abs(frame.astype(float)-previous)[mask].mean()) if mask.any() else 0.)
                exactRepeats=exactRepeats+1 if np.array_equal(frame,previous) else 0
                maxRepeats=max(maxRepeats,exactRepeats)
            if len(first)<2:first.append(frame.copy())
            last=(last+[frame.copy()])[-2:];previous=frame;count+=1
        capture.release()
        assert count>1 and (limit is None or count==limit)
        segments.append({'label':label,'file':str(file.relative_to(root)) if file.is_relative_to(root) else str(file),
            'sha256':sha(file),'frames':count,'first':first,'last':last,'maximumConsecutiveExactRepeats':maxRepeats,
            'adjacentForegroundDifference':{'median':float(np.median(deltas)),'p95':float(np.percentile(deltas,95))}})
    encoder.stdin.close()
    assert encoder.wait()==0
except BaseException:
    encoder.kill();encoder.wait();raise
joins=[];sheet=Image.new('RGB',(960,440),(20,20,20));draw=ImageDraw.Draw(sheet)
for j,(before,after) in enumerate(zip(segments,segments[1:])):
    a,b=before['last'][-1],after['first'][0];ma=a.max(2)>16;mb=b.max(2)>16;union=ma|mb
    joins.append({'from':before['label'],'to':after['label'],
        'seconds':sum(s['frames'] for s in segments[:j+1])/24,
        'silhouetteIoU':float((ma&mb).sum()/max(1,union.sum())),
        'foregroundMeanAbsoluteRGBDifference':float(np.abs(a.astype(float)-b)[union].mean())})
    for k,frame in enumerate([before['last'][-2],a,b]):
        image=Image.fromarray(cv2.cvtColor(frame,cv2.COLOR_BGR2RGB));image.thumbnail((320,180));sheet.paste(image,(k*320,j*220))
        draw.text((k*320+8,j*220+184),['before -1','before cut','after cut'][k],fill='white')
sheet.save(args.output.with_suffix('.png'))
report={'file':args.output.name,'sha256':sha(args.output),'status':'private silent two-join review; not resident delivery approval',
    'frames':sum(s['frames'] for s in segments),'fps':24,'size':[1280,720],
    'segments':[{k:v for k,v in s.items() if k not in ['first','last']} for s in segments],'joins':joins,
    'processing':'First122 original V7 idle pictures, every native wave picture, then the same complete122-picture idle. Original24fps/order, only fixed whole-frame action resolution normalization if necessary. One picture encode. No fades, black handles, interpolation, reversed footage, body blending, animated resize, pose adjustment or frame trimming.',
    'audio':'Silent picture/acting review only. Add dry effects after motion/joins pass; no music or dialogue.',
    'humanApproval':False,'runtimePublication':False,
    'scope':'Cut pixel and adjacency measurements are diagnostic, not proof of velocity continuity, anatomy, approved action, audio or physical projection.'}
args.output.with_suffix('.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'frames':report['frames'],'joins':joins,'output':str(args.output)}))
