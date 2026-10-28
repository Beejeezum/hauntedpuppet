#!/usr/bin/env python3
"""Measure generated scary face cells. Candidate masks are not reviewed anatomy."""
from pathlib import Path
import hashlib,json
import cv2,numpy as np
source=Path('source/wisp-art-reference/scary-speaking-study/scary-speaking-atlas-candidate-v1.png');im=cv2.imread(str(source),cv2.IMREAD_UNCHANGED)
if im is None or im.shape!=(1536,1024,4):raise SystemExit('Unexpected scary atlas dimensions')
entries=[]
for index,name in enumerate(['rest','AH','OO','EE']):
 x=(index%2)*512;y=(index//2)*768;panel=im[y:y+768,x:x+512];b,g,r,a=[panel[:,:,i].astype(np.float32) for i in range(4)]
 eye=((b>140)&(g>r*1.4)&(b>r*1.8)&(a>200)).astype(np.uint8);eye[:385]=0;eye[495:]=0;eye[:,:215]=0;eye[:,390:]=0
 n,labels,stats,centers=cv2.connectedComponentsWithStats(eye);eyes=[{'center':centers[i].tolist(),'area':int(stats[i,cv2.CC_STAT_AREA])} for i in range(1,n) if 8<=stats[i,cv2.CC_STAT_AREA]<=900];eyes=sorted(sorted(eyes,key=lambda v:v['area'],reverse=True)[:2],key=lambda v:v['center'][0])
 if len(eyes)!=2:raise SystemExit(f'{name}: ambiguous blue eye candidates')
 dark=((np.maximum.reduce([r,g,b])<105)&(a>200)).astype(np.uint8);dark[:460]=0;dark[615:]=0;dark[:,:205]=0;dark[:,390:]=0
 yy,xx=np.indices(dark.shape);left,right=[np.array(e['center']) for e in eyes];slope=(right[1]-left[1])/(right[0]-left[0]);dark[yy<left[1]+(xx-left[0])*slope+22]=0
 n,labels,stats,centers=cv2.connectedComponentsWithStats(dark);candidates=[i for i in range(1,n) if stats[i,cv2.CC_STAT_AREA]>40 and centers[i,1]>475 and 240<centers[i,0]<335]
 if not candidates:raise SystemExit(f'{name}: no mouth candidate')
 component=max(candidates,key=lambda i:stats[i,cv2.CC_STAT_AREA]);bounds=stats[component,:4].tolist();mask=(labels==component).astype(np.uint8);contours,_=cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE);hull=cv2.convexHull(max(contours,key=cv2.contourArea));filled=np.zeros_like(mask);cv2.fillConvexPoly(filled,hull,1);top=[];bottom=[]
 for column in np.linspace(bounds[0],bounds[0]+bounds[2]-1,32):
  ys=np.where(filled[:,int(round(column))]>0)[0];top.append(float(ys.min()));bottom.append(float(ys.max()))
 entries.append({'name':name,'panel':[x,y,512,768],'eyes':eyes,'mouthBounds':bounds,'mouthDarkArea':int(stats[component,cv2.CC_STAT_AREA]),'candidateCavityHullContours':{'top':top,'bottom':bottom},'scope':'Color-component/hull candidates only; teeth, jaw and lip anatomy require correction and visual review.'})
reference=np.array([v['center'] for v in entries[0]['eyes']]);
for entry in entries:
 points=np.array([v['center'] for v in entry['eyes']]);delta=complex(*(reference[1]-reference[0]))/complex(*(points[1]-points[0]));a,b=delta.real,delta.imag;matrix=np.array([[a,-b,0],[b,a,0]]);matrix[:,2]=reference[0]-matrix[:,:2]@points[0];entry['candidatePanelToRestSimilarity']=matrix.tolist();entry['registrationWarning']='Two-eye fit only, not full face/teeth validation. Do not use raw cells as interchangeable sprites.'
drift=max(float(np.linalg.norm(np.array([v['center'] for v in e['eyes']])-reference,axis=1).max()) for e in entries)
report={'source':str(source),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'size':[1024,1536],'humanApproval':False,'runtimeIntegration':False,'scope':'Generated scary speaking-face art and automatic registration candidates. Not a finished atlas/rig or approved facial contours.','panels':entries,'maximumEyeCenterDriftPixels':drift}
source.with_name('registration-candidate-v2.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'eyeDriftPixels':drift,'mouths':[{k:e[k] for k in ['name','mouthBounds','mouthDarkArea']} for e in entries]}))
