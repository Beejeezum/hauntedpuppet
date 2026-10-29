"""Private moving-body geometry proof. Not a speech renderer or approved asset."""
import argparse, hashlib, json, subprocess, math
from pathlib import Path
import cv2
import numpy as np
root=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);p.add_argument('--ffmpeg',type=Path,required=True);p.add_argument('--approved-voice',action='store_true');a=p.parse_args();out=a.output.resolve()
if root/'work' not in out.parents or out.exists():raise ValueError('Use a new work/ output directory')
d=json.loads((root/'source/wisp-art-reference/painted-speech-study/native-lip-mesh-study/friendly-native-lip-candidates-v1.json').read_text());src=root/d['source'];assert hashlib.sha256(src.read_bytes()).hexdigest()==d['sourceSha256'];out.mkdir(parents=True)
w,h=d['dimensions'];ff=str(a.ffmpeg.resolve());voice=root/'source/wisp-performance-reference/tonight-demo/apology-proof-v1.mp4'
voice_sha=None;envelope=None;total=len(d['frames'])
if a.approved_voice:
 voice_sha=hashlib.sha256(voice.read_bytes()).hexdigest();assert voice_sha=='d4dfefcfb62bbff4f32ba7b047a28a4bda5ab7b4def711c368f08d23213e819d'
 pcm=np.frombuffer(subprocess.check_output([ff,'-v','error','-i',str(voice),'-vn','-ac','1','-ar','24000','-f','f32le','pipe:1']),dtype='<f4')
 total=math.ceil(len(pcm)/1000);rms=np.array([np.sqrt(np.mean(pcm[i*1000:(i+1)*1000]**2)) for i in range(total)])
 floor=.008;ceiling=max(floor+.001,float(np.percentile(rms,90)));target=np.clip((rms-floor)/(ceiling-floor),0,1)**.65
 envelope=[];previous=0
 for value in target:
  previous+=(value-previous)*(.8 if value>previous else .65);envelope.append(0 if value==0 and previous<.025 else float(previous))
decoder=subprocess.Popen([ff,'-v','error','-threads','1','-stream_loop','-1','-i',str(src),'-frames:v',str(total),'-an','-f','rawvideo','-pix_fmt','bgr24','pipe:1'],stdout=subprocess.PIPE)
encoder=subprocess.Popen([ff,'-v','error','-f','rawvideo','-pix_fmt','bgr24','-s',f'{w}x{h}','-r','24','-i','pipe:0','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(out/'native-lip-surface-proof.mp4')],stdin=subprocess.PIPE)
atlas=cv2.imread(str(root/'source/wisp-art-reference/painted-speech-study/wisp-friendly-speaking-study-v2.png'));assert atlas is not None
oral=atlas[479:517,711:785];changed=[];rest_exact=[]
for i in range(total):
 f=d['frames'][i%len(d['frames'])]
 raw=decoder.stdout.read(w*h*3);assert len(raw)==w*h*3
 original=np.frombuffer(raw,np.uint8).reshape(h,w,3);image=original.copy();opening=envelope[i] if envelope is not None else max(0,np.sin(i/24*np.pi*2*.8))**1.7
 xs=np.array(f['upperInk'])[:,0];upper=np.array(f['upperInk'])[:,1];lower=np.array(f['lowerInk'])[:,1]
 x0=int(xs[0])-3;x1=int(xs[-1])+4;y0=int(min(upper))-20;y1=int(max(lower))+48
 yy,xx=np.mgrid[y0:y1,x0:x1].astype(np.float32);u=np.interp(xx,xs,upper);l=np.interp(xx,xs,lower)
 profile=np.sin(np.pi*np.clip((xx-xs[0])/(xs[-1]-xs[0]),0,1))**.8;gap=14*opening*profile;tu=u-.22*gap;tl=l+.78*gap
 # Inverse continuous mesh: fixed outer face, original upper/lower lips moved
 # independently; cavity is excluded from the surrounding painted surface.
 sy=yy.copy();above=yy<tu;below=yy>tl;inside=~(above|below)
 sy=np.where(above,np.where(yy<u-16,yy,(u-16)+(yy-(u-16))*16/np.maximum(tu-(u-16),1)),sy)
 sy=np.where(below,np.where(yy>l+36,yy,l+(yy-tl)*36/np.maximum((l+36)-tl,1)),sy)
 warped=cv2.remap(original,xx,sy.astype(np.float32),cv2.INTER_LINEAR,borderMode=cv2.BORDER_REPLICATE)
 if opening>0:
  # Oral-only paint, fixed texture scale. Lips occlude it; no new cheek/skin.
  ox=((xx-xs[0])/(xs[-1]-xs[0])*73).astype(np.float32);oy=(yy-(tu+tl)/2+18.5).astype(np.float32)
  cavity=cv2.remap(oral,ox,oy,cv2.INTER_LINEAR,borderMode=cv2.BORDER_REPLICATE)
  mask=(inside*profile*np.clip(gap/3,0,1)).astype(np.float32)[...,None]
  warped=np.rint(warped*(1-mask)+cavity*mask).astype(np.uint8)
  image[y0:y1,x0:x1]=warped
 else:rest_exact.append(bool(np.array_equal(image,original)))
 delta=np.any(image!=original,axis=2);assert not delta[:y0].any() and not delta[y1:].any();assert not delta[:, :x0].any() and not delta[:,x1:].any();changed.append(int(delta.sum()))
 if i in [0,11,49,50,51,52,77,99]:
  cv2.imwrite(str(out/f'face-{i:03}.png'),cv2.resize(image[y0:y1,x0:x1],None,fx=6,fy=6,interpolation=cv2.INTER_NEAREST))
 encoder.stdin.write(image.tobytes())
assert not decoder.stdout.read(1);assert decoder.wait()==0;encoder.stdin.close();assert encoder.wait()==0
if a.approved_voice:
 subprocess.run([ff,'-v','error','-i',str(out/'native-lip-surface-proof.mp4'),'-i',str(voice),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart',str(out/'native-lip-voice-proof.mp4')],check=True)
 (out/'acoustic-envelope.json').write_text(json.dumps({'fps':24,'opening':envelope,'voiceSha256':voice_sha,'method':'bounded RMS with attack/release; not phoneme or viseme recognition'})+'\n')
(out/'review.json').write_text(json.dumps({'status':'unapproved acoustic-driven moving-face proof; not runtime integration' if a.approved_voice else 'unapproved silent geometry proof; not speech or runtime integration','frames':len(changed),'sourceSha256':d['sourceSha256'],'changedPixelsMax':max(changed),'unchangedOutsideFaceSupport':True,'restFramesExact':all(rest_exact),'uncertainContourFrames':d['lowContrastFrames'],'limitations':['amplitude-driven opening only, no phoneme recognition or rounded/consonant shapes' if a.approved_voice else 'synthetic opening cycle, no speech synchronization','oral crop and mesh need human visual review','friendly only; scary not implemented','four low-contrast contour frames remain uncertain']},indent=2)+'\n');print(out)
