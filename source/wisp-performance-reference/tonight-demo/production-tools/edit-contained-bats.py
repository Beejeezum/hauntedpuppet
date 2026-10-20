"""Review a planned vapor transition using ONLY uncropped native source spans.

The original raw movie fails framing. Retain frames0..107 (before any bright
wing reaches the edge), omit108..159 entirely, transition into native fog-only
frames160..192. Dynamic whole-frame staging and a soft advected dissolve are
explicit editorial effects, never a claim that clipped wings were repaired.
"""
from pathlib import Path
import hashlib,json,os,shutil,subprocess,wave
import cv2
import numpy as np
root=Path('source/wisp-performance-reference/tonight-demo')
source=root/'bat-ending-story-proof-v1.mp4'
prefix=root/'bat-contained-edit-study-v2'
picture=Path(str(prefix)+'-picture.mp4');sound=prefix.with_suffix('.wav');movie=prefix.with_suffix('.mp4');report=prefix.with_suffix('.json')
for path in (picture,sound,movie,report):
    if path.exists():raise SystemExit('Preserve existing review export')
ff=os.environ.get('HAUNT_FFMPEG') or shutil.which('ffmpeg') or 'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
cap=cv2.VideoCapture(str(source));assert abs(cap.get(cv2.CAP_PROP_FPS)-24)<.001
frames=[]
while True:
    ok,f=cap.read()
    if not ok:break
    frames.append(f)
cap.release();assert len(frames)==193
def smooth(x):
    x=np.clip(x,0,1);return x*x*(3-2*x)
def matte(f):
    a=smooth((f.max(2).astype(np.float32)-12)/12)
    f=np.rint(f.astype(np.float32)*a[:,:,None]).astype('uint8');f[f.max(2)<=3]=0
    return f.astype(np.float32)
noise=cv2.resize(np.random.default_rng(71).random((20,36)).astype(np.float32),(1280,720),interpolation=cv2.INTER_CUBIC)
noise=cv2.GaussianBlur(noise,(0,0),8);noise=.18+.64*(noise-noise.min())/(noise.max()-noise.min())
encoder=subprocess.Popen([ff,'-hide_banner','-loglevel','error','-n','-f','rawvideo','-pix_fmt','bgr24','-s','1280x720','-r','24','-i','pipe:0','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(picture)],stdin=subprocess.PIPE)
count=0
try:
    for i in range(157):
        scale=.85-.33*smooth((i-80)/20)
        if i<92:
            f=matte(frames[i])
        else:
            position=160+(i-92)/2
            lower=min(192,int(position));upper=min(192,lower+1);fraction=position-lower
            fog=np.clip((matte(frames[lower])*(1-fraction)+matte(frames[upper])*fraction)*3,0,255)
        if 92<=i<108:
            p=(i-92)/15
            field=np.roll(noise,(round(p*18),round(p*26)),axis=(0,1))
            alpha=1-smooth((p-field+.14)/.28)
            f=matte(frames[i])*alpha[:,:,None]+fog*(1-alpha[:,:,None])
        elif i>=108:
            f=fog
        # Keep the original lettering centre fixed while the disrupted cloud
        # contracts; actual bat perspective/wing motion remains native footage.
        transform=np.array([[scale,0,759-scale*780],[0,scale,351.5-scale*350]],np.float32)
        staged=cv2.warpAffine(np.rint(f).astype('uint8'),transform,(1280,720),flags=cv2.INTER_AREA)
        encoder.stdin.write(staged.tobytes());count+=1
    encoder.stdin.close();assert encoder.wait()==0
except BaseException:
    encoder.kill();encoder.wait();raise
raw=subprocess.check_output([ff,'-hide_banner','-loglevel','error','-i',str(source),'-vn','-ar','48000','-ac','2','-f','f32le','pipe:1'])
audio=np.frombuffer(raw,dtype='<f4').reshape(-1,2)
mix=np.zeros((157*2000,2),np.float32)
positions=160*2000+np.arange(65*2000)/2
fog_audio=np.column_stack([np.interp(positions,np.arange(len(audio)),audio[:,channel]) for channel in range(2)])
mix[:92*2000]=audio[:92*2000]
for i in range(92,108):
    p=smooth(np.linspace((i-92)/16,(i-91)/16,2000))[:,None]
    mix[i*2000:(i+1)*2000]=audio[i*2000:(i+1)*2000]*(1-p)+fog_audio[(i-92)*2000:(i-91)*2000]*p
mix[108*2000:]=fog_audio[16*2000:]
with wave.open(str(sound),'wb') as out:
    out.setnchannels(2);out.setsampwidth(2);out.setframerate(48000);out.writeframes(np.rint(np.clip(mix,-1,1)*32767).astype('<i2').tobytes())
subprocess.run([ff,'-hide_banner','-loglevel','error','-n','-i',str(picture),'-i',str(sound),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart',str(movie)],check=True)
report.write_text(json.dumps({'status':'editorial study, actual motion/mix review pending','releaseApproved':False,'source':source.name,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'frames':157,'fps':24,'keptSourceSpans':[[0,107],[160,192]],'omittedSourceSpan':[108,159],'transition':'frames92..107 advected dissolution into native fog-only160..192 at half-speed,3x post-matte fog brightness; adjacent fog-only frames blended, no character interpolation;16-frame audio crossfade','stage':'whole-frame .85 to .52 smoothstep80..100 around original letter centre; no crop','scope':'All clipped native bat frames excluded. Planned editorial vapor transition, not a repaired full native generation; visual acceptance and all-frame bounds still required.','sha256':hashlib.sha256(movie.read_bytes()).hexdigest()},indent=2))
print(movie)
