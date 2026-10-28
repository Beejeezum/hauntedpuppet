"""One continuous, buffered eyes-in-context review with original frames and dry PCM.
Source-only review, never a cue/loop/join approval. Refuses existing outputs.
"""
from pathlib import Path
import hashlib,json,re,subprocess,wave
import cv2,numpy as np

ROOT=Path(__file__).resolve().parents[1];FOLDER=ROOT/'source/wisp-performance-reference/button-cue-batch'
FF=ROOT/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
OUT=FOLDER/'wisp-eyes-context-review-v1.mp4'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
pins={'wisp-morph-roundtrip-review-v7.mp4':'275acb319821ed88d9eda3220f6c9a61e59d484450537293588d601784de08dc','scary-eyes-runtime-candidate-v1.mp4':'8d30ec2f4d781fd8b663a04e855949d454e1d09948c1d913e8393437a3a4e1f3','wisp-morph-dry-swishes-v2.wav':'040f3712ba542d39d2a587d6a11fbeb4e4ea4e87a61c7e2689eeb11e2e2ab715','scary-eyes-dry-air-v1.wav':'63d02358efeb2613d1bb0161a149cc8f14c24a8f49a2effcdd02016b4352fb80'}
for name,expected in pins.items():assert sha(FOLDER/name)==expected,'Pinned input changed: '+name
assert not OUT.exists() and not OUT.with_suffix('.json').exists(),'Refuse overwrite'
def pcm(name,count):
    with wave.open(str(FOLDER/name)) as w:
        assert (w.getframerate(),w.getnchannels(),w.getsampwidth())==(48000,2,2)
        a=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2).copy()
    assert len(a)==count*2000
    return a
