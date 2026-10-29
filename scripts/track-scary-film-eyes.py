#!/usr/bin/env python3
"""Color/geometry candidates for exact scary-v35 movie; not validated facial landmarks."""
from pathlib import Path
import json,hashlib,itertools
import cv2,numpy as np
source=Path('source/wisp-performance-reference/runway-pilots/motion-transfer-study/wisp-scary-motion-transfer-v35.mp4');cap=cv2.VideoCapture(str(source));fps=cap.get(cv2.CAP_PROP_FPS);frames=[];previous=np.array([[614,316],[659,330]],np.float32);review=[];index=0;previousGray=None;gap=0
while True:
 ok,image=cap.read()
 if not ok:break
 b,g,r=[image[:,:,i].astype(np.float32) for i in range(3)];mask=((r<90)&(g>105)&(b>180)&(b>g*1.12)).astype(np.uint8);mask[:250]=0;mask[425:]=0;mask[:,:530]=0;mask[:,745:]=0
 n,labels,stats,centers=cv2.connectedComponentsWithStats(mask);candidates=[centers[i] for i in range(1,n) if 2<=stats[i,cv2.CC_STAT_AREA]<=120 and stats[i,cv2.CC_STAT_WIDTH]<=20 and stats[i,cv2.CC_STAT_HEIGHT]<=20];pairs=[]
 for pair in itertools.combinations(candidates,2):
  points=np.array(sorted(pair,key=lambda p:p[0]));distance=np.linalg.norm(points[1]-points[0]);score=float(np.linalg.norm(points-previous,axis=1).sum())
  if 24<distance<85 and score<80:pairs.append((score,points))
 best=min(pairs,key=lambda p:p[0]) if pairs else None
 observed=None if best is None else best[1].copy();poseSource='blue-component-pair' if best is not None else 'missing';flowResidual=None
 currentGray=cv2.cvtColor(image,cv2.COLOR_BGR2GRAY)
 if best is None and previousGray is not None and gap<7:
  roi=np.zeros_like(currentGray);center=previous.mean(axis=0);x0,x1=sorted(previous[:,0]);roi[max(0,int(center[1]+8)):min(720,int(center[1]+35)),max(0,int(x0+5)):min(1280,int(x1-5))]=255
  features=cv2.goodFeaturesToTrack(previousGray,40,.005,2,mask=roi)
  if features is not None and len(features)>=5:
   nextPoints,status,_=cv2.calcOpticalFlowPyrLK(previousGray,currentGray,features,None,winSize=(15,15),maxLevel=2);back,reverse,_=cv2.calcOpticalFlowPyrLK(currentGray,previousGray,nextPoints,None,winSize=(15,15),maxLevel=2);errors=np.linalg.norm(back.reshape(-1,2)-features.reshape(-1,2),axis=1);good=(status.ravel()==1)&(reverse.ravel()==1)&(errors<.5)
   if good.sum()>=5:
    before=features.reshape(-1,2)[good];after=nextPoints.reshape(-1,2)[good];matrix,inliers=cv2.estimateAffinePartial2D(before,after,method=cv2.RANSAC,ransacReprojThreshold=1)
    if matrix is not None and inliers.mean()>=.7:
     residual=np.linalg.norm(cv2.transform(before.reshape(-1,1,2),matrix).reshape(-1,2)-after,axis=1);flowResidual=float(np.median(residual));scale=float(np.hypot(matrix[0,0],matrix[1,0]));prediction=cv2.transform(previous.reshape(-1,1,2),matrix).reshape(-1,2)
     if flowResidual<.75 and .95<scale<1.05 and np.linalg.norm(prediction-previous,axis=1).max()<8:best=(float(errors[good].max()),prediction);poseSource='short-gap-lower-face-flow-estimate'
 if observed is not None:gap=0
 else:gap+=1
 if best is not None:previous=best[1]
 previousGray=currentGray
 frames.append({'frame':index,'seconds':index/fps,'eyes':None if best is None else best[1].round(3).tolist(),'observedEyes':None if observed is None else observed.round(3).tolist(),'poseSource':poseSource,'flowMedianResidualPixels':flowResidual,'gapFrames':gap,'selectionDisplacementPixels':None if best is None else best[0],'candidateCount':len(candidates),'scope':'Observed pair or explicitly labeled short-gap lower-face optical-flow estimate; not manually validated facial landmarks.'})
 if index%12==0:
  tile=image.copy()
  if best is not None:
   for x,y in best[1]:cv2.circle(tile,(round(x),round(y)),5,(0,255,0),1)
  tile=cv2.resize(tile[240:440,510:770],(390,300));cv2.putText(tile,str(index),(8,25),cv2.FONT_HERSHEY_SIMPLEX,.7,(0,255,0),1);review.append(tile)
 index+=1
cap.release();out=Path('source/wisp-art-reference/scary-speaking-study/scary-v35-eye-candidates-v2.json');report={'source':str(source),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'dimensions':[1280,720],'fps':fps,'frames':frames,'missingFrames':[f['frame'] for f in frames if f['eyes'] is None],'estimatedFrames':[f['frame'] for f in frames if f['poseSource']=='short-gap-lower-face-flow-estimate'],'humanApproval':False,'runtimeIntegration':False,'scope':'Source-only observed pair plus bounded short-gap lower-face-flow estimates. Missing poses hide experimental mouth. All estimates require motion review.'};out.write_text(json.dumps(report,indent=2)+'\n')
while len(review)%4:review.append(np.zeros_like(review[0]))
cv2.imwrite('work/phone-mouth-anchor/scary-eye-tracking-contact.png',np.vstack([np.hstack(review[i:i+4]) for i in range(0,len(review),4)]));print(json.dumps({'frames':len(frames),'missing':report['missingFrames'],'estimated':report['estimatedFrames'],'review':'work/phone-mouth-anchor/scary-eye-tracking-contact.png'}))
