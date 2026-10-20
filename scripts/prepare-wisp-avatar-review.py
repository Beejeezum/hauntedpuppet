"""Restore an avatar export to its known reference aspect, then add stable projection reserve.
Only use after a source/output comparison confirms global squash. This is explicit
video correction, not automatic detection or restoration of missing painted detail.
Original input is never overwritten; encoded audio packets are copied unchanged.
"""
import argparse,json,hashlib,subprocess
from pathlib import Path
from PIL import Image
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('input',type=Path);p.add_argument('reference',type=Path);p.add_argument('output',type=Path)
p.add_argument('--ffmpeg',type=Path,default=Path(__file__).resolve().parents[1]/'work/animation-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1')
p.add_argument('--confirmed-global-squash',action='store_true',required=True)
a=p.parse_args()
if a.output.exists() or a.output.resolve()==a.input.resolve():p.error('Output must be a new file; preserve original exports and previous reviews.')
with Image.open(a.reference) as im:rw,rh=im.size
# Full reference rectangle fits central70percent of1916x1080. Never crop smoke.
fit=min(1916*.7/rw,1080*.7/rh);w=max(2,round(rw*fit/2)*2);h=max(2,round(rh*fit/2)*2)
x=(1916-w)//2;y=(1080-h)//2
vf=f'scale={w}:{h}:flags=lanczos,setsar=1,pad=1916:1080:{x}:{y}:black'
a.output.parent.mkdir(parents=True,exist_ok=True)
subprocess.run([str(a.ffmpeg),'-hide_banner','-loglevel','error','-n','-i',str(a.input),'-vf',vf,'-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart',str(a.output)],check=True)
def audio_hash(path):
 return subprocess.check_output([str(a.ffmpeg),'-v','error','-i',str(path),'-map','0:a:0','-c','copy','-f','hash','-hash','sha256','-']).decode().strip()
before=audio_hash(a.input);after=audio_hash(a.output)
if before!=after:raise RuntimeError('Audio packet mismatch; do not promote output.')
meta={'input':a.input.name,'inputSha256':hashlib.sha256(a.input.read_bytes()).hexdigest(),'reference':a.reference.name,'referenceSize':[rw,rh],'output':a.output.name,'outputSha256':hashlib.sha256(a.output.read_bytes()).hexdigest(),'filter':vf,'audioPacketHash':after,'audioPacketsUnchanged':True,'scope':'Explicit global de-squash and stable letterbox only; requires all-frame fog review and human identity/acting acceptance. Not a native provider fix.'}
a.output.with_suffix('.provenance.json').write_text(json.dumps(meta,indent=2)+'\n');print(json.dumps(meta,indent=2))
