#!/usr/bin/env python3
"""Local 3D stage; speech delegated to existing key-owning local service."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit,unquote
import json,secrets,urllib.request,urllib.error,os,sys,subprocess,threading
import performance,conversation,realtime_voice,phone_bridge,credential_store,public_workspace,director_script
CONNECT_LOCK=threading.Lock()
SAVED_CREDENTIAL=False
CREDENTIAL_WARNING=''
def credential_status():return {'savedCredential':SAVED_CREDENTIAL,'credentialWarning':CREDENTIAL_WARNING}
def restore_credentials():
 global SAVED_CREDENTIAL,CREDENTIAL_WARNING
 if os.getenv('OPENAI_API_KEY') or not credential_store.supported():return
 try:key=credential_store.load()
 except Exception:
  CREDENTIAL_WARNING='The saved Mac Keychain credential could not be loaded. Unlock your login Keychain or reconnect securely.';return
 if key:os.environ['OPENAI_API_KEY']=key;SAVED_CREDENTIAL=True
def forget_credentials():
 global SAVED_CREDENTIAL,CREDENTIAL_WARNING
 if realtime_voice.inspect()['activeCalls']:raise realtime_voice.CallBusy('End live conversation and wait for connection cleanup before forgetting the key.')
 credential_store.delete();os.environ.pop('OPENAI_API_KEY',None);SAVED_CREDENTIAL=False;CREDENTIAL_WARNING=''
 return {'forgotten':True,'configured':False,**credential_status()}

ROOT=Path(__file__).resolve().parent;PORT=int(os.getenv('HAUNT_3D_PORT','8770'));TOKEN=secrets.token_urlsafe(32)
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,*a):pass
 def allowed(self):return self.headers.get('Host') in (f'127.0.0.1:{PORT}',f'localhost:{PORT}')
 def end_headers(self):self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');super().end_headers()
 def reply(self,code,data):
  b=json.dumps(data).encode();self.send_response(code);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(b)));self.end_headers();self.wfile.write(b)
 def serve_workspace(self,path,head=False):
  try:workspace=public_workspace.asset(path)
  except (FileNotFoundError,ValueError):self.send_error(404,'Workspace asset unavailable');return True
  if workspace is None:return False
  data,mime=workspace;size=len(data)
  try:requested=public_workspace.byte_range(self.headers.get('Range'),size)
  except ValueError:
   self.send_response(416);self.send_header('Content-Range',f'bytes */{size}');self.send_header('Content-Length','0');self.end_headers();return True
  self.send_response(206 if requested else 200);self.send_header('Content-Type',mime);self.send_header('Accept-Ranges','bytes')
  if requested:
   start,end=requested;self.send_header('Content-Range',f'bytes {start}-{end}/{size}');data=data[start:end+1]
  self.send_header('Content-Length',str(len(data)));self.end_headers()
  if not head:self.wfile.write(data)
  return True
 def do_HEAD(self):
  if not self.allowed():return self.send_error(403)
  path=unquote(urlsplit(self.path).path)
  if self.serve_workspace(path,head=True):return
  if path=='/':self.path='/index.html';path='/index.html'
  target=(ROOT/path.lstrip('/')).resolve()
  if path.startswith('/assets/') and (ROOT/'assets').resolve() not in target.parents:return self.send_error(403)
  if ROOT not in target.parents or not (path in ('/index.html','/live.html','/app.js') or path.startswith('/assets/')):return self.send_error(404)
  return super().do_HEAD()
 def do_GET(self):
  if not self.allowed():return self.reply(403,{'error':'Invalid host'})
  path=unquote(urlsplit(self.path).path)
  if path=='/api/status':
   if os.getenv('OPENAI_API_KEY'):return self.reply(200,{'version':'0.11.0','token':TOKEN,**credential_status(),'configured':True,'aligner':bool(performance.Decoder),'mode':'direct','conversation':True,'realtime':realtime_voice.inspect()})
   try:
    with urllib.request.urlopen('http://127.0.0.1:8766/api/status',timeout=3) as r:d=json.load(r)
    return self.reply(200,{'version':'0.11.0','token':TOKEN,**credential_status(),'configured':bool(d.get('configured')),'aligner':bool(d.get('aligner')),'conversation':False,'realtime':realtime_voice.inspect()})
   except Exception:return self.reply(200,{'version':'0.11.0','token':TOKEN,**credential_status(),'configured':False,'conversation':False,'realtime':realtime_voice.inspect(),'error':'Start the existing speech/alignment service on 8766. Offline rehearsal is available.'})
  if self.serve_workspace(path):return
  if path=='/':self.path='/index.html';path='/index.html'
  target=(ROOT/path.lstrip('/')).resolve()
  if path.startswith('/assets/') and (ROOT/'assets').resolve() not in target.parents:return self.reply(403,{'error':'Invalid asset path'})
  if ROOT not in target.parents or not (path in ('/index.html','/live.html','/app.js') or path.startswith('/assets/')):return self.reply(404,{'error':'Not found'})
  return super().do_GET()
 def do_POST(self):
  if not self.allowed() or self.headers.get('Origin') not in (f'http://127.0.0.1:{PORT}',f'http://localhost:{PORT}') or self.headers.get('X-Haunt-Token')!=TOKEN:return self.reply(403,{'error':'Invalid local request'})
  phone_actions=('enable','disable','status','pairing','poll','state','ack','revoke');phone_action=self.path.rsplit('/',1)[-1] if self.path.startswith('/api/phone/') else None
  if phone_action is not None and phone_action not in phone_actions:return self.reply(404,{'error':'Not found'})
  if phone_action is None and self.path not in ('/api/director/line','/api/performance','/api/transcribe','/api/reply','/api/connect','/api/credential/forget','/api/shutdown','/api/realtime/session','/api/realtime/end','/api/realtime/heartbeat','/api/realtime/config'):return self.reply(404,{'error':'Not found'})
  try:
   n=int(self.headers.get('Content-Length','0'));limit=150000 if self.path=='/api/phone/state' else 8100000 if self.path=='/api/transcribe' else 110000 if self.path=='/api/realtime/session' else 12000
   if not 0<n<=limit:return self.reply(400,{'error':'Invalid speech request size'})
   data=self.rfile.read(n);parsed=json.loads(data)
   if not isinstance(parsed,dict):raise ValueError('Expected an object')
   if phone_action is not None:return self.reply(200,phone_bridge.dispatch(phone_action,parsed))
   if self.path=='/api/realtime/config':return self.reply(200,{'instructions':realtime_voice.session_config(parsed)['instructions']})
   if self.path=='/api/realtime/session':return self.reply(201,realtime_voice.create(parsed))
   if self.path=='/api/realtime/heartbeat':return self.reply(200,realtime_voice.heartbeat(parsed))
   if self.path=='/api/realtime/end':return self.reply(200,realtime_voice.end(parsed))
   if self.path=='/api/shutdown':
    self.reply(200,{'stopped':True});threading.Thread(target=lambda:(phone_bridge.disable(),realtime_voice.shutdown(),self.server.shutdown()),daemon=True).start();return
   if self.path=='/api/credential/forget':
    with CONNECT_LOCK:forgotten=forget_credentials()
    return self.reply(200,forgotten)
   if self.path=='/api/connect':
    with CONNECT_LOCK:connect_voice()
    return self.reply(200,{'configured':bool(os.getenv('OPENAI_API_KEY')),**credential_status()})
   if self.path=='/api/transcribe':return self.reply(200,conversation.transcribe(parsed))
   if self.path=='/api/reply':return self.reply(200,conversation.reply(parsed))
   if self.path=='/api/director/line':return self.reply(200,director_script.line(parsed,os.getenv('OPENAI_API_KEY')))
   if os.getenv('OPENAI_API_KEY'):return self.reply(200,performance.performance(parsed))
   base='http://127.0.0.1:8766'
   with urllib.request.urlopen(base+'/api/status',timeout=4) as r:d=json.load(r)
   req=urllib.request.Request(base+'/api/performance',data=data,headers={'Origin':base,'X-Haunt-Token':d['token'],'Content-Type':'application/json'})
   with urllib.request.urlopen(req,timeout=100) as r:result=json.load(r)
   return self.reply(200,result)
  except realtime_voice.CallBusy as e:return self.reply(409,{'error':str(e)})
  except (ValueError,TypeError) as e:return self.reply(400,{'error':str(e)[:350]})
  except urllib.error.HTTPError as e:
   try:d=json.loads(e.read(5000));msg=d.get('error','OpenAI service failed');msg=msg.get('message','OpenAI service failed') if isinstance(msg,dict) else str(msg)
   except Exception:msg='Speech service failed'
   return self.reply(e.code if e.code in (400,401,403,429) else 502,{'error':msg})
  except Exception:return self.reply(503,{'error':'Speech service unavailable. Keep the voice server and alignment helper running. Offline rehearsal still works.'})
def connect_voice():
 global SAVED_CREDENTIAL,CREDENTIAL_WARNING
 script='tell application "System Events"\nactivate\nset resultDialog to display dialog "OpenAI key for Haunt. Enables voice and microphone conversation. Saved locally in your Mac login Keychain for future launches. Never included in the app or shared with the phone." default answer "" with hidden answer with title "Haunt 3D — Voice" buttons {"Cancel", "Connect"} default button "Connect"\nreturn text returned of resultDialog\nend tell'
 result=subprocess.run(['/usr/bin/osascript','-e',script],capture_output=True,text=True)
 if result.returncode==0:
  key=result.stdout.strip()
  if key and not any(c.isspace() for c in key):
   os.environ['OPENAI_API_KEY']=key;CREDENTIAL_WARNING=''
   try:credential_store.save(key);SAVED_CREDENTIAL=True
   except Exception:SAVED_CREDENTIAL=False;CREDENTIAL_WARNING='Connected for this run, but Mac Keychain could not save the key. Unlock your login Keychain and connect again to remember it.'
if __name__=='__main__':
 restore_credentials()
 if '--connect-voice' in sys.argv:
  try:
   base=f'http://127.0.0.1:{PORT}'
   with urllib.request.urlopen(base+'/api/status',timeout=2) as r:d=json.load(r)
   req=urllib.request.Request(base+'/api/connect',data=b'{}',headers={'Origin':base,'X-Haunt-Token':d['token'],'Content-Type':'application/json'})
   with urllib.request.urlopen(req,timeout=180) as r:json.load(r)
   subprocess.run(['/usr/bin/open','-a','Google Chrome',base],check=False);sys.exit(0)
  except (urllib.error.URLError,ConnectionError):connect_voice()
 if '--open' in sys.argv:threading.Timer(.7,lambda:subprocess.run(['/usr/bin/open','-a','Google Chrome',f'http://127.0.0.1:{PORT}/'],check=False)).start()
 realtime_voice.start_janitor()
 print(f'Haunt Wisp: http://127.0.0.1:{PORT} (Chrome)');ThreadingHTTPServer(('127.0.0.1',PORT),Handler).serve_forever()
