"""Local dashboard adapter. The LAN controller never receives provider credentials."""
import ipaddress,json,threading,time,urllib.request,urllib.error
from phone_remote.phone_server import create_server
from vendor.qrcodegen import QrCode

LOCK=threading.RLock()
SERVER=None
THREAD=None
OWNER=None
OWNER_AT=0

def _request(path,data=None):
 with LOCK:
  if not SERVER:raise ValueError('Enable the phone remote on this laptop first.')
  port=SERVER.server_port;secret=SERVER.remote.secret
 req=urllib.request.Request(f'http://127.0.0.1:{port}/bridge/'+path,data=None if data is None else json.dumps(data).encode(),headers={'X-Wisp-Bridge':secret,'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=3) as r:return json.load(r)
 except urllib.error.HTTPError as e:
  try:msg=json.load(e).get('error','Phone remote request failed.')
  except Exception:msg='Phone remote request failed.'
  raise ValueError(msg)

def _links(server):
 addresses=[]
 for h in server.allowed_hosts:
  try:
   ip=ipaddress.ip_address(h)
   if ip.version==4 and ip.is_private and not ip.is_loopback and not ip.is_unspecified:addresses.append(h)
  except ValueError:pass
 return [f'http://{h}:{server.server_port}/' for h in sorted(addresses)] or [f'http://localhost:{server.server_port}/']

def _qr_svg(text):
 qr=QrCode.encode_text(text,QrCode.Ecc.MEDIUM);size=qr.get_size();path=' '.join(f'M{x+4},{y+4}h1v1h-1z' for y in range(size) for x in range(size) if qr.get_module(x,y))
 return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size+8} {size+8}" role="img" aria-label="Phone remote address QR code"><rect width="100%" height="100%" fill="white"/><path d="{path}" fill="black"/></svg>'

def status(client=None):
 with LOCK:
  if not SERVER:return {'enabled':False,'pairedPhones':0,'links':[]}
  with SERVER.remote.lock:paired=len(SERVER.remote.sessions)
  return {'enabled':True,'owner':client==OWNER,'ownerActive':time.monotonic()-OWNER_AT<5,'pairedPhones':paired,'links':_links(SERVER),'port':SERVER.server_port}

def enable(client):
 global SERVER,THREAD,OWNER,OWNER_AT
 with LOCK:
  if SERVER:
   if OWNER!=client and time.monotonic()-OWNER_AT<5:raise ValueError('Another laptop desk owns the phone remote. Disable it there, or wait until that desk closes.')
   OWNER=client;OWNER_AT=time.monotonic();return status(client)
  try:SERVER=create_server('0.0.0.0',8771)
  except OSError:raise ValueError('Phone remote port 8771 is busy. Close the other remote service, then enable again.')
  THREAD=threading.Thread(target=SERVER.serve_forever,name='wisp-phone-remote',daemon=True);THREAD.start()
  OWNER=client;OWNER_AT=time.monotonic()
 return status(client)

def disable():
 global SERVER,THREAD,OWNER,OWNER_AT
 with LOCK:
  server=SERVER;SERVER=None;THREAD=None;OWNER=None;OWNER_AT=0
 if server:
  with server.remote.lock:server.remote.sessions.clear();server.remote.queue.clear();server.remote.code=None
  server.shutdown();server.server_close()
 return {'enabled':False,'pairedPhones':0,'links':[]}

def dispatch(action,data=None):
 global OWNER_AT
 data=data or {}
 client=data.get('clientId')
 if not isinstance(client,str) or not 8<=len(client)<=100:raise ValueError('Phone desk identity is required. Refresh this laptop desk.')
 data={k:v for k,v in data.items() if k!='clientId'}
 if action=='enable':return enable(client)
 if action=='disable':return disable()
 if action=='status':return status(client)
 with LOCK:
  if client!=OWNER:raise ValueError('This desk does not own the phone remote. Enable it here after the other desk closes.')
  OWNER_AT=time.monotonic()
 if action=='pairing':
  paired=_request('pairing',{});state=status(client);url=state['links'][0]
  return {**paired,**state,'url':url,'qrSvg':_qr_svg(url)}
 if action=='poll':return _request('commands')
 if action=='state':return _request('state',data)
 if action=='ack':return _request('ack',data)
 if action=='revoke':return _request('revoke',{})
 raise ValueError('Unknown phone remote action.')
