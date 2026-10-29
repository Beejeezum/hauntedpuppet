# SPDX-License-Identifier: GPL-3.0-only
"""One-time isolated toolkit setup; never opens capture or accesses credentials."""
import pathlib,os,sys,shutil,subprocess,urllib.request,tarfile,time,json
HERE=pathlib.Path(__file__).resolve().parent;PIN='51383efd921027683c89e5348211d93ff12ac2a8'
REGISTRY=pathlib.Path.home()/'Library/Application Support/HauntedPuppet/voice-runtime.json'
LOCAL=HERE.parents[1]/'work/wisp-voice-runtime';DEFAULT=pathlib.Path.home()/'Library/Caches/HauntedPuppet/voice-runtime'
try:
 saved=pathlib.Path(json.loads(REGISTRY.read_text())['runtime'])
 if (saved/'installed-v1').is_file():DEFAULT=saved
except (OSError,ValueError,KeyError,TypeError):pass
if (LOCAL/'installed-v1').is_file()and (HERE.parents[1]/'scripts/public-tonight-demo.json').is_file():DEFAULT=LOCAL
WORK=pathlib.Path(os.environ.get('WISP_VOICE_WORK_DIR',DEFAULT)).expanduser().resolve()
def remember():
 REGISTRY.parent.mkdir(parents=True,exist_ok=True);REGISTRY.write_text(json.dumps({'runtime':str(WORK)}))

def main():
 if (WORK/'installed-v1').is_file():remember()
 try:
  with urllib.request.urlopen('http://127.0.0.1:8899/voice/status',timeout=1)as response:status=json.load(response)
  if status.get('ready')and status.get('inputRate')==16000 and status.get('outputRate')==22050:
   print('Wisp voice toolkit is already running. Return to the app and choose Check toolkit connection.');return
 except Exception:pass
 if sys.version_info<(3,12):raise SystemExit('Run this toolkit with Python3.12 or newer. Install Python from python.org if needed.')
 WORK.mkdir(parents=True,exist_ok=True);python=WORK/'venv/bin/python'
 if not python.exists():
  if shutil.disk_usage(WORK).free<5*1024**3:raise SystemExit('Voice toolkit needs at least5GB free before its first setup. No downloads started.')
  subprocess.run([sys.executable,'-m','venv',str(WORK/'venv')],check=True)
 if not(WORK/'installed-v1').exists():
  if shutil.disk_usage(WORK).free<5*1024**3:raise SystemExit('Free5GB before installing the voice runtime. Partial setup is preserved.')
  subprocess.run([str(python),'-m','pip','install','--no-cache-dir','-r',str(HERE/'requirements.txt')],check=True);(WORK/'installed-v1').write_text('Pinned Python dependencies installed. Models download on first launch.\n')
 checkout=WORK/'seed-vc'
 if not checkout.exists():
  if shutil.disk_usage(WORK).free<3*1024**3:raise SystemExit('Free3GB before downloading voice models. Existing setup is preserved.')
  archive=WORK/'seed-source.tar.gz';urllib.request.urlretrieve('https://codeload.github.com/Plachtaa/seed-vc/tar.gz/'+PIN,archive)
  with tarfile.open(archive)as tar:tar.extractall(WORK,filter='data')
  (WORK/('seed-vc-'+PIN)).rename(checkout);archive.unlink()
 remember()
 print('Toolkit installed. Starting local conversion engine. No camera or microphone opens until you start it in Wisp.',flush=True)
 os.environ['WISP_VOICE_WORK_DIR']=str(WORK);os.execv(str(python),[str(python),str(HERE/'server.py')])
if __name__=='__main__':main()
