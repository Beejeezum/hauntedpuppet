"""Optional LAN remote. No provider credentials or microphone traffic enters this service."""
import argparse, collections, hmac, ipaddress, json, secrets, socket, threading, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from socketserver import TCPServer
from pathlib import Path
from urllib.parse import urlsplit

TTL=90
COMMANDS={'gesture':{'wave','laugh','shy','surprise'},'gaze':{'left','right','center'},'audience':{'little','family','big'},'loop':{'on','off'},'move':{'phantom','enter', 'laugh', 'surprise', 'twirl', 'dance', 'bounce', 'orbit', 'exit', 'celebrate', 'peekaboo', 'shy', 'wave'},'form':{'friendly','haunting'},'welcome':{None},'reveal':{'arm','fire','cancel'},'stop':{None},'blackout':{'on','off'}}
class Remote:
    def __init__(self, clock=time.monotonic):
        self.clock=clock; self.lock=threading.RLock(); self.secret=secrets.token_urlsafe(32)
        self.code=None; self.code_until=0; self.sessions={}; self.attempts={}; self.queue=collections.deque(maxlen=64)
        self.seq=0; self.results={}; self.state={}; self.state_at=0; self.bridge_at=0; self.cues=[]; self.preview=None
    def pairing(self):
        with self.lock:
            self.code=f'{secrets.randbelow(1000000):06d}'; self.code_until=self.clock()+TTL
            return {'code':self.code,'expiresIn':TTL}
    def pair(self,ip,code):
        with self.lock:
            now=self.clock(); attempts=self.attempts.setdefault(ip,collections.deque())
            while attempts and attempts[0]<now-60: attempts.popleft()
            if len(attempts)>=5: return 429,{'error':'Too many attempts. Wait one minute.'}
            attempts.append(now)
            if not self.code or now>self.code_until or not isinstance(code,str) or not hmac.compare_digest(code,self.code): return 403,{'error':'Pairing code is incorrect or expired.'}
            self.sessions={token:s for token,s in self.sessions.items() if now-s['created']<=28800}
            if len(self.sessions)>=8: return 409,{'error':'Remote limit reached. Revoke an old phone.'}
            token=secrets.token_urlsafe(32); self.sessions[token]={'created':now,'seen':now,'ids':collections.OrderedDict(),'rate':collections.deque()}
            self.code=None
            return 200,{'token':token,'expiresIn':28800}
    def session(self,token):
        s=self.sessions.get(token)
        if not s or self.clock()-s['created']>28800: self.sessions.pop(token,None); return None
        s['seen']=self.clock(); return s
    def snapshot(self):
        now=self.clock()
        return {'connected':now-self.bridge_at<4 and now-self.state_at<4,'state':self.state if now-self.state_at<4 else {},'cues':self.cues,'stateAge':max(0,now-self.state_at),'preview':self.preview if now-self.state_at<4 else None}
    def command(self,token,data):
        with self.lock:
            s=self.session(token)
            if not s: return 401,{'error':'Pair this phone again.'}
            now=self.clock(); ident=data.get('id'); kind=data.get('command'); value=data.get('value')
            if not isinstance(ident,str) or not 8<=len(ident)<=80: return 400,{'error':'Invalid command ID.'}
            if ident in s['ids']: return 409,{'error':'Duplicate command ID.','seq':s['ids'][ident]}
            if not self.snapshot()['connected'] and kind not in ('stop','blackout','welcome'): return 503,{'error':'Laptop bridge is disconnected.'}
            valid=(kind in COMMANDS and value in COMMANDS[kind]) or (kind=='volume' and type(value) in (int,float) and 0<=value<=1) or (kind=='cue' and isinstance(value,str) and value in self.cues)
            if not valid: return 400,{'error':'Unsupported command or value.'}
            while s['rate'] and s['rate'][0]<now-1: s['rate'].popleft()
            emergency=kind in ('stop','welcome') or (kind=='blackout' and value=='on') or (kind=='reveal' and value=='cancel')
            if len(s['rate'])>=12 and not emergency: return 429,{'error':'Controls are arriving too quickly.'}
            if emergency:
                while self.queue:
                    old=self.queue.popleft(); self.results[old['seq']]={'seq':old['seq'],'status':'cancelled','at':now}
            if len(self.queue)>=64: return 503,{'error':'Command queue full.'}
            s['rate'].append(now); self.seq+=1
            self.results={seq:a for seq,a in self.results.items() if a['at']>now-120}
            s['ids'][ident]=self.seq
            while len(s['ids'])>256: s['ids'].popitem(last=False)
            self.queue.append({'seq':self.seq,'id':ident,'command':kind,'value':value,'expiresAt':now+3})
            self.results[self.seq]={'seq':self.seq,'status':'queued','at':now}
            return 202,{'seq':self.seq,'status':'queued'}
    def poll(self):
        with self.lock:
            self.bridge_at=self.clock(); live=[]
            while self.queue:
                c=self.queue.popleft()
                if c['expiresAt']<self.clock(): self.results[c['seq']]={'seq':c['seq'],'status':'expired','at':self.clock()}
                else: c.pop('expiresAt'); live.append(c)
            return {'commands':live}

