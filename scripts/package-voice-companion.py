from pathlib import Path
import zipfile,json
root=Path(__file__).resolve().parents[1];base=root/'source/wisp-voice-companion';out=root/'assets/wisp-voice-companion.zip'
files=['engine.py','server.py','setup.py','requirements.txt','Launch Wisp Voice.command','README.txt','LICENSE-Seed-VC','references/cute.wav','references/demon.wav']
# A small explicit public frontend, without films, server credentials or any model checkpoints.
studio={}
for folder in ['assets/wisp-live','assets/vendor/mediapipe','assets/vendor/pixi']:
 for p in (root/folder).rglob('*'):
  if p.is_file():studio[str(p.relative_to(root))]=p.read_bytes()
for name in ['assets/performer-face-tracker.js','assets/phone-bridge.js','assets/puppeteer-pitch-worklet.js']:studio[name]=(root/name).read_bytes()
manifest=json.loads((root/'scripts/public-tonight-demo.json').read_text());wanted={'live-puppet.html','live-puppet.mjs','tonight.css','paired-controls.mjs','friendly-fog-reference.png','friendly-fog-neutral-v1.png','friendly-mouths-v1.png'}
for item in manifest['files']:
 if item['destination']in wanted:
  data=(root/item['source']).read_bytes()
  if item.get('rewrites'):
   text=data.decode()
   for rewrite in item['rewrites']:text=text.replace(rewrite['from'],rewrite['to'])
   data=text.encode()
  if item['destination']=='live-puppet.html':data=data.replace(b'href="index.html"',b'href="https://deploy-preview-12--hauntedpuppet.netlify.app/assets/wisp-tonight/"').replace(b'href="puppet.html"',b'href="https://deploy-preview-12--hauntedpuppet.netlify.app/assets/wisp-tonight/puppet.html"')
  studio['assets/wisp-tonight/'+item['destination']]=data
studio['assets/wisp-film-preview/wisp-film-output.js']=(root/'source/wisp-performance-reference/runway-pilots/wisp-film-output.js').read_bytes();studio['assets/wisp-showdesk/operator-access.mjs']=(root/'source/wisp-performance-reference/ambient-show/operator-access.mjs').read_bytes()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED)as z:
 def add(name,data,executable=False):
  info=zipfile.ZipInfo('Wisp Voice Toolkit/'+name,(2026,10,27,0,0,0));info.external_attr=(0o100755 if executable else 0o100644)<<16;info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,data)
 for name in files:add(name,(base/name).read_bytes(),name.endswith('.command'))
 for name,data in sorted(studio.items()):add('studio/'+name,data)
print('Packaged local voice toolkit and explicit painted frontend:',round(out.stat().st_size/1024**2,1),'MiB')
