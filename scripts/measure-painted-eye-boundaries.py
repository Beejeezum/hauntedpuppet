"""Private pixel-analysis eye-guard candidates; original approved art unchanged."""
import json,hashlib
from pathlib import Path
import cv2,numpy as np
root=Path(__file__).resolve().parents[1];src=root/'source/wisp-art-reference/painted-speech-study/authored-face-study'
png=src/'wisp-friendly-speech-design-v1.png';review=json.loads((src/'wisp-friendly-speech-design-v1-review.json').read_text());assert hashlib.sha256(png.read_bytes()).hexdigest()==review['imageSha256']
image=cv2.imread(str(png))[:768,:512];anchors=json.loads((src/'wisp-friendly-speech-design-v1-anchor-study.json').read_text())['cells'][0]['eyeComponents'];bounds=[[125,355,250,490],[270,385,410,515]];polygons=[];contact=image.copy()
for eye,box in zip(anchors,bounds):
 x0,y0,x1,y1=box;roi=image[y0:y1,x0:x1];mask=(roi.astype(float).mean(2)<170).astype('uint8');n,labels,stats,centers=cv2.connectedComponentsWithStats(mask,8)
 ex,ey=eye['center'];label=int(labels[round(ey-y0),round(ex-x0)]);assert label!=0
 yy,xx=np.where(labels==label);points=np.column_stack([xx+x0,yy+y0]).astype('int32');hull=cv2.convexHull(points)
 poly=cv2.approxPolyDP(hull,1.,True).reshape(-1,2);assert len(poly)>=6
 polygons.append(poly.tolist());cv2.polylines(contact,[poly],True,(0,255,255),1)
 print({'bounds':cv2.boundingRect(hull),'vertices':len(poly),'componentArea':int(stats[label,cv2.CC_STAT_AREA])})
out=root/'work/authored-face-registration';out.mkdir(exist_ok=True,parents=True)
cv2.imwrite(str(out/'eye-boundary-contact.png'),contact[340:525,115:415])
(out/'eye-boundaries.json').write_text(json.dumps({'status':'measured_dark_eye_envelope_candidates_not_artist_mask','sourceSha256':review['imageSha256'],'polygons':polygons,'limits':['Dark connected-component convex envelope may omit pale sclera or eyelid fringe.','Only exact static rest cell; not a tracked moving-head mask.','Requires visual review before use beyond private study.']},indent=2)+'\n')