class Handler(BaseHTTPRequestHandler):
    server_version='WispRemote/1'
    def setup(self):
        super().setup(); self.connection.settimeout(5)
    def log_message(self,*args): pass
    def send_json(self,status,data): self.send_bytes(status,json.dumps(data).encode(),'application/json')
    def send_bytes(self,status,data,typ):
        self.send_response(status); self.send_header('Content-Type',typ); self.send_header('Content-Length',str(len(data)))
        self.send_header('Cache-Control','no-store'); self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'")
        self.end_headers(); self.wfile.write(data)
    def guard(self):
        host=self.headers.get('Host','')
        try: parsed=urlsplit('http://'+host); hostname=parsed.hostname; port=parsed.port or 80
        except ValueError: return False
        if hostname not in self.server.allowed_hosts or port!=self.server.server_port: return False
        origin=self.headers.get('Origin')
        return not origin or origin=='http://'+host
    def data(self):
        n=int(self.headers.get('Content-Length','0'))
        limit=150000 if urlsplit(self.path).path=='/bridge/state' and self.authorized_bridge() else 4096
        if n<0 or n>limit: raise ValueError('Request too large')
        data=json.loads(self.rfile.read(n))
        if not isinstance(data,dict): raise ValueError('Object required')
        return data
    def authorized_bridge(self):
        try: local=ipaddress.ip_address(self.client_address[0]).is_loopback
        except ValueError: local=False
        return local and hmac.compare_digest(self.headers.get('X-Wisp-Bridge',''),self.server.remote.secret)
    def token(self): return self.headers.get('Authorization','').removeprefix('Bearer ')
    def do_GET(self): self.dispatch(False)
    def do_POST(self): self.dispatch(True)
    def dispatch(self,post):
        if not self.guard(): return self.send_json(403,{'error':'Host or origin is not allowed.'})
        r=self.server.remote; path=urlsplit(self.path).path
        try:
            if path.startswith('/bridge/'):
                if not self.authorized_bridge(): return self.send_json(403,{'error':'Bridge authentication required.'})
                with r.lock:
                    if path=='/bridge/pairing' and post: return self.send_json(200,r.pairing())
                    if path=='/bridge/commands' and not post: return self.send_json(200,r.poll())
                    if path=='/bridge/state' and post:
                        d=self.data(); state=d.get('state',{}); cues=d.get('cues',[]); preview=d.get('preview')
                        if preview is not None:
                            import base64
                            if not isinstance(preview,str) or not preview.startswith('data:image/jpeg;base64,') or len(preview)>140000: raise ValueError('Invalid preview')
                            try: raw=base64.b64decode(preview.split(',',1)[1],validate=True)
                            except Exception: raise ValueError('Invalid preview encoding')
                            if len(raw)>100000 or not raw.startswith(b'\xff\xd8\xff'): raise ValueError('Invalid JPEG preview')
                        if not isinstance(state,dict) or not isinstance(cues,list) or len(cues)>40 or any(not isinstance(c,str) or len(c)>64 for c in cues): raise ValueError('Invalid state')
                        # Only projection state. Never forward credentials, transcripts, or arbitrary server data.
                        r.state={k:v for k,v in state.items() if k in ('mood','audience','loop','blackout','volume','status','gesture','gaze','form','scaryReady','revealArmed','revealRunning','workspace') and isinstance(v,(str,bool,int,float))}
                        if r.state.get('workspace') not in ('films','live'): r.state.pop('workspace',None)
                        r.cues=cues; r.preview=preview; r.state_at=r.clock(); r.bridge_at=r.clock()
                        return self.send_json(200,{'ok':True})
                    if path=='/bridge/ack' and post:
                        d=self.data(); seq=d.get('seq'); status=d.get('status')
                        if type(seq)!=int or seq not in r.results or status not in ('applied','failed'): raise ValueError('Invalid acknowledgement')
                        r.results[seq]={'seq':seq,'status':status,'at':r.clock()}; return self.send_json(200,{'ok':True})
                    if path=='/bridge/revoke' and post:
                        r.sessions.clear(); r.queue.clear(); r.code=None; return self.send_json(200,{'ok':True})
            if path=='/api/pair' and post: return self.send_json(*r.pair(self.client_address[0],self.data().get('code')))
            if path.startswith('/api/'):
                with r.lock:
                    s=r.session(self.token())
                    if not s: return self.send_json(401,{'error':'Pair this phone again.'})
                    if path=='/api/state' and not post:
                        snap=r.snapshot(); owned=set(s['ids'].values()); snap['acks']=[{k:v for k,v in a.items() if k!='at'} for seq,a in r.results.items() if seq in owned]
                        cutoff=r.clock()-120
                        r.results={seq:a for seq,a in r.results.items() if a['at']>cutoff}
                        return self.send_json(200,snap)
                    if path=='/api/command' and post: return self.send_json(*r.command(self.token(),self.data()))
            if not post and path in ('/','/phone.js','/phone.css'):
                filename={'/':'index.html','/phone.js':'phone.js','/phone.css':'phone.css'}[path]
                typ={'/':'text/html; charset=utf-8','/phone.js':'text/javascript; charset=utf-8','/phone.css':'text/css; charset=utf-8'}[path]
                return self.send_bytes(200,(Path(__file__).parent/filename).read_bytes(),typ)
            self.send_json(404,{'error':'Not found.'})
        except (ValueError,TypeError,json.JSONDecodeError) as e: self.send_json(400,{'error':str(e)})

