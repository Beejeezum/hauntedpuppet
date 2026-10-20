"""Assemble native spoken performances with one fixed master frame, never shot zooms.

Run from repository root. Preserves source files; refuses to overwrite exports.
A rendered candidate still requires human voice/acting and projection review.
"""
import cv2, numpy as np, subprocess, json, hashlib, wave
from pathlib import Path
R=Path('source/wisp-performance-reference/tonight-demo')
F='work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
P=R/'tonight-story-v5-picture.mp4'; W=R/'tonight-story-v5.wav'; M=R/'tonight-story-v5.mp4'; A=R/'tonight-story-v5-sound.m4a'; J=R/'tonight-story-v5.json'
assert not any(p.exists() for p in [P,W,M,A,J]),'Preserve previous export'
# All inputs use the same .85 whole-frame stage. Apply one constant master
# fit to every shot, including the approved core: no animated sizing anywhere.
scenes=[('Welcome','spoken-welcome-staged-v1.mp4',0,145),('Showing off','story-prefix-picture-v1.mp4',122,242),('Scare and apology','scare-apology-picture-review-v1.mp4',0,290),('Smoke greeting','writing-fixed-scale-v2.mp4',0,145),('Boo-bye','spoken-goodbye-staged-v1.mp4',0,97),('Drift into mist','departure-drift-staged-v7.mp4',0,133),('Bats in the fog','bat-contained-edit-study-v4-picture.mp4',0,157)]
e=subprocess.Popen([F,'-v','error','-n','-f','rawvideo','-pix_fmt','bgr24','-s','1280x720','-r','24','-i','pipe:0','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(P)],stdin=subprocess.PIPE)
s=.74/.85; transform=np.array([[s,0,640*(1-s)],[0,s,360*(1-s)]],np.float32)
clips=[];total=0
try:
 for title,name,start,count in scenes:
  c=cv2.VideoCapture(str(R/name)); assert abs(c.get(5)-24)<.001
  c.set(cv2.CAP_PROP_POS_FRAMES,start); clips.append(dict(title=title,file=name,sourceStartFrame=start,startFrame=total,frames=count,sha256=hashlib.sha256((R/name).read_bytes()).hexdigest()))
  for i in range(count):
   ok,f=c.read();assert ok and f.shape==(720,1280,3)
   f=cv2.warpAffine(f,transform,(1280,720),flags=cv2.INTER_AREA)
   if total<15:f=np.rint(f.astype(float)*(total/14)).astype('uint8')
   e.stdin.write(f.tobytes());total+=1
  c.release()
 for _ in range(48):e.stdin.write(np.zeros((720,1280,3),np.uint8).tobytes())
 total+=48;e.stdin.close();assert e.wait()==0
except BaseException:
 e.kill();e.wait();raise

def audio(file):
 raw=subprocess.check_output([F,'-v','error','-i',str(file),'-vn','-ar','48000','-ac','2','-f','f32le','pipe:1'])
 return np.frombuffer(raw,'<f4').reshape(-1,2).copy()
base=audio(R/'story-act-one-review-v1.wav');mix=np.zeros((total*2000,2),float);events=[]
def active_level(x):
 levels=np.array([np.sqrt(np.mean(x[i:i+9600]**2)) for i in range(0,len(x),9600)])
 return float(np.percentile(levels[levels>.005],70))
target=active_level(base[461*2000:654*2000])
def put(x,idx,label,gain=1):
 start=clips[idx]['startFrame']*2000;count=min(len(x),clips[idx]['frames']*2000);x=x[:count].copy()
 # Gentle boundary cleanup only; speech is authored clear of these edges.
 fade=min(2400,count//4);x[:fade]*=np.linspace(0,1,fade)[:,None];x[-fade:]*=np.linspace(1,0,fade)[:,None]
 mix[start:start+count]+=x*gain;events.append(dict(label=label,atFrame=clips[idx]['startFrame'],gain=gain,samples=count))
for idx,name in [(0,'spoken-welcome-native-v1.mp4'),(4,'spoken-goodbye-native-v1.mp4')]:
 x=audio(R/name);g=float(np.clip(target/max(active_level(x),.001),.5,2));put(x,idx,name,g)
put(base[122*2000:364*2000],1,'Morph and menace')
put(base[364*2000:654*2000],2,'Approved scare and apology')
put(base[654*2000:799*2000],3,'Smoke writing')
effect=audio(Path('source/wisp-performance-reference/ambient-show/sound-study/wisp-soft-apparition-v1.mp3'))
put(effect,5,'Drift air',.12);put(audio(R/'bat-contained-edit-study-v4.wav'),6,'Bat rush',.6)
# Crossfaded existing apparition texture, quietly connecting nonverbal sections.
texture=effect;overlap=min(38400,len(texture)//3);window=np.ones(len(texture));window[:overlap]=np.linspace(0,1,overlap);window[-overlap:]=np.linspace(1,0,overlap)
bed=np.zeros_like(mix);weights=np.zeros(len(mix))
for start in range(0,len(mix),len(texture)-overlap):
 count=min(len(texture),len(mix)-start);bed[start:start+count]+=texture[:count]*window[:count,None];weights[start:start+count]+=window[:count]
bed/=np.maximum(weights,.001)[:,None];bed*=.0035/max(float(np.sqrt(np.mean(bed**2))),.00001)
step=960;levels=np.array([np.sqrt(np.mean(mix[i:i+step]**2)) for i in range(0,len(mix),step)])
duck=np.interp(np.arange(len(mix)),np.arange(len(levels))*step,np.maximum(.12,1/(1+(levels/.007)**2)))
bed*=duck[:,None];fade=38400;end=(total-48)*2000;bed[:fade]*=np.linspace(0,1,fade)[:,None];bed[end-fade:end]*=np.linspace(1,0,fade)[:,None];bed[end:]=0
mix+=bed;mix[-96000:]=0;peak=float(abs(mix).max());assert peak<.98
with wave.open(str(W),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(48000);w.writeframes(np.rint(mix*32767).astype('<i2').tobytes())
subprocess.run([F,'-v','error','-n','-i',str(W),'-c:a','aac','-b:a','192k',str(A)],check=True)
subprocess.run([F,'-v','error','-n','-i',str(P),'-i',str(A),'-c','copy','-movflags','+faststart',str(M)],check=True)
chapters=[dict(title=c['title'],startSeconds=c['startFrame']/24,endSeconds=(c['startFrame']+c['frames'])/24) for c in clips]+[dict(title='Empty stage',startSeconds=(total-48)/24,endSeconds=total/24)]
J.write_text(json.dumps(dict(status='candidate: human voice, joins and physical projection review pending',releaseApproved=False,fps=24,frames=total,durationSeconds=total/24,clips=clips,chapters=chapters,soundEvents=events,samplePeak=peak,masterFit=.74,animatedStageScaling=False,blackTailFrames=48,pictureSha256=hashlib.sha256(P.read_bytes()).hexdigest(),soundSha256=hashlib.sha256(A.read_bytes()).hexdigest()),indent=2))
print(json.dumps(dict(frames=total,duration=total/24,peak=peak)))
