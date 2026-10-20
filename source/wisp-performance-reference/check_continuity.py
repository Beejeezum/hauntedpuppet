import cv2,json,argparse,numpy as np
from pathlib import Path
parser=argparse.ArgumentParser(description='Diagnose visible-region continuity of a black-background character clip.');parser.add_argument('video');parser.add_argument('--report',required=True);args=parser.parse_args();p=Path(args.video)
c=cv2.VideoCapture(str(p));frames=[]
while True:
 ok,f=c.read()
 if not ok:break
 frames.append(f)
# Restrict measurements to the union of visible character pixels; black padding must not conceal a bad seam.
mask=np.any(np.stack([np.max(f,axis=2)>16 for f in frames]),axis=0)
ys,xs=np.where(mask)
if not len(xs): raise SystemExit('No visible character pixels above RGB16')
box=[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)]
def delta(a,b):return float(np.abs(a.astype(np.float32)-b.astype(np.float32))[mask].mean())
d=[delta(a,b) for a,b in zip(frames,frames[1:])]
seam=delta(frames[-1],frames[0]);tail=[]
# Fixed lower-body region below the shoulders. Pixel occupancy is a diagnostic, not proof of anatomy.
y0=int(ys.min()+.57*(ys.max()-ys.min()))
for f in frames:
 m=np.max(f,axis=2)>32
 tail.append(int(m[y0:,:].sum()))
r={'file':str(p.resolve()),'visibleUnionBounds':box,'frameCount':len(frames),'fps':c.get(cv2.CAP_PROP_FPS),'adjacentVisibleMeanRGBDifference':{'median':float(np.median(d)),'p95':float(np.percentile(d,95)),'max':max(d)},'lastToFirstVisibleMeanRGBDifference':seam,'seamToMedianRatio':seam/max(float(np.median(d)),1e-9),'lowerRegionRGB32Occupancy':{'min':min(tail),'max':max(tail),'minToMaxRatio':min(tail)/max(tail)},'limitations':'Encoded 24fps motion and image differences only. Does not establish 60fps rendering, anatomy, physical projection or human approval.'}
Path(args.report).write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r,indent=2))
