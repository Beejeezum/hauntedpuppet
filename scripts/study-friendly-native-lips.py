import argparse,cv2,hashlib,json,subprocess
import numpy as np
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1];parser=argparse.ArgumentParser(description='Source-only native lip-ink candidates for pinned friendly v28; not ground truth or runtime approval.');parser.add_argument('--output',required=True,type=Path);parser.add_argument('--ffmpeg',required=True,type=Path);args=parser.parse_args();out=args.output.resolve();
if root/'work' not in out.parents or out.exists():raise ValueError('Choose a new output folder under repository work/')
out.mkdir(parents=True)
ref=json.loads((root/'source/wisp-art-reference/painted-speech-study/friendly-v28-mouth-template-candidates.json').read_text());source=root/ref['source'];assert hashlib.sha256(source.read_bytes()).hexdigest()==ref['sourceSha256']
w,h=1916,1080;ff=args.ffmpeg.resolve()
p=subprocess.Popen([str(ff),'-v','error','-threads','1','-i',str(source),'-an','-pix_fmt','bgr24','-f','rawvideo','pipe:1'],stdout=subprocess.PIPE)
records=[];samples={};failures=[];sample_ids={0,11,22,33,44,49,50,51,52,77,99,121}
for i,frame in enumerate(ref['frames']):
 data=p.stdout.read(w*h*3)
 if len(data)!=w*h*3:raise RuntimeError('Incomplete native frame')
 image=np.frombuffer(data,np.uint8).reshape(h,w,3);cx,cy=frame['center'];x0,y0=int(cx-36),int(cy-24);a=image[y0:y0+48,x0:x0+72];b,g,r=cv2.split(a);lum=a.astype(float).mean(2)
 candidates=[]
 for threshold in [185,195,205,215]:
  count,labels,stats,cent=cv2.connectedComponentsWithStats(((lum<threshold)&(r.astype(int)>=b.astype(int)-5)).astype(np.uint8),8)
  for label in range(1,count):
   x,y,cw,ch,area=map(int,stats[label]);mx,my=cent[label]+[x0,y0]
   if 28<=cw<=50 and 5<=ch<=26 and 65<=area<=600:candidates.append(((mx-cx)**2+(my-cy)**2,label))
  if candidates:break
 if not candidates:failures.append(i);records.append({'frame':i,'valid':False});continue
 _,label=min(candidates);x,y,cw,ch,area=map(int,stats[label]);points=[];top=[];bottom=[]
 for column in range(x,x+cw):
  ys=np.flatnonzero(labels[:,column]==label)
  if not len(ys):raise RuntimeError('Disconnected ink column')
  weights=threshold-lum[ys,column];seam=float(np.average(ys,weights=weights))+y0;points.append([column+x0,round(seam,4)]);top.append([column+x0,int(ys.min()+y0)]);bottom.append([column+x0,int(ys.max()+y0)])
 records.append({'frame':i,'seconds':i/24,'valid':True,'inkBounds':[x+x0,y+y0,cw,ch],'area':area,'threshold':threshold,'confidence':'low-contrast candidate' if threshold>185 else 'measured ink candidate','seam':points,'upperInk':top,'lowerInk':bottom})
 if i in sample_ids:samples[i]=(image[max(0,int(cy)-24):int(cy)+32,int(cx)-48:int(cx)+48].copy(),int(cx)-48,int(cy)-24,points)
assert not p.stdout.read(1),'Unexpected extra source frames';assert p.wait()==0
result={'status':'source-only native lip ink contours; no runtime or human approval','source':ref['source'],'sourceSha256':ref['sourceSha256'],'dimensions':[w,h],'fps':24,'method':'Adaptive warm dark-ink connected component (185..215) near existing template candidate, then per-column ink-weighted center. Higher thresholds are bounded to validated mouth width/height and never interpolate missing frames. Native pixel analysis, not facial landmarks or ground truth.','dependencies':{'opencv':cv2.__version__,'numpy':np.__version__},'failedFrames':failures,'lowContrastFrames':[f['frame']for f in records if f.get('threshold',185)>185],'frames':records};(out/'native-lip-contours-v1.json').write_text(json.dumps(result,indent=2)+'\n')
sheet=Image.new('RGB',(4*384,3*260),'#151820');draw=ImageDraw.Draw(sheet)
for n,i in enumerate(sorted(samples)):
 a,x0,y0,points=samples[i];im=Image.fromarray(cv2.cvtColor(a,cv2.COLOR_BGR2RGB)).resize((384,224));d=ImageDraw.Draw(im);d.line([((x-x0)*4,(y-y0)*4)for x,y in points],fill='#00eaff',width=2);x=n%4*384;y=n//4*260;sheet.paste(im,(x,y+28));draw.text((x+8,y+6),f'Frame {i} - native lip centerline',fill='white')
sheet.save(out/'native-lip-tracking-contact-v1.png');print(json.dumps({'frames':len(records),'failed':failures,'minWidth':min(r['inkBounds'][2]for r in records if r['valid']),'maxWidth':max(r['inkBounds'][2]for r in records if r['valid'])}))
