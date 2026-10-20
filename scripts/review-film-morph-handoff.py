"""Assemble real friendly/morph/scary footage for honest straight-cut join review.
Usage: python3 scripts/review-film-morph-handoff.py morph.mp4 output-prefix
No temporal interpolation, reversal, crossfade, registration or hold trimming.
"""
import argparse, hashlib, json, subprocess
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('morph',type=Path)
parser.add_argument('output',type=Path)
parser.add_argument('--return-morph',type=Path,help='Append an authored return and a full friendly repeat for round-trip review')
args=parser.parse_args()
root=Path('source/wisp-performance-reference/runway-pilots')
inputs=[('friendly',root/'continuous-loop-study/wisp-continuous-loop-v28.mp4',.85),('morph',args.morph,1),('scary',root/'motion-transfer-study/wisp-scary-motion-transfer-v35.mp4',.85)]
if args.return_morph:
 inputs.extend([('return-morph',args.return_morph,1),('friendly-repeat',root/'continuous-loop-study/wisp-continuous-loop-v28.mp4',.85)])
movie=args.output.with_suffix('.mp4')
if movie.exists():parser.error('Preserve existing review export')
args.output.parent.mkdir(parents=True,exist_ok=True)
ffmpeg=Path('work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1')
encoder=subprocess.Popen([str(ffmpeg),'-hide_banner','-loglevel','error','-n','-f','rawvideo','-pix_fmt','bgr24','-s','1280x720','-r','24','-i','pipe:0','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(movie)],stdin=subprocess.PIPE)
segments=[]
try:
 for label,file,scale in inputs:
  cap=cv2.VideoCapture(str(file));fps=cap.get(cv2.CAP_PROP_FPS)
  if not cap.isOpened() or abs(fps-24)>.01:raise RuntimeError('Expected actual24fps footage: '+str(file))
  first=[];last=[];count=0
  while True:
   ok,frame=cap.read()
   if not ok:break
   h,w=frame.shape[:2];fit=min(1280/w,720/h)*scale;tw,th=round(w*fit),round(h*fit)
   # Fixed whole-frame stage fit only. No pose registration or crop.
   staged=np.zeros((720,1280,3),dtype=np.uint8);x,y=(1280-tw)//2,(720-th)//2
   staged[y:y+th,x:x+tw]=cv2.resize(frame,(tw,th),interpolation=cv2.INTER_LINEAR)
   encoder.stdin.write(staged.tobytes());count+=1
   if len(first)<2:first.append(staged.copy())
   last=(last+[staged.copy()])[-2:]
  cap.release()
  if not count:raise RuntimeError('Empty source')
  segments.append({'label':label,'source':str(file),'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'frames':count,'scale':scale,'first':first,'last':last})
 encoder.stdin.close()
 if encoder.wait()!=0:raise RuntimeError('Review encoding failed')
except BaseException:
 encoder.kill();encoder.wait();raise

joins=[];sheet=Image.new('RGB',(1280,392*(len(segments)-1)),'#16161b');draw=ImageDraw.Draw(sheet)
for index,(before,after) in enumerate(zip(segments,segments[1:])):
 a,b=before['last'][-1],after['first'][0];ma,mb=a.max(axis=2)>16,b.max(axis=2)>16;union=ma|mb
 diff=float(np.abs(a.astype(float)-b.astype(float))[union].mean()) if union.any() else 0
 iou=float((ma&mb).sum()/union.sum()) if union.any() else 1
 joins.append({'from':before['label'],'to':after['label'],'visibleRGBDifference':diff,'silhouetteIoU':iou})
 for column,(label,frame) in enumerate([(before['label']+' ending',a),(after['label']+' opening',b)]):
  thumb=cv2.resize(frame,(640,360),interpolation=cv2.INTER_AREA);sheet.paste(Image.fromarray(cv2.cvtColor(thumb,cv2.COLOR_BGR2RGB)),(column*640,index*392));draw.text((column*640+8,index*392+365),label,fill='white')
sheet.save(args.output.with_name(args.output.name+'-joins').with_suffix('.png'))
report={'status':'review only; not approved','file':str(movie),'sha256':hashlib.sha256(movie.read_bytes()).hexdigest(),'fps':24,'size':[1280,720],'segments':[{k:v for k,v in s.items() if k not in ('first','last')}for s in segments],'joins':joins,'scope':'Original frame order and count; constant whole-frame fit, one export encode. Integer bilinear staging may differ slightly from browser subpixel rasterization. Pixel/silhouette diagnostics do not prove velocity continuity, anatomy, human seam acceptance or physical projection. Both joins require normal-speed playback review.'}
args.output.with_suffix('.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
