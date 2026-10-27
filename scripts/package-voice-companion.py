from pathlib import Path
import zipfile
root=Path(__file__).resolve().parents[1];base=root/'source/wisp-voice-companion';out=root/'assets/wisp-voice-companion.zip'
files=['engine.py','server.py','setup.py','requirements.txt','Launch Wisp Voice.command','README.txt','LICENSE-Seed-VC','references/cute.wav','references/demon.wav']
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED)as z:
 for name in files:
  p=base/name;info=zipfile.ZipInfo('Wisp Voice Toolkit/'+name,(2026,10,27,0,0,0));info.external_attr=(0o100755 if name.endswith('.command')else 0o100644)<<16;info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,p.read_bytes())
print('Packaged isolated Wisp laptop voice toolkit')