old=pcm('wisp-morph-dry-swishes-v2.wav',607);eyes=pcm('scary-eyes-dry-air-v1.wav',241)
audio=np.concatenate([old[:486000],eyes,old[486000:]])
assert len(audio)==848*2000 and abs(audio.astype(np.int32)).max()<30000
wav=ROOT/'work/wisp-eyes-context-review-v1.wav'
with wave.open(str(wav),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(48000);w.writeframes(audio.tobytes())
boundaries=[122,243,484,605,726]
command=[str(FF),'-v','error','-n','-f','rawvideo','-pixel_format','bgr24','-video_size','1280x720','-framerate','24','-i','pipe:0','-i',str(wav),'-map','0:v:0','-map','1:a:0','-frames:v','848','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-video_track_timescale','24000','-g','240','-flags','+cgop','-x264-params','open-gop=0:scenecut=0','-force_key_frames',','.join(str(n/24) for n in [0]+boundaries),'-c:a','aac','-b:a','192k','-movflags','+faststart',str(OUT)]
encoder=subprocess.Popen(command,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
stage=np.float32([[.765,0,150.4],[0,.765,84.6]])
submitted=0;held={}
def emit(f):
    global submitted
    assert f.shape==(720,1280,3)
    if submitted in [0,121,122,242,243,483,484,604,605,725,726,847]:held[submitted]=f.copy()
    encoder.stdin.write(f.tobytes());submitted+=1
try:
    cap=cv2.VideoCapture(str(FOLDER/'wisp-morph-roundtrip-review-v7.mp4'));assert cap.get(cv2.CAP_PROP_FPS)==24
    for index in range(607):
        if index==243:
            c=cv2.VideoCapture(str(FOLDER/'scary-eyes-runtime-candidate-v1.mp4'));assert c.get(cv2.CAP_PROP_FPS)==24
            for _ in range(241):ok,f=c.read();assert ok;emit(f)
            assert not c.read()[0];c.release()
        ok,f=cap.read();assert ok
        emit(cv2.warpAffine(f,stage,(1280,720),flags=cv2.INTER_LANCZOS4))
    assert not cap.read()[0];cap.release();encoder.stdin.close();error=encoder.stderr.read().decode();assert encoder.wait()==0,error
except BaseException:
    encoder.kill();encoder.wait();raise
assert submitted==848
cap=cv2.VideoCapture(str(OUT));count=0;minimum=[1.]*4;fails=0
while True:
    ok,f=cap.read()
    if not ok:break
    y,x=np.where(f.max(axis=2)>4)
    if len(x):
        m=[x.min()/1280,y.min()/720,(1279-x.max())/1280,(719-y.max())/720];minimum=[min(a,float(b)) for a,b in zip(minimum,m)];fails+=int(min(m)<.15)
    count+=1
assert cap.get(cv2.CAP_PROP_FPS)==24;cap.release();assert count==848 and fails==0
def compare(a,b):
    m=a.max(2)>16;n=b.max(2)>16;union=m|n
    return {'silhouetteIoU':float((m&n).sum()/union.sum()),'visibleRGBMeanAbsoluteDifference':float(np.abs(a.astype(float)-b)[union].mean())}
keylog=subprocess.run([str(FF),'-hide_banner','-skip_frame','nokey','-i',str(OUT),'-an','-vf','showinfo','-f','null','-'],capture_output=True,text=True,check=True).stderr
keytimes=[float(x) for x in re.findall(r'pts_time:\s*([-\d.]+)',keylog)]
for frame in [0]+boundaries:assert any(abs(t-frame/24)<.001 for t in keytimes),'Missing independently decodable cut at '+str(frame)
report={'file':OUT.name,'sha256':sha(OUT),'status':'contextual motion/sound/join review only; not approved library or loop','frames':848,'fps':24,'seconds':848/24,'sourcePins':pins,'insertAtOriginalFrame':243,'segments':[{'source':'wisp-morph-roundtrip-review-v7.mp4','firstFrame':0,'frameCount':243,'fixedWholeFrameScale':.765},{'source':'scary-eyes-runtime-candidate-v1.mp4','firstFrame':0,'frameCount':241,'fixedWholeFrameScale':1,'sourceAlreadyBuffered':.9},{'source':'wisp-morph-roundtrip-review-v7.mp4','firstFrame':243,'frameCount':364,'fixedWholeFrameScale':.765}],'audioSamples':len(audio),'audioRate':48000,'audioPcmSha256':hashlib.sha256(audio.tobytes()).hexdigest(),'audioProcessing':'Exact original dry16bitPCM arrays concatenated at frame243*2000samples, then oneAAC encode. No new voices/music/noise bed or inserted silence.','cutFrames':boundaries,'cutSeconds':[f/24 for f in boundaries],'newEyesCutFrames':[243,484],'cueWindows':[{'id':name,'firstFrame':first,'frameCount':count} for name,first,count in [('friendly-drift-A',0,122),('cute-to-evil',122,121),('scary-eyes',243,241),('scary-drift',484,121),('evil-to-cute',605,121),('friendly-drift-B',726,122)]],'cutPixelDiagnosticScope':'Staged input pictures before final encoding; not decoded output pixel equality, joint velocity or human seam approval.','allCutPixelDiagnostics':[{'frames':[f-1,f],**compare(held[f-1],held[f])} for f in boundaries],'closingPixelDiagnostics':compare(held[847],held[0]),'keyframeTimes':keytimes,'closedGopAtAllCuts':True,'reserveFailuresRGB4':fails,'minimumMarginsLTRB_RGB4':minimum,'generationCreditsSpent':0,'processing':'All607old frames and241eyes frames in original order/duration. Uniform fixed0.765 whole-frame staging of the complete old review, eyes retains its existing fixed0.9 staging. No animated resize, body deformation, interpolation, reversal, added freeze, body crossfade or cut concealment. One continuous picture/audio clock; forced closed-GOP cut points permit future pixel-identical approved segment extraction.','scope':'New size calibration and both new visible cuts require human motion/material/sound review. Pixel metrics are diagnostic, not velocity or seam approval. Old contextual visual endorsement does not approve this newly staged file, closing loop or arbitrary routes. Physical projection untested.','humanApproval':False,'runtimePublication':False}
OUT.with_suffix('.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ['file','frames','seconds','minimumMarginsLTRB_RGB4','allCutPixelDiagnostics','keyframeTimes']}))
