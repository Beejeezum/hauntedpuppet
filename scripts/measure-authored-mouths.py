"""Measure approved design-sheet paint for rig authoring; never edit its pixels.
Connected dark ink and its convex envelope are candidates, not annotated lips.
The convex envelope may include teeth omitted by a dark-pixel threshold; it can
also overfill curves. Neither is automatically a finished mask or mouth rig.
"""
from pathlib import Path
import hashlib,json
import cv2
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[1]/'source/wisp-art-reference/painted-speech-study/authored-face-study'
source=root/'wisp-friendly-speech-design-v1.png'
review=json.loads((root/'wisp-friendly-speech-design-v1-review.json').read_text())
sha=hashlib.sha256(source.read_bytes()).hexdigest()
assert sha==review['imageSha256'], 'Approved reference changed'
image=np.array(Image.open(source).convert('RGB'))
assert image.shape==(1536,1024,3)
anchors=json.loads((root/'wisp-friendly-speech-design-v1-anchor-study.json').read_text())['cells']
assert [x['shape'] for x in anchors]==['rest','AH','OO','EE']
poses=[]
for i,entry in enumerate(anchors):
    cell=image[(i//2)*768:(i//2+1)*768,(i%2)*512:(i%2+1)*512]
    eyes=np.array([x['center'] for x in entry['eyeComponents']]);mid=eyes.mean(0)
    x0=int(mid[0]-90);y0=int(mid[1]+25)
    roi=cell[y0:int(mid[1]+125),x0:int(mid[0]+75)]
    r,g,b=[roi[:,:,c].astype(float) for c in range(3)]
    mask=((r<140)&(g<90)&(b<110)).astype('uint8')
    count,labels,stats,centers=cv2.connectedComponentsWithStats(mask)
    options=[]
    for j in range(1,count):
        center=centers[j]+[x0,y0]
        if stats[j,cv2.CC_STAT_AREA]>=12 and center[1]>mid[1]+35:
            options.append((np.linalg.norm(center-(mid+[-10,65])),j))
    assert options,entry['shape']
    selected=min(options)[1];yy,xx=np.where(labels==selected);xx+=x0;yy+=y0
    box=[int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)]
    dark=[]
    for x in range(box[0],box[2]):
        ys=yy[xx==x]
        if len(ys):dark.append([x,int(ys.min()),int(ys.max())])
    hull=cv2.convexHull(np.column_stack([xx,yy]).astype('int32'))
    hullMask=np.zeros((768,512),'uint8');cv2.fillConvexPoly(hullMask,hull,1)
    envelope=[]
    for x in range(box[0],box[2]):
        ys=np.where(hullMask[:,x])[0]
        if len(ys):envelope.append([x,int(ys.min()),int(ys.max())])
    axis=eyes[1]-eyes[0];distance=np.linalg.norm(axis);angle=np.arctan2(axis[1],axis[0])
    rotation=np.array([[np.cos(angle),np.sin(angle)],[-np.sin(angle),np.cos(angle)]])
    def normalize(point):return ((rotation@(np.array(point)-mid))/distance).tolist()
    thickness=[l-u+1 for x,u,l in dark]
    poses.append({'shape':entry['shape'],'cellOrigin':[(i%2)*512,(i//2)*768],
        'eyes':eyes.tolist(),'darkComponentArea':len(xx),'mouthBounds':box,
        'darkColumns':dark,'convexEnvelopeColumns':envelope,
        'eyeLocalUpper':[normalize([x,u]) for x,u,l in dark],
        'eyeLocalLower':[normalize([x,l]) for x,u,l in dark],
        'eyeLocalEnvelopeUpper':[normalize([x,u]) for x,u,l in envelope],
        'eyeLocalEnvelopeLower':[normalize([x,l]) for x,u,l in envelope],
        'mouthWidthOverEyeDistance':float((box[2]-box[0])/distance),
        'mouthHeightOverEyeDistance':float((box[3]-box[1])/distance),
        'medianInkColumnThickness':float(np.median(thickness)),
        'maximumInkColumnThickness':max(thickness)})
result={'status':'automatic_authored_mouth_contour_candidates_not_rig',
    'source':source.name,'sourceSha256':sha,'dimensions':[1024,1536],
    'method':'Connected dark oral/ink component in bounded eye-relative ROI. Coarse iris anchors define local coordinates. Convex envelope is an alternative control candidate, not an accepted lip mask.',
    'limits':['Dark threshold omits bright lip rim/teeth.','Convex envelope can include teeth but can overfill lip curvature.','Closed smile bounding-box height is curved ink, not jaw opening.','No pixel-aligned rig, deformation, motion, lip sync or human mouth-attachment acceptance.'],
    'poses':poses}
output=root/'wisp-friendly-speech-design-v1-mouth-candidates.json'
output.write_text(json.dumps(result,indent=2)+'\n')
for pose in poses:
    print(pose['shape'],{'width/eyes':round(pose['mouthWidthOverEyeDistance'],3),
          'height/eyes':round(pose['mouthHeightOverEyeDistance'],3),
          'medianInkThickness':pose['medianInkColumnThickness']})
