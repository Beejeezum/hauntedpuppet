#!/usr/bin/env python3
"""Diagnose rejected eye-rigid attachment using native cavity candidates, not ground-truth lips."""
from pathlib import Path
import json,hashlib
import cv2,numpy as np
root=Path('source/wisp-art-reference/scary-speaking-study');track=json.loads((root/'scary-v35-eye-candidates-v2.json').read_text());source=Path(track['source']);cap=cv2.VideoCapture(str(source));rows=[];first=None
for pose in track['frames']:
 ok,image=cap.read()
 if not ok:raise SystemExit('Source decode incomplete')
 eyes=np.array(pose['eyes']);axis=eyes[1]-eyes[0];distance=np.linalg.norm(axis);axis/=distance;normal=np.array([-axis[1],axis[0]]);center=eyes.mean(axis=0);yy,xx=np.indices(image.shape[:2]);u=(xx-center[0])*axis[0]+(yy-center[1])*axis[1];v=(xx-center[0])*normal[0]+(yy-center[1])*normal[1];mask=((image.max(axis=2)<90)&(np.abs(u)<distance)&(v>distance*.22)&(v<distance*1.5)).astype(np.uint8)
 n,labels,stats,centers=cv2.connectedComponentsWithStats(mask);candidates=[]
 for i in range(1,n):
  q=centers[i]-center;local=np.array([q@axis,q@normal])/distance
  if stats[i,cv2.CC_STAT_AREA]>60 and abs(local[0])<.4 and .35<local[1]<1.2:candidates.append(i)
 if not candidates:rows.append({'frame':pose['frame'],'valid':False});continue
 i=max(candidates,key=lambda i:stats[i,cv2.CC_STAT_AREA]);point=centers[i];q=point-center;local=np.array([q@axis,q@normal])/distance
 if first is None:first=local.copy()
 predicted=center+(axis*first[0]+normal*first[1])*distance;drift=float(np.linalg.norm(point-predicted));rows.append({'frame':pose['frame'],'valid':True,'candidateCenter':point.round(3).tolist(),'headPlaneMouthRect':[float(u[labels==i].min()),float(v[labels==i].min()),float(u[labels==i].max()-u[labels==i].min()+1),float(v[labels==i].max()-v[labels==i].min()+1)],'eyes':pose['eyes'],'candidateArea':int(stats[i,cv2.CC_STAT_AREA]),'eyeRigidPredictedCenter':predicted.round(3).tolist(),'eyeRigidResidualPixels':drift,'poseSource':pose['poseSource']})
cap.release();valid=[r for r in rows if r['valid']];residual=np.array([r['eyeRigidResidualPixels'] for r in valid]);report={'scope':'Diagnostic native mouth-cavity components vs a first-frame two-eye-rigid anchor. Not manually labeled lips, jaw accuracy or a replacement tracker.','source':str(source),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'humanVerdict':'Rejected: mouth drifts and looks pasted on.','validCandidateFrames':len(valid),'frameCount':len(rows),'medianEyeRigidResidualPixels':float(np.median(residual)),'maximumEyeRigidResidualPixels':float(residual.max()),'maximumResidualFractionOfFirstEyeDistance':float(residual.max()/np.linalg.norm(np.array(track['frames'][0]['eyes'])[1]-np.array(track['frames'][0]['eyes'])[0])),'frames':rows,'decision':'Do not solve by stronger smoothing or additional eye-anchor interpolation. Need a neutral talking base and native jaw/upper-lip registration; generated cheek replacement is also rejected.'};(root/'rejected-attachment-diagnostic.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:report[k] for k in ['validCandidateFrames','medianEyeRigidResidualPixels','maximumEyeRigidResidualPixels','maximumResidualFractionOfFirstEyeDistance']}))
