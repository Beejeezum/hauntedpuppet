"""Measure the scary design sheet without modifying its pixels or approving a rig."""
from pathlib import Path
import hashlib,json,math
import cv2,numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
F=ROOT/'source/wisp-art-reference/scary-speaking-study/authored-face-study'
p=F/'scary-speech-design-v1.png'
review=json.loads((F/'scary-speech-design-v1-review.json').read_text())
sha=hashlib.sha256(p.read_bytes()).hexdigest();assert sha==review['sha256']
original=Image.open(p).convert('RGB');assert original.size==(1024,1536)
a=np.asarray(original);overlay=original.copy();draw=ImageDraw.Draw(overlay);poses=[]
for i,name in enumerate(['rest','AH','OO','EE']):
    ox=(i%2)*512;oy=(i//2)*768;cell=a[oy:oy+768,ox:ox+512]
    r,g,b=cell.astype(float).transpose(2,0,1);yy,xx=np.indices(r.shape)
    # This measured sheet's eye region excludes the brighter blue outer smoke.
    blue=((b-r>60)&(b-g>25)&(b>150)&(g>65)&(yy>307)&(yy<400)&(xx>179)&(xx<378)).astype('uint8')
    n,labels,stats,centers=cv2.connectedComponentsWithStats(blue,connectivity=8)
    chosen=sorted(sorted(range(1,n),key=lambda k:-stats[k,4])[:2],key=lambda k:centers[k,0])
    assert len(chosen)==2
    eyes=[centers[k]for k in chosen];left,right=eyes;axis=right-left;distance=float(np.linalg.norm(axis));axis/=distance;mid=(left+right)/2
    angle=math.atan2(axis[1],axis[0]);assert 70<distance<100 and abs(angle)<.2
    assert all(150<int(stats[k,4])<450 for k in chosen)
    eyeRecords=[{'center':centers[k].tolist(),'boundsXYWH':stats[k,:4].tolist(),'bluePixels':int(stats[k,4])}for k in chosen]
    X=((xx-mid[0])*axis[0]+(yy-mid[1])*axis[1])/distance
    Y=(-(xx-mid[0])*axis[1]+(yy-mid[1])*axis[0])/distance
    mask=((cell.max(2)<135)&(X>-.85)&(X<.85)&(Y>.3)&(Y<1.8)).astype('uint8')
    n,labels,stats,centers=cv2.connectedComponentsWithStats(mask,connectivity=8)
    candidates=[k for k in range(1,n)if abs(float(np.dot(centers[k]-mid,axis)/distance))<.5 and stats[k,4]>=24]
    assert candidates
    primary=max(candidates,key=lambda k:stats[k,4]);largest=int(stats[primary,4]);px,py,pw,ph=stats[primary,:4]
    def gap(k):
        x,y,w,h=stats[k,:4]
        return math.hypot(max(0,int(px-x-w),int(x-px-pw)),max(0,int(py-y-h),int(y-py-ph)))
    # Nearby dark inter-tooth fragments can join the cavity; a detached lower
    # eyelid shadow must never stretch the mouth hull upward toward an eye.
    selected=[k for k in candidates if stats[k,4]>=max(24,largest*.025) and gap(k)<=distance*.15]
    ys,xs=np.where(np.isin(labels,selected));assert len(xs)>100
    hull=cv2.convexHull(np.column_stack([xs,ys]).astype('float32')).reshape(-1,2)
    local=np.column_stack([((hull-mid)*axis).sum(1)/distance,((hull-mid)*np.array([-axis[1],axis[0]])).sum(1)/distance])
    record={'pose':name,'cellBoundsXYWH':[ox,oy,512,768],'eyes':eyeRecords,'eyeMidpoint':mid.tolist(),'eyeDistance':distance,'eyeAngleRadians':angle,'oralCandidate':{'boundsXYWH':[int(xs.min()),int(ys.min()),int(xs.max()-xs.min()+1),int(ys.max()-ys.min()+1)],'darkPixels':len(xs),'components':[{'area':int(stats[k,4]),'boundsXYWH':stats[k,:4].tolist()}for k in selected],'convexHull':hull.tolist(),'eyeLocalConvexHull':local.tolist()}}
    poses.append(record)
    draw.polygon([(ox+float(x),oy+float(y))for x,y in hull],outline='#ff9f43',width=2)
    for eye in eyes:
        x=ox+float(eye[0]);y=oy+float(eye[1]);draw.ellipse([x-4,y-4,x+4,y+4],outline='#30e8e0',width=2)
    draw.text((ox+12,oy+12),name+' | measured candidates',fill='white')
rest=poses[0]
for pose in poses:
    angle=rest['eyeAngleRadians']-pose['eyeAngleRadians'];scale=rest['eyeDistance']/pose['eyeDistance'];co=math.cos(angle)*scale;si=math.sin(angle)*scale
    matrix=np.array([[co,-si],[si,co]]);shift=np.array(rest['eyeMidpoint'])-matrix@np.array(pose['eyeMidpoint'])
    aligned=[matrix@np.array(eye['center'])+shift for eye in pose['eyes']]
    error=max(float(np.linalg.norm(p-np.array(ref['center'])))for p,ref in zip(aligned,rest['eyes']))
    assert error<1e-9
    pose['toRestEyePlane']={'matrix':[co,si,-si,co,float(shift[0]),float(shift[1])],'measuredAnchorResidualPixels':error,'eyeMidpointShiftFromRest':(np.array(pose['eyeMidpoint'])-np.array(rest['eyeMidpoint'])).tolist(),'scaleToRest':scale}
result={'status':'measured-design-candidates-not-artist-landmarks','source':p.name,'sha256':sha,'poses':poses,'scope':'Automated blue-iris centers and dark oral envelopes on the new static four-face drawing. Exact anchor residual fits measured eye centers, not full upper-face identity. Convex oral hull includes tooth holes but may overfill corners or miss pale lip/fang roots. No native body mapping, motion, phonemes, runtime or human approval.','runtimeApproved':False,'humanReview':'pending'}
(F/'scary-speech-design-v1-measurements.json').write_text(json.dumps(result,indent=2)+'\n')
out=ROOT/'work/scary-authored-face';out.mkdir(parents=True,exist_ok=True);overlay.save(out/'measured-design-overlay.png')
print(json.dumps([{'pose':p['pose'],'eyeShift':p['toRestEyePlane']['eyeMidpointShiftFromRest'],'scale':p['toRestEyePlane']['scaleToRest'],'oral':p['oralCandidate']['boundsXYWH']}for p in poses]))
