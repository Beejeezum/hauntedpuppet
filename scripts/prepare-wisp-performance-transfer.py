"""Prepare matched fictional character studies for a bounded Act-Two pilot, not a generation.
Preserves originals. Uses existing local FFmpeg; clips first 90 frames at24fps.
The driver stops in the detected3.697-3.909second audio pause, before the second sentence.
"""
from pathlib import Path
import subprocess,json,hashlib
root=Path(__file__).resolve().parents[1]
base=root/'source/wisp-performance-reference/runway-pilots'
out=base/'performance-transfer-study';out.mkdir(exist_ok=True)
ff=root/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
inputs={'driver':base/'character-speech-study/wisp-character-speech-v2-proportion-review.mp4','character':base/'wisp-continuous-idle-v15.mp4'}
files=[]
for role,src in inputs.items():
 dst=out/f'wisp-{role}-90f-v1.mp4'
 args=[str(ff),'-hide_banner','-loglevel','error','-y','-i',str(src),'-t','3.75','-vf',('fps=24,setsar=1' if role=='driver' else 'fps=24,scale=1724:972:flags=lanczos,setsar=1,pad=1916:1080:96:54:black'),'-c:v','libx264','-crf','18','-pix_fmt','yuv420p']
 args+=['-af','atrim=end=3.75,asetpts=PTS-STARTPTS','-c:a','aac','-b:a','192k'] if role=='driver' else ['-an']
 subprocess.run(args+['-movflags','+faststart',str(dst)],check=True)
 files.append({'role':role,'source':str(src.relative_to(root)),'file':dst.name,'sha256':hashlib.sha256(dst.read_bytes()).hexdigest()})
meta={'status':'Prepared inputs only; not submitted or accepted by Act-Two','files':files,'durationSeconds':3.75,'framesExpected':90,'characterFit':'Stable90percent fit for existing v15 smoke envelope; no per-frame scale pumping or restoration of missing source pixels.','fps':24,'hypothesis':'Video-character mode preserves fuller v15 body acting while adding speech-face motion from corrected fictional Characters driver. No detached face overlay.','audioBoundary':'End3.75s falls inside measured -35dB silence3.697042..3.909333; no automated transcript or subjective listening acceptance claimed.','settingsIntent':{'characterInput':'video, not still','gestures':'unavailable for video; preserve existing character movement','expressiveness':3},'documentedRate':'5credits/second,3second minimum; inspect actual UI quote before submission.','rejectionGates':['Reject if face not recognized; do not repeatedly charge retries.','Reject if fog/hands/identity drift or body becomes static.','All-frame15percent buffer; no clipped smoke recovered by padding.','Audio/performance duration equal; no reversed boomerang extension.','Synthetic ghost driver is unproven; official guide recommends a person with visible face.'],'source':'https://help.runwayml.com/hc/en-us/articles/42311337895827-Performance-Capture-with-Act-Two','liveIntegration':False,'newCredits':0}
(out/'pilot-v1.json').write_text(json.dumps(meta,indent=2)+'\n')
print(out)
