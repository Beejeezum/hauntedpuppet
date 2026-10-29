#!/usr/bin/env python3
"""Independent-frame painted smile registration candidates; no runtime integration."""
import argparse,json,hashlib
from pathlib import Path
import cv2,numpy as np
p=argparse.ArgumentParser();p.add_argument('--output',required=True);a=p.parse_args();out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
src=Path('source/wisp-performance-reference/runway-pilots/continuous-loop-study/wisp-continuous-loop-v28.mp4');
if hashlib.sha256(src.read_bytes()).hexdigest()!='52d54d03c0f0406a9724c7c04b9e2fa0557a675486edfaa40fd0ca2e24a682bd':raise SystemExit('Source changed; manual registration must be redone')
cap=cv2.VideoCapture(str(src));ok,first=cap.read()
if not ok or first.shape[:2]!=(1080,1916):raise SystemExit('Source unavailable or wrong dimensions')
def feature(image):
 g=cv2.cvtColor(image,cv2.COLOR_BGR2GRAY).astype(np.float32)/255
 return cv2.GaussianBlur(g,(0,0),.7)-cv2.GaussianBlur(g,(0,0),4)
template=feature(first)[508:535,916:968];h,w=template.shape;variants=[]
for scale in [.9,1.,1.1]:
 for angle in range(-20,21,5):
  mat=cv2.getRotationMatrix2D((w/2,h/2),angle,scale);warped=cv2.warpAffine(template,mat,(w,h));variants.append((scale,angle,warped))
frame=first;i=0;rows=[];tiles=[]
while True:
 search=feature(frame)[450:610,850:1060];best=None
 for scale,angle,t in variants:
  matches=cv2.matchTemplate(search,t,cv2.TM_CCOEFF_NORMED);_,score,_,xy=cv2.minMaxLoc(matches)
  if best is None or score>best[0]:best=(score,xy,scale,angle)
 score,(x,y),scale,angle=best;center=[x+850+w/2,y+450+h/2]
 rows.append({'frame':i,'seconds':i/24,'center':center,'scale':scale,'rotationDegrees':angle,'correlation':score})
 if i%12==0 or i==121:
  view=frame.copy();cv2.rectangle(view,(x+850,y+450),(x+850+w,y+450+h),(0,255,0),1);view=cv2.resize(view[400:610,820:1100],(392,294));cv2.putText(view,f'{i} {score:.2f}',(8,24),cv2.FONT_HERSHEY_SIMPLEX,.6,(0,255,0),1);tiles.append(view)
 i+=1;ok,frame=cap.read()
 if not ok:break
cap.release()
centers=np.array([r['center'] for r in rows]);jumps=np.linalg.norm(np.diff(centers,axis=0),axis=1)
report={'source':str(src),'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'scope':'Independent-frame rotated/scaled smile-template candidates, manually registered reference. Not facial landmarks, not approved animation or phoneme sync.','runtimeIntegration':False,'humanApproval':False,'status':'candidate-needs-full-motion-and-mouth-overlay-review','fps':24,'dimensions':[1916,1080],'manuallyRegisteredReferenceRect':[916,508,52,27],'searchRect':[850,450,210,160],'frames':rows,'minimumCorrelation':min(r['correlation'] for r in rows),'maximumAdjacentCenterJumpPixels':float(jumps.max())}
(out/'template-tracking.json').write_text(json.dumps(report,indent=2)+'\n')
while len(tiles)%4:tiles.append(np.zeros_like(tiles[0]))
cv2.imwrite(str(out/'template-review.png'),np.vstack([np.hstack(tiles[j:j+4]) for j in range(0,len(tiles),4)]))
print(json.dumps({k:report[k] for k in ['minimumCorrelation','maximumAdjacentCenterJumpPixels']}))
