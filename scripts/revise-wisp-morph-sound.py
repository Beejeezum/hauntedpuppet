"""Replace the rejected morph score with sparse, nonmusical air gestures.\nPreserves the approved compressed picture; never overwrites prior exports.\n"""
from pathlib import Path
import hashlib,json,os,shutil,subprocess,wave
import numpy as np
root=Path(__file__).resolve().parents[1];folder=root/'source/wisp-performance-reference/button-cue-batch';source=folder/'wisp-morph-roundtrip-review-v5.mp4';out=folder/'wisp-morph-roundtrip-review-v6.mp4';assert not out.exists()
receipt=json.loads((folder/'human-morph-review-2026-10-28.json').read_text());assert hashlib.sha256(source.read_bytes()).hexdigest()==receipt['sha256'],'Approved picture changed'
ff=Path(os.environ.get('FFMPEG') or shutil.which('ffmpeg') or root/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1');sr=48000;count=607*2000;audio=np.zeros((count,2),np.float64);rng=np.random.default_rng(68179)
# Time, duration, strength, stereo position. No bed, pitches, notes or risers.
events=[(1.5,.55,.025,-.05),(6.45,1.15,.10,-.08),(8.75,.70,.055,.08),(16.1,1.05,.07,.05),(18.45,.70,.035,-.05),(22.1,.45,.018,.04)]
for start,duration,strength,pan in events:
 n=round(duration*sr);noise=rng.normal(size=n);freq=np.fft.rfftfreq(n,1/sr);weight=(freq/(freq+450))**3/(1+(freq/4300)**6)
 signal=np.fft.irfft(np.fft.rfft(noise)*weight,n=n);signal/=max(float(abs(signal).max()),1e-12)
 t=np.linspace(0,1,n);envelope=np.sin(np.pi*t)**1.8;signal*=envelope*strength
 at=round(start*sr);audio[at:at+n,0]+=signal*(1-pan);audio[at:at+n,1]+=signal*(1+pan)
peak=float(abs(audio).max());assert peak<.12
wav=folder/'wisp-morph-dry-swishes-v1.wav'
with wave.open(str(wav),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((audio*32767).astype('<i2').tobytes())
subprocess.run([str(ff),'-v','error','-n','-i',str(source),'-i',str(wav),'-map','0:v:0','-map','1:a:0','-c:v','copy','-video_track_timescale','24000','-c:a','aac','-b:a','192k','-movflags','+faststart',str(out)],check=True)
def essence(p):return subprocess.check_output([str(ff),'-v','error','-i',str(p),'-map','0:v:0','-c','copy','-f','hash','-hash','sha256','pipe:1'],text=True).strip()
assert essence(source)==essence(out)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();approval=receipt['visual']
old=source.with_suffix('.json');prior=json.loads(old.read_text());prior['humanVisualReview']=approval;prior['humanAudioReview']=dict(status='rejected',userResponse='Too musical or distracting',questionItem='call_c3a0f7756c53486a9eb3b9fdfc2dac49:1');old.write_text(json.dumps(prior,indent=2)+'\n')
report={**prior,'file':out.name,'sha256':sha(out),'audioPeak':peak,'audioSamples':count,'audioSampleRate':sr,'humanMotionSoundJoinReview':'visual identity/motion/fourjoins approved; revised sound pending','humanVisualReview':{**approval,'carriedToThisMovie':'Exact compressed video essence equality verified.'},'humanAudioReview':{'status':'pending','replacesRejectedSoundtrack':source.name},'soundRevision':{'file':wav.name,'sha256':sha(wav),'sampleRate':sr,'samples':count,'seed':68179,'events':events,'method':'Sparse broad-band noise swishes with smooth envelopes. No continuous bed, musical notes, oscillators, frequency sweep, voices or instrumental sources. Timed to character gestures and transformation acting; significantly reduced level.'},'compressedPictureEssence':essence(out),'videoEssenceIdenticalToV5':True,'generationCreditsSpent':0,'processing':'ApprovedV5 compressed picture copied unchanged. Entire rejected soundtrack replaced with sparse low-level dry fog swishes; no visual edit or retime.'}
out.with_suffix('.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(dict(file=out.name,videoEssenceIdentical=True,peak=peak,seconds=count/sr,visualApproved=True,soundReview='pending',credits=0)))
