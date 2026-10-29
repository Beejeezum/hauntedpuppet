#!/usr/bin/env python3
"""Source-only optical-flow registration study. Not detected facial landmarks or approved art."""
import argparse,hashlib,json
from pathlib import Path
import cv2
import numpy as np
p=argparse.ArgumentParser();p.add_argument('--video',required=True);p.add_argument('--output',required=True);p.add_argument('--region',choices=['face','mouth'],default='face');a=p.parse_args()
src=Path(a.video);out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
cap=cv2.VideoCapture(str(src));fps=cap.get(cv2.CAP_PROP_FPS);ok,first=cap.read()
if not ok:raise SystemExit('No decoded frame')
# Manually registered for the exact 1916x1080 friendly-v28 source only.
if first.shape[:2]!=(1080,1916):raise SystemExit('Unexpected source dimensions')
expected='source/wisp-performance-reference/runway-pilots/continuous-loop-study/wisp-continuous-loop-v28.mp4'
if src.as_posix()!=expected:raise SystemExit('This study requires the explicitly registered v28 source')
gray=cv2.cvtColor(first,cv2.COLOR_BGR2GRAY);mask=np.zeros_like(gray);mask[435:542,865:1020]=255
if a.region=='mouth':
 mask[:]=0;mask[505:539,912:968]=255
initial=cv2.goodFeaturesToTrack(gray,100 if a.region=='face' else 40,.02 if a.region=='face' else .005,4 if a.region=='face' else 2,mask=mask)
if initial is None or len(initial)<5:raise SystemExit('Insufficient registration texture')
original=initial.reshape(-1,2);points=original.copy();reference=original.copy();base=np.float32([[922,513],[959,520],[936,540]])
rows=[];sheets=[];index=0;previous=gray;frame=first;failure=None
while True:
 current=cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY)
 if index:
  following,status,_=cv2.calcOpticalFlowPyrLK(previous,current,points.reshape(-1,1,2),None,winSize=(21,21),maxLevel=3)
  back,reverse,_=cv2.calcOpticalFlowPyrLK(current,previous,following,None,winSize=(21,21),maxLevel=3)
  errors=np.linalg.norm(back.reshape(-1,2)-points,axis=1)
  good=(status.ravel()==1)&(reverse.ravel()==1)&(errors<.75)
  points=following.reshape(-1,2)[good];reference=reference[good]
  if len(points)<5:
   failure=f'Tracking lost at frame {index}; no automatic interpolation';break
 matrix,inliers=cv2.estimateAffinePartial2D(reference,points,method=cv2.RANSAC,ransacReprojThreshold=1.5)
 if matrix is None:
  failure=f'No stable registration at frame {index}';break
 anchors=cv2.transform(base.reshape(-1,1,2),matrix).reshape(-1,2)
 predicted=cv2.transform(reference.reshape(-1,1,2),matrix).reshape(-1,2)
 residual=np.linalg.norm(predicted-points,axis=1)
 rows.append({'frame':index,'seconds':index/fps,'candidateTriangle':anchors.round(3).tolist(),'retainedFeatures':len(points),'inliers':int(inliers.sum()),'medianResidualPixels':float(np.median(residual))})
 if index%12==0 or index==121:
  tile=frame.copy()
  cv2.polylines(tile,[anchors.astype(np.int32)],True,(0,255,0),2)
  for xy in points:cv2.circle(tile,tuple(xy.astype(int)),2,(0,0,255),-1)
  tile=tile[400:590,820:1080];tile=cv2.resize(tile,(390,285));cv2.putText(tile,str(index),(8,25),cv2.FONT_HERSHEY_SIMPLEX,.7,(0,255,0),2);sheets.append(tile)
 previous=current;index+=1;ok,frame=cap.read()
 if not ok:break
cap.release()
report={'scope':'Optical-flow registration candidates, not observed lip contours or approved speech assets. Manual first-frame registration requires human review. Never use on different media.','source':str(src),'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'fps':fps,'dimensions':[1916,1080],'frames':rows,'runtimeIntegration':False,'humanApproval':False,'region':a.region,'failure':failure,'maximumMedianResidualPixels':max(r['medianResidualPixels'] for r in rows),'status':'rejected-registration-study' if failure or max(r['medianResidualPixels'] for r in rows)>2 else 'candidate-needs-visual-review'}
(out/(a.region+'-tracking.json')).write_text(json.dumps(report,indent=2)+'\n')
while len(sheets)%4:sheets.append(np.zeros_like(sheets[0]))
cv2.imwrite(str(out/(a.region+'-tracking-review.png')),np.vstack([np.hstack(sheets[i:i+4]) for i in range(0,len(sheets),4)]))
print(json.dumps({'frames':len(rows),'minimumFeatures':min(r['retainedFeatures'] for r in rows),'maximumMedianResidual':max(r['medianResidualPixels'] for r in rows),'review':str(out/(a.region+'-tracking-review.png'))}))
