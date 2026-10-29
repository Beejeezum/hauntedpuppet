"""Private shared-topology skin geometry study; no approved pixels changed.
Mouth bounds are measurement candidates, not final artist annotations.
"""
import json,math
from pathlib import Path
import numpy as np
root=Path(__file__).resolve().parents[1]
src=root/'source/wisp-art-reference/painted-speech-study/authored-face-study'
data=json.loads((src/'wisp-friendly-speech-design-v1-mouth-candidates.json').read_text())
N=32;R=6
tri=[]
for r in range(R-1):
 for j in range(N):
  a=r*N+j;b=r*N+(j+1)%N;c=(r+1)*N+j;d=(r+1)*N+(j+1)%N
  tri.extend([[a,b,c],[b,d,c]])
def outline(p):
 import cv2
 points=np.array(p['eyeLocalEnvelopeUpper']+p['eyeLocalEnvelopeLower'],dtype='float32')
 hull=cv2.convexHull(points).reshape(-1,2).astype(float);center=hull.mean(0);result=[]
 for j in range(N):
  angle=math.pi+2*math.pi*j/N;direction=np.array([math.cos(angle),math.sin(angle)])
  hits=[]
  for a,b in zip(hull,np.roll(hull,-1,axis=0)):
   matrix=np.column_stack([direction,-(b-a)])
   if abs(np.linalg.det(matrix))<1e-10:continue
   distance,u=np.linalg.solve(matrix,a-center)
   if distance>0 and -.000001<=u<=1.000001:hits.append(distance)
  assert hits
  result.append(center+direction*min(hits))
 return np.array(result)
poses={}
for p in data['poses']:
 inner=outline(p);vertices=[]
 for r in range(R):
  t=r/(R-1)
  for j in range(N):
   angle=math.pi+2*math.pi*j/N
   outer=np.array([-.02+.60*math.cos(angle),.46+.32*math.sin(angle)])
   vertices.append(((1-t)*inner[j]+t*outer).tolist())
 poses[p['shape']]=vertices
areas=[]
# Interpolated geometry must retain orientation at all pairwise blends.
for ka,a in poses.items():
 for kb,b in poses.items():
  for t in np.linspace(0,1,21):
   v=(1-t)*np.array(a)+t*np.array(b)
   cross=[]
   for i,j,k in tri:
    ab=v[j]-v[i];ac=v[k]-v[i];cross.append(float(ab[0]*ac[1]-ab[1]*ac[0]))
   areas.extend(cross)
assert max(areas)<-1e-7,('folded or collapsed skin triangle',min(areas),max(areas))
for v in poses.values():assert np.array_equal(np.array(v)[-N:],np.array(next(iter(poses.values())))[-N:])
out=root/'work/authored-face-registration';out.mkdir(parents=True,exist_ok=True)
result={'status':'unapproved_shared_skin_geometry_study','verticesPerPose':N*R,'triangles':tri,'poses':poses,'minimumAbsoluteDoubleArea':min(abs(a) for a in areas),'pairwiseBlendSamples':len(poses)**2*21,'limits':['Envelope is an automatic candidate and overfills curved smile.','No mouth interior, texture retarget, native motion anchoring or runtime integration.','Fixed outside ring preserves its coordinates; eye protection still needs native-head mask validation.']}
(out/'skin-mesh.json').write_text(json.dumps(result,indent=2)+'\n')
print({k:result[k] for k in ['verticesPerPose','minimumAbsoluteDoubleArea','pairwiseBlendSamples']})
