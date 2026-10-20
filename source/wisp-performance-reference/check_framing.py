"""Inspect every decoded reference frame, including faint fog. Never edits footage."""
import argparse,json,math,pathlib
import cv2
import numpy as np
p=argparse.ArgumentParser();p.add_argument('video');p.add_argument('--report',required=True);p.add_argument('--margin',type=float,default=.15);a=p.parse_args()
if not 0<=a.margin<.5:raise ValueError('margin must be between 0 and .5')
c=cv2.VideoCapture(a.video)
if not c.isOpened():raise ValueError('Cannot decode video')
fps=c.get(cv2.CAP_PROP_FPS);rows=[];i=0
while True:
 ok,f=c.read()
 if not ok:break
 h,w=f.shape[:2];brightness=f.max(axis=2);levels={}
 for threshold in [8,16,32]:
  mask=(brightness>threshold).astype('uint8');n,labels,stats,centers=cv2.connectedComponentsWithStats(mask,8)
  # Ignore isolated codec specks, preserve faint connected vapor and fragments.
  keep=np.flatnonzero(stats[:,cv2.CC_STAT_AREA]>=8);keep=keep[keep!=0]
  ys,xs=np.where(np.isin(labels,keep))
  if not len(xs):levels[str(threshold)]={'empty':True};continue
  bounds=[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)]
  gaps=[bounds[0]/w,bounds[1]/h,(w-bounds[2])/w,(h-bounds[3])/h]
  levels[str(threshold)]={'bounds':bounds,'margins':dict(zip(['left','top','right','bottom'],gaps)),'insideSafeArea':min(gaps)>=a.margin,'touchesOuterTwoPixels':bounds[0]<2 or bounds[1]<2 or bounds[2]>w-2 or bounds[3]>h-2}
 rows.append({'frame':i,'seconds':c.get(cv2.CAP_PROP_POS_MSEC)/1000,'levels':levels});i+=1
c.release()
assert rows,'No decoded frames'
summary={}
for level in ['8','16','32']:
 valid=[r for r in rows if not r['levels'][level].get('empty')]
 summary[level]={'safeAreaFailures':sum(not r['levels'][level]['insideSafeArea'] for r in valid),'outerEdgeContactFrames':sum(r['levels'][level]['touchesOuterTwoPixels'] for r in valid),'minimumMargins':{side:min(r['levels'][level]['margins'][side] for r in valid) for side in ['left','top','right','bottom']},'worstFrame':min(valid,key=lambda r:min(r['levels'][level]['margins'].values()))['frame']}
report={'source':str(pathlib.Path(a.video).resolve()),'frameCount':len(rows),'fps':fps,'fpsScope':'Container nominal rate; use decoded timestamps for variable-frame-rate capture','lastDecodedTimestampSeconds':rows[-1]['seconds'],'size':[w,h],'requiredMargin':a.margin,'thresholds':'max RGB 8/16/32 of 255; connected fragments >=8 pixels; black-background reference only','summary':summary,'frames':rows,'scope':'Decoded render bounds only. Cannot recover vapor clipped before encoding or prove physical projection quality.'}
pathlib.Path(a.report).write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='frames'},indent=2))
