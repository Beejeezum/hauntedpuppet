"""Make a single-clock review movie from the actual Night watch browser capture.
No generated assets, frame interpolation, voice or physical projection claims.
"""
from pathlib import Path
import hashlib,json,math,re,subprocess,sys
import numpy as np
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[1]
WORK=ROOT/'work/yard-night-movie'
SOURCE=WORK/'night-watch-native.webm'
OUT=ROOT/'source/attraction-v2/console/media/night-watch-loop-v1.mp4'
FF=ROOT/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
def run(args):return subprocess.run([str(FF),'-hide_banner',*args],stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True)
scan=run(['-i',str(SOURCE),'-vf','showinfo','-an','-f','null','-'])
pts=[float(t) for t in re.findall(rb'pts_time:([\d.]+)',scan.stderr)]
(WORK/'capture-timestamps.json').write_text(json.dumps(pts)+'\n')
assert len(pts)>3000 and 115<pts[-1]<140,'Expected a complete two-minute captured scene sequence'
duration=math.ceil((pts[-1]+1/30)*30)/30
# Both holds were recorded while the stage was empty. Replace codec residue with
# literal black; no performance frames or effects are cut away.
video_filter=f"scale=in_range=full:out_range=tv,format=yuv420p,setparams=range=limited,fps=30:start_time=0,tpad=stop_mode=clone:stop_duration=1,drawbox=x=0:y=0:w=iw:h=ih:color=black:t=fill:enable='lt(t,0.8)+gte(t,{duration-3})'"
if '--audit-only' not in sys.argv:run(['-y','-i',str(SOURCE),'-vf',video_filter,'-af','aresample=async=1:first_pts=0,apad','-t',str(duration),'-c:v','libx264','-preset','slow','-crf','20','-pix_fmt','yuv420p','-color_range','tv','-force_key_frames',str(duration-3),'-c:a','aac','-b:a','128k','-ar','48000','-movflags','+faststart',str(OUT)])
assert OUT.stat().st_size<12*1024*1024,'Review movie must fit the current public package budget'
# Decode the entire exported movie, then independently inspect its continuous audio timeline.
decoded=run(['-i',str(OUT),'-vf','showinfo','-an','-f','null','-'])
out_pts=[float(t) for t in re.findall(rb'pts_time:([\d.]+)',decoded.stderr)]
assert len(out_pts)==round(duration*30)
audio=np.frombuffer(run(['-v','error','-i',str(OUT),'-vn','-f','f32le','-ac','2','-ar','48000','pipe:1']).stdout,dtype='<f4').reshape(-1,2)
peak=float(np.abs(audio).max());assert .01<peak<.8 and np.count_nonzero(np.abs(audio)>=.999)==0
assert abs(len(audio)/48000-duration)<.05
assert float(np.abs(audio[:36000]).max())<.0001 and float(np.abs(audio[-144000:]).max())<.0001,'Loop boundaries must remain quiet'
# Check sparse sound gestures against the real recorded motion/event clock.
# The counter is sampled every100ms; audible onsets use10ms amplitude windows.
capture=json.loads((WORK/'capture.json').read_text());samples=capture['samples']
events=[v for i,v in enumerate(samples) if i and v['played']>samples[i-1]['played']]
block_count=len(audio)//480
peaks=np.max(np.abs(audio[:block_count*480].reshape(block_count,480,2)),axis=(1,2))
groups=[]
for index in np.where(peaks>.001)[0]:
 if not groups or index-groups[-1][-1]>20:groups.append([int(index)])
 else:groups[-1].append(int(index))
regions=[{'start':g[0]/100,'end':(g[-1]+1)/100,'peak':float(max(peaks[g]))} for g in groups]
assert len(regions)==len(events)==12,'Every scheduled gesture must remain in the embedded soundtrack'
errors=[abs(r['start']-e['t']) for r,e in zip(regions,events)]
assert max(errors)<.15,'Encoded effects no longer agree with the captured scene clock'
alignment={'scope':'Decoded AAC vs100ms sampled native effect counter;10ms onset windows. Not human mix approval.','regions':regions,'maximumOnsetOffsetSeconds':max(errors),'gestures':len(events)}
(WORK/'audio-alignment.json').write_text(json.dumps(alignment,indent=2)+'\n')
cadence={}
for phase in ['eyes','spider','apparitions']:
 visible=[v for v in samples if v['program']==phase and v['running'] and not v['hold']]
 first,last=visible[0]['t'],visible[-1]['t'];phase_pts=[t for t in pts if first<=t<=last]
 gaps=np.diff(phase_pts);assert max(gaps)<.1,'Visible captured motion has a gap over100ms'
 cadence[phase]={'capturedFrames':len(phase_pts),'meanCapturedFPS':len(phase_pts)/(last-first),'p95FrameGap':float(np.quantile(gaps,.95)),'maximumFrameGap':float(max(gaps))}
boundary=[]
for t in [.1,.5,duration-.75,duration-.1]:
 b=run(['-v','error','-ss',str(t),'-i',str(OUT),'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1']).stdout
 assert len(b)==1280*720*3
 p=int(np.frombuffer(b,dtype='uint8').max());assert p==0,'Movie boundary contains visible pixels'
 boundary.append({'at':t,'rgbPeak':p})
sheet=Image.new('RGB',(960,4*294),'#111820');draw=ImageDraw.Draw(sheet)
for i,t in enumerate([4,20,43,54,65,82,98,duration-2]):
 b=run(['-v','error','-ss',str(t),'-i',str(OUT),'-frames:v','1','-vf','scale=480:270','-f','rawvideo','-pix_fmt','rgb24','pipe:1']).stdout
 x=i%2*480;y=i//2*294;sheet.paste(Image.frombytes('RGB',(480,270),b),(x,y));draw.text((x+10,y+276),f'{t:.1f}s · encoded movie',fill='white')
sheet.save(WORK/'movie-contact.png')
report={'kind':'recorded-night-watch-review','file':str(OUT.relative_to(ROOT)),'sha256':hashlib.sha256(OUT.read_bytes()).hexdigest(),'bytes':OUT.stat().st_size,'sourceCaptureSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'durationSeconds':duration,'frames':len(out_pts),'fps':30,'dimensions':[1280,720],'embeddedAudio':'stereo AAC48k; native dry effects, no music or dialogue','audioSeconds':len(audio)/48000,'audioPeak':peak,'clippedSamples':0,'blackBoundaries':boundary,'maximumCaptureFrameGapSeconds':max(b-a for a,b in zip(pts,pts[1:])),'sourceCapturedFrames':len(pts),'cadence':cadence,'audioEventAlignment':alignment,'generationCredits':0,'humanArtAndMixApproval':False,'physicalProjection':False,'loopBoundaryTreatment':'Literal black for initial0.8s and final3s inside recorded empty holds removes low-level codec residue (RGBpeak9initial/2final). No performance is trimmed.','scope':'One encoded continuous movie of the native browser scene with embedded audio. Reuses current painted footage/raster spider. Not the proposed actor-led signature story; not a new Runway performance.'}
(WORK/'movie-audit.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
