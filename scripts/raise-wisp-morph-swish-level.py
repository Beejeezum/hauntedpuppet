"""Apply the requested level increase to the endorsed dry mix, preserving picture.
Uses the saved human response and refuses changed sources or output overwrite.
"""
from pathlib import Path
import json,hashlib,subprocess,wave,numpy as np,os,shutil
root=Path(__file__).resolve().parents[1];folder=root/'source/wisp-performance-reference/button-cue-batch';old=folder/'wisp-morph-roundtrip-review-v6.mp4';new=folder/'wisp-morph-roundtrip-review-v7.mp4';assert not new.exists();ff=Path(os.environ.get('FFMPEG') or shutil.which('ffmpeg') or root/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1');source=folder/'wisp-morph-dry-swishes-v1.wav';wav=folder/'wisp-morph-dry-swishes-v2.wav';assert not wav.exists()
receipt=json.loads((folder/'human-morph-sound-review-2026-10-28.json').read_text());assert hashlib.sha256(old.read_bytes()).hexdigest()==receipt['sha256'],'Reviewed sound source changed'
with wave.open(str(source)) as w:params=w.getparams();samples=np.frombuffer(w.readframes(w.getnframes()),'<i2').astype(np.int32)
amplified=samples*2;assert max(abs(amplified))<32767
with wave.open(str(wav),'wb') as w:w.setparams(params);w.writeframes(amplified.astype('<i2').tobytes())
subprocess.run([str(ff),'-v','error','-n','-i',str(old),'-i',str(wav),'-map','0:v:0','-map','1:a:0','-c:v','copy','-video_track_timescale','24000','-c:a','aac','-b:a','192k','-movflags','+faststart',str(new)],check=True)
def essence(p):return subprocess.check_output([str(ff),'-v','error','-i',str(p),'-map','0:v:0','-c','copy','-f','hash','-hash','sha256','pipe:1'],text=True).strip()
assert essence(old)==essence(new);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();prior=json.loads(old.with_suffix('.json').read_text());feedback=receipt
(folder/'human-morph-sound-review-2026-10-28.json').write_text(json.dumps(feedback,indent=2)+'\n');prior['humanAudioReview']=dict(status='direction-endorsed;gain-revision-requested',**feedback);old.with_suffix('.json').write_text(json.dumps(prior,indent=2)+'\n')
report={**prior,'file':new.name,'sha256':sha(new),'humanAudioReview':{'status':'pending','directionEvidence':'human-morph-sound-review-2026-10-28.json'},'humanMotionSoundJoinReview':'Visuals approved; dry sound direction endorsed; +6dB level revision pending','soundRevision':{**prior['soundRevision'],'file':wav.name,'sha256':sha(wav),'gainFromPrevious':2,'gainDb':float(20*np.log10(2)),'sourceSound':source.name,'method':'Exact same sparse dry swishes, same sample positions, PCM amplitude doubled. No new bed or source added.'},'audioPeak':float(abs(amplified).max()/32768),'compressedPictureEssence':essence(new),'videoEssenceIdenticalToV6':True,'processing':'Approved compressed picture unchanged; identical dry-swish timing with +6.02dB gain, safely below clipping. No generation credits used.'}
new.with_suffix('.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(dict(file=new.name,pictureIdentical=True,gainDb=report['soundRevision']['gainDb'],peak=report['audioPeak'],frames=report['frameCount'])))
