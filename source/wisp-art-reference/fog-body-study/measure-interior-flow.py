"""Offline correspondence measurements only; original paintings are never written.
OpenCV DIS: https://docs.opencv.org/4.10.0/de/d4f/classcv_1_1DISOpticalFlow.html
Brightness/visibility assumptions may fail between separately painted turn views.
"""
from pathlib import Path
import cv2, numpy as np, json, hashlib
base=Path(__file__).resolve().parent
names=['body-evil-front-v1.png','body-evil-45-v1.png']
images=[cv2.imread(str(base/n),cv2.IMREAD_UNCHANGED) for n in names]
assert all(im is not None and im.shape[2]==4 for im in images)
w,h=256,384
rgba=[cv2.resize(im,(w,h),interpolation=cv2.INTER_AREA) for im in images]
gray=[np.clip(cv2.cvtColor(im[:,:,:3],cv2.COLOR_BGR2GRAY).astype(np.float32)*(im[:,:,3]/255),0,255).astype(np.uint8) for im in rgba]
algorithm=cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
f=algorithm.calc(gray[0],gray[1],None);b=algorithm.calc(gray[1],gray[0],None)
y,x=np.mgrid[:h,:w].astype(np.float32)
reverse=cv2.remap(b,x+f[:,:,0],y+f[:,:,1],cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
error=np.linalg.norm(f+reverse,axis=2)
inside=(x+f[:,:,0]>=0)&(x+f[:,:,0]<w-1)&(y+f[:,:,1]>=0)&(y+f[:,:,1]<h-1)
support=(rgba[0][:,:,3]>96)&inside
# Local orientation of the dense forward map; positive is necessary, not sufficient.
dx_dx=np.gradient(f[:,:,0],axis=1);dx_dy=np.gradient(f[:,:,0],axis=0)
dy_dx=np.gradient(f[:,:,1],axis=1);dy_dy=np.gradient(f[:,:,1],axis=0)
jacobian=(1+dx_dx)*(1+dy_dy)-dx_dy*dy_dx
report={'opencv':cv2.__version__,'sourceHashes':{n:hashlib.sha256((base/n).read_bytes()).hexdigest() for n in names},'analysisSize':[w,h],'coreSamples':int(support.sum()),'forwardBackwardErrorPixels':{'median':float(np.median(error[support])),'p95':float(np.percentile(error[support],95))},'coreNonpositiveJacobians':int((support&(jacobian<=0)).sum()),'coreConfidenceFractionUnder2px':float((error[support]<2).mean()),'scope':'Computed correspondence evidence only, no renderer integration, no anatomy/volume or visual acceptance'}
assert np.isfinite(f).all() and np.isfinite(b).all()
grid=[]
for yy in np.linspace(0,h-1,49):
 row=[]
 for xx in np.linspace(0,w-1,33):
  iy,ix=round(yy),round(xx);row.append([round(float(f[iy,ix,0]/w),6),round(float(f[iy,ix,1]/h),6),round(float(error[iy,ix]),3)])
 grid.append(row)
(base/'evil-interior-flow-study.json').write_text(json.dumps({'report':report,'forwardGrid':grid},separators=(',',':'))+'\n')
print(json.dumps(report,indent=2))