class BoundedServer(ThreadingHTTPServer):
    daemon_threads=True
    request_queue_size=16
    def __init__(self,*args,**kwargs):
        self.slots=threading.BoundedSemaphore(32)
        super().__init__(*args,**kwargs)
    def server_bind(self):
        # HTTPServer normally performs reverse DNS during bind; no lookup is needed.
        TCPServer.server_bind(self)
        self.server_name,self.server_port=self.server_address[:2]
    def process_request(self,request,address):
        if not self.slots.acquire(False):
            self.shutdown_request(request); return
        try: super().process_request(request,address)
        except Exception:
            self.slots.release(); raise
    def process_request_thread(self,request,address):
        try: super().process_request_thread(request,address)
        finally: self.slots.release()

def create_server(host='127.0.0.1',port=8771):
    server=BoundedServer((host,port),Handler); server.remote=Remote()
    # Avoid blocking reverse-DNS lookups when enabling the show remote.
    addresses={'localhost','127.0.0.1',socket.gethostname()}
    # Discover the default interface without sending a packet.
    try:
        with socket.socket(socket.AF_INET,socket.SOCK_DGRAM) as sock: sock.connect(('192.0.2.1',9)); addresses.add(sock.getsockname()[0])
    except OSError: pass
    if host!='0.0.0.0': addresses.add(host)
    server.allowed_hosts=addresses
    return server
if __name__=='__main__':
    p=argparse.ArgumentParser(); p.add_argument('--enable-lan',action='store_true'); p.add_argument('--port',type=int,default=8771); p.add_argument('--bridge-secret-file',required=True)
    args=p.parse_args(); server=create_server('0.0.0.0' if args.enable_lan else '127.0.0.1',args.port)
    import os
    fd=os.open(args.bridge_secret_file,os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600)
    os.fchmod(fd,0o600)
    with os.fdopen(fd,'w') as f: f.write(server.remote.secret)
    print('Wisp phone controller enabled on LAN.' if args.enable_lan else 'Wisp phone controller is local only.',flush=True)
    server.serve_forever()
