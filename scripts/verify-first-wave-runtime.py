"""Verify encoded first-wave revision and empty-stage audio handoff.
No aesthetic/sound approval is inferred. No new media or paid generation.
"""
from pathlib import Path
import hashlib,json,subprocess,re,os,shutil
import numpy as np
ROOT=Path(__file__).resolve().parents[1];F=ROOT/'source/wisp-performance-reference/button-cue-batch';FF=os.environ.get('FFMPEG') or shutil.which('ffmpeg') or ROOT/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
meta=json.loads((F/'friendly-wave-runtime-candidate-v3.json').read_text());sound=json.loads((F/meta['soundRevision']).read_text());geometry=json.loads((F/'friendly-wave-runtime-candidate-v2-review.json').read_text());movie=F/meta['file'];before=F/geometry['file'];master=F/sound['soundSource']
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(movie)==meta['sha256']==sound['waveSha256'];assert sha(before)==geometry['sha256'];assert sha(master)==sound['soundSourceSha256']
def ff(args):return subprocess.check_output([str(FF),'-v','error',*map(str,args)])
def video_payload(p):return ff(['-i',p,'-map','0:v:0','-c:v','copy','-f','hash','-hash','sha256','pipe:1']).decode().strip()
def frames(p):return [line.strip() for line in ff(['-i',p,'-map','0:v:0','-an','-f','framemd5','pipe:1']).decode().splitlines() if line.strip() and not line.startswith('#')]
a=video_payload(before);b=video_payload(movie);assert a==b,'Compressed picture payload changed';oldframes=frames(before);newframes=frames(movie);assert oldframes==newframes and len(newframes)==meta['frameCount']==241,'Decoded pixels/timing changed'
def audio(p):return np.frombuffer(ff(['-i',p,'-map','0:a:0','-ac','2','-ar','48000','-f','f32le','pipe:1']),dtype='<f4').reshape(-1,2)
expected=audio(master);actual=audio(movie);count=len(expected);assert count==sound['firstClipSamples'];assert count<=len(actual)<=count+2048
assert np.isfinite(actual).all();correlation=float(np.corrcoef(expected.reshape(-1),actual[:count].reshape(-1))[0,1]);assert correlation>.99,'Encoded audio does not match intended dry master'
rmsDbFS=float(20*np.log10(max(1e-12,float(np.sqrt(np.mean(actual.astype(np.float64)**2))))));peak=float(np.abs(actual).max());tail=float(np.abs(actual[count-24000:count]).max());assert peak<.8 and tail<.000001,'No quiet sound tail for handoff'
assert abs(meta['audio']['peak']-peak)<1e-7 and abs(meta['audio']['rmsDbFS']-rmsDbFS)<.0001,'v3 audio differs from declared stereo48k measurement'
log=subprocess.run([str(FF),'-hide_banner','-i',str(movie),'-vn','-af','ashowinfo','-f','null','-'],capture_output=True,text=True,check=True).stderr
blocks=[(float(t),int(n))for t,n in re.findall(r'pts_time:\s*([-\d.]+).*?nb_samples:(\d+)',log)];assert blocks;position=0;maxerror=0
for at,n in blocks:maxerror=max(maxerror,abs(at-position/48000));position+=n
assert maxerror<.0001,'Audio presentation gap'
assert geometry['thresholdSummaries']['4']['reserveFailures']==0 and geometry['reserve']>=.15
head=geometry['emptyHeadByMaximumDecodedRGB']['0']['frames'];end=geometry['emptyTailByMaximumDecodedRGB']['0']['frames'];assert head>=12 and end>=12
report={'status':'encoded_media_checks_pass_human_review_pending','file':movie.name,'sha256':meta['sha256'],'compressedVideoIdentity':a,'decodedFrameAndTimingIdentity':True,'frameCount':len(newframes),'exactBlackHeadFrames':head,'exactBlackTailFrames':end,'reserve':geometry['reserve'],'boundsEvidence':geometry['file'].replace('.mp4','-review.json'),'sampleRate':48000,'expectedAudioSamples':count,'decodedAudioSamples':len(actual),'dryMasterCorrelation':correlation,'peak':peak,'rmsDbFS':rmsDbFS,'lastHalfSecondPeak':tail,'maximumAudioTimestampErrorSeconds':maxerror,'audioBlocks':len(blocks),'scope':'Exact compressed picture and decoded frame/timestamp identity to independently bounded v2; v3AAC tracks the dry replacement master with quiet tail and contiguous clock. Does not establish perceived nonmusical quality, action sync, human listening/visual approval, actual browser playlist seam or physical projection.'}
(F/'friendly-wave-runtime-candidate-v3-validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
