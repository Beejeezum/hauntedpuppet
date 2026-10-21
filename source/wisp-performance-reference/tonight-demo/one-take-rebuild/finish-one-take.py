"""Finish ONE intact native take; no shots, temporal edits or replacement sound.

Fixed projection framing applies uniformly to every frame. During the bat rush,
a soft textured edge phase hides pixels before the native source boundary;
this is deliberate vapor disappearance, NOT restored offscreen bat anatomy.
"""
from pathlib import Path
import subprocess,cv2,numpy as np,json,hashlib
r=Path(__file__).resolve().parent;repo=Path.cwd();source=r/'wisp-one-take-v2-native.mp4';picture=r/'one-take-v2-loop-picture.mp4';movie=r/'wisp-one-take-v2-projection-loop.mp4';report=r/'projection-v2-loop-review.json'
assert not any(x.exists() for x in [picture,movie,report]),'Preserve existing finish'
ff=repo/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
c=cv2.VideoCapture(str(source));fps=c.get(5);w,h=int(c.get(3)),int(c.get(4));assert (w,h)==(1920,1080) and abs(fps-24)<.001
enc=subprocess.Popen([str(ff),'-v','error','-n','-f','rawvideo','-pix_fmt','bgr24','-s','1920x1080','-r','24','-i','pipe:0','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(picture)],stdin=subprocess.PIPE)
y,x=np.mgrid[0:h,0:w].astype(np.float32);distance=np.minimum.reduce([x/(.14*w),(w-1-x)/(.14*w),y/(.14*h),(h-1-y)/(.14*h)])
rng=np.random.default_rng(241);noise=cv2.resize(rng.random((27,48),dtype=np.float32),(w,h),interpolation=cv2.INTER_CUBIC);noise=cv2.GaussianBlur(noise,(0,0),7)
transform=np.array([[.6,0,w*.2],[0,.6,h*.2]],np.float32);count=0
try:
 while True:
  ok,f=c.read()
  if not ok:break
  # Soft black-level cleanup, no independent body/hand/eye layers.
  level=f.max(2).astype(np.float32);a=np.clip((level-8)/12,0,1);a=a*a*(3-2*a);f=f.astype(np.float32)*a[:,:,None]
  if count/fps>=27:
   strength=np.clip((count/fps-27)/.55,0,1);strength=strength*strength*(3-2*strength)
   drift=np.roll(noise,(round(count*.8),round(count*1.2)),axis=(0,1))
   phase=np.clip((distance-.2+(drift-.5)*.28)/.8,0,1);phase=phase*phase*(3-2*phase)
   f*=((1-strength)+strength*phase)[:,:,None]
  out=cv2.warpAffine(np.rint(f).astype('uint8'),transform,(w,h),flags=cv2.INTER_AREA,borderMode=cv2.BORDER_CONSTANT)
  if count<9:
   entry=count/8;entry=entry*entry*(3-2*entry);out=np.rint(out.astype(np.float32)*entry).astype('uint8')
  enc.stdin.write(out.tobytes());count+=1
 c.release();enc.stdin.close();assert enc.wait()==0
except BaseException:
 enc.kill();enc.wait();raise
# Preserve the source's COMPLETE audio bitstream and timing; one final mux.
subprocess.run([str(ff),'-v','error','-n','-i',str(picture),'-i',str(source),'-map','0:v:0','-map','1:a:0','-c','copy','-movflags','+faststart',str(movie)],check=True)
c=cv2.VideoCapture(str(movie));bad={str(t):[] for t in [4,8,16]};i=0;black=[]
while True:
 ok,f=c.read()
 if not ok:break
 level=f.max(2)
 if level.max()<=3:black.append(i)
 for t in [4,8,16]:
  yy,xx=np.where(level>t)
  if len(xx) and (xx.min()<384 or xx.max()>1535 or yy.min()<216 or yy.max()>863):bad[str(t)].append(i)
 i+=1
c.release();assert i==count==721;assert not any(bad.values()),bad
# Audit actual decoded source-vs-finish audio, not a same-clock arithmetic check.
def pcm(path):return subprocess.check_output([str(ff),'-v','error','-i',str(path),'-vn','-ar','48000','-ac','2','-f','f32le','pipe:1'])
srcPCM=pcm(source);dstPCM=pcm(movie);assert srcPCM==dstPCM,'Native audio must remain bit-for-bit decoded identical'
audio=np.frombuffer(dstPCM,'<f4');assert abs(audio).max()<.99
tail=0
for n in reversed(black):
 if n==count-tail-1:tail+=1
 else:break
j=dict(status='technical finish passed; human performance and physical projection review pending',releaseApproved=False,source=source.name,sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),movie=movie.name,sha256=hashlib.sha256(movie.read_bytes()).hexdigest(),frames=count,fps=fps,durationSeconds=count/fps,size=[w,h],nativeAudioUnchanged=True,decodedPCMIdentical=True,oldFootageOrAudioUsed=False,constantWholeFilmFit=.6,animatedFraming=False,entryFadeFrames=9,batEdgePhaseSeconds=[27,30.0417],sourceCropDisclosure='Native bats cross source edges at frames673..698. Authored soft edge vapor phase begins BEFORE that span; no cropped bat anatomy is claimed restored.',boundsFailureFrames=bad,blackTailFrames=tail,audioPeak=float(abs(audio).max()),scope='ONE generated performance, one uniform stage transform, late bat-edge vapor phase only, complete original native audio. No clip assembly, shot replacement, temporal interpolation, source repair or physical projection claim.')
report.write_text(json.dumps(j,indent=2)+'\n');print(json.dumps(j))
