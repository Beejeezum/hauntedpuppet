"""Mac app bootstrap. Creates a private runtime; starts the local desk without a Terminal."""
from pathlib import Path
import urllib.request,json,subprocess,sys,time,os
ROOT=Path(__file__).resolve().parent
BASE='http://127.0.0.1:8770'
def alert(message):
 script='display alert "Haunt" message '+json.dumps(message)+' as informational'
 subprocess.run(['/usr/bin/osascript','-e',script],capture_output=True)
def main():
 try:
  with urllib.request.urlopen(BASE+'/api/status',timeout=2) as r:status=json.load(r)
  compatible=status.get('version')=='0.11.0'
  if not compatible:alert('A different Haunt version is already running. Close its Terminal, or use Quit local server in its app, then open this version again.');return
  subprocess.run(['/usr/bin/open','-a','Google Chrome',BASE]);return
 except (OSError,ValueError):pass
 support=Path.home()/'Library'/'Application Support'/'Haunt';support.mkdir(parents=True,exist_ok=True)
 logdir=Path.home()/'Library'/'Logs'/'Haunt';logdir.mkdir(parents=True,exist_ok=True)
 runtime=support/'runtime';python=runtime/'bin'/'python'
 with (logdir/'launch.log').open('a') as log:
  if not python.exists():
   subprocess.run(['/usr/bin/osascript','-e','display notification "Preparing the local mouth-animation helper. First launch may take a minute." with title "Haunt"'],capture_output=True)
   try:
    subprocess.run([sys.executable,'-m','venv',str(runtime)],stdout=log,stderr=log,timeout=60,check=True)
    subprocess.run([str(python),'-m','pip','install','--disable-pip-version-check','-r',str(ROOT/'requirements.txt')],stdout=log,stderr=log,timeout=150,check=True)
   except (subprocess.SubprocessError,OSError):pass
  chosen=str(python) if python.exists() else sys.executable
  subprocess.Popen([chosen,str(ROOT/'server.py')],cwd=str(ROOT),stdout=log,stderr=log,start_new_session=True)
 for _ in range(40):
  try:
   with urllib.request.urlopen(BASE+'/api/status',timeout=.5) as r:json.load(r)
   subprocess.run(['/usr/bin/open','-a','Google Chrome',BASE]);return
  except (OSError,ValueError):time.sleep(.2)
 alert('The local server could not start. Haunt needs Python 3 and Google Chrome. Details are in Library/Logs/Haunt/launch.log.')
if __name__=='__main__':main()
