import json, threading, unittest, urllib.request, urllib.error
from phone_remote.phone_server import create_server, Remote
class ServerTest(unittest.TestCase):
    def setUp(self):
        self.s=create_server(port=0); self.r=self.s.remote; self.base=f'http://127.0.0.1:{self.s.server_port}'
        self.t=threading.Thread(target=self.s.serve_forever,daemon=True);self.t.start()
    def tearDown(self): self.s.shutdown();self.s.server_close()
    def req(self,path,body=None,token=None,bridge=False,headers=None):
        h=headers or {};h=dict(h)
        if token:h['Authorization']='Bearer '+token
        if bridge:h['X-Wisp-Bridge']=self.r.secret
        if body is not None:h['Content-Type']='application/json'
        request=urllib.request.Request(self.base+path,data=json.dumps(body).encode() if body is not None else None,headers=h)
        try: response=urllib.request.urlopen(request)
        except urllib.error.HTTPError as e: response=e
        return response.status,json.loads(response.read())
    def pair(self):
        status,code=self.req('/bridge/pairing',{},bridge=True);self.assertEqual(status,200)
        status,data=self.req('/api/pair',{'code':code['code']});self.assertEqual(status,200);return data['token']
    def ready(self):self.req('/bridge/state',{'state':{'status':'idle','volume':.5,'key':'secret'},'cues':['hello']},bridge=True)
    def test_pair_control_ack_revoke(self):
        token=self.pair();self.ready();status,snap=self.req('/api/state',token=token)
        self.assertTrue(snap['connected']);self.assertNotIn('key',snap['state'])
        status,cmd=self.req('/api/command',{'id':'phone-0001','command':'gesture','value':'wave'},token);self.assertEqual(status,202)
        status,queue=self.req('/bridge/commands',bridge=True);self.assertEqual(queue['commands'][0]['seq'],cmd['seq'])
        self.req('/bridge/ack',{'seq':cmd['seq'],'status':'applied'},bridge=True)
        self.assertEqual(self.req('/api/state',token=token)[1]['acks'][0]['status'],'applied')
        self.assertEqual(self.req('/api/command',{'id':'phone-0001','command':'gesture','value':'wave'},token)[0],409)
        self.req('/bridge/revoke',{},bridge=True);self.assertEqual(self.req('/api/state',token=token)[0],401)
    def test_bold_controls_and_welcome_priority(self):
        token=self.pair();self.ready()
        for i,(command,value) in enumerate([('move','dance'),('move','twirl'),('form','haunting'),('reveal','arm'),('reveal','fire')]):
            self.assertEqual(self.req('/api/command',{'id':f'puppet-command-{i}','command':command,'value':value},token)[0],202)
        self.assertEqual(self.req('/api/command',{'id':'welcome-kiddos-001','command':'welcome','value':None},token)[0],202)
        commands=self.req('/bridge/commands',bridge=True)[1]['commands']
        self.assertEqual(len(commands),1);self.assertEqual(commands[0]['command'],'welcome')
        self.assertEqual(self.req('/api/command',{'id':'unknown-animation','command':'move','value':'unsafe-device-control'},token)[0],400)
    def test_security_invalid_and_origin(self):
        self.assertEqual(self.req('/bridge/pairing',{})[0],403)
        self.assertEqual(self.req('/api/state')[0],401)
        self.assertEqual(self.req('/api/pair',{'code':'000000'},headers={'Origin':'https://evil.example'})[0],403)
        self.assertEqual(self.req('/api/pair',{'code':'000000'},headers={'Host':'evil.example'})[0],403)
        token=self.pair();self.ready()
        for kind,value in [('shell','rm'),('volume',2),('cue','unknown'),('gesture',['wave'])]:
            self.assertEqual(self.req('/api/command',{'id':'invalid-'+kind,'command':kind,'value':value},token)[0],400)
    def test_limits_and_expiry(self):
        for i in range(5):self.assertEqual(self.req('/api/pair',{'code':'000000'})[0],403)
        self.assertEqual(self.req('/api/pair',{'code':'000000'})[0],429)
        self.r.attempts.clear();token=self.pair();self.ready()
        for i in range(12):self.assertEqual(self.req('/api/command',{'id':f'command-{i}','command':'gesture','value':'wave'},token)[0],202)
        self.assertEqual(self.req('/api/command',{'id':'command-over','command':'gesture','value':'wave'},token)[0],429)
        self.r.clock=lambda:10000000000
        self.assertFalse(self.r.snapshot()['connected']);self.assertEqual(self.r.poll()['commands'],[])
    def test_panic_bypasses_flood(self):
        token=self.pair();self.ready()
        for i in range(12):self.req('/api/command',{'id':f'flood-{i:03}','command':'gesture','value':'wave'},token)
        status,panic=self.req('/api/command',{'id':'panic-stop-000','command':'stop','value':None},token)
        self.assertEqual(status,202)
        queue=self.req('/bridge/commands',bridge=True)[1]['commands']
        self.assertEqual(len(queue),1);self.assertEqual(queue[0]['command'],'stop')
        self.assertTrue(any(a['status']=='cancelled' for a in self.req('/api/state',token=token)[1]['acks']))
        self.r.queue.extend({'seq':100+i,'id':str(i),'command':'gesture','value':'wave','expiresAt':self.r.clock()+3} for i in range(64))
        self.assertEqual(self.req('/api/command',{'id':'panic-black-000','command':'blackout','value':'on'},token)[0],202)
        self.assertEqual(len(self.r.queue),1)
    def test_expired_sessions_do_not_block_pairing(self):
        now=self.r.clock()
        self.r.sessions={f'old{i}':{'created':now-28801} for i in range(8)}
        token=self.pair();self.assertEqual(len(self.r.sessions),1);self.assertIn(token,self.r.sessions)
    def test_preview_restriction(self):
        self.assertEqual(self.req('/bridge/state',{'preview':'data:image/svg+xml;base64,abc'},bridge=True)[0],400)
        self.assertEqual(self.req('/bridge/state',{'preview':'data:image/jpeg;base64,/9j/','state':{}},bridge=True)[0],200)
if __name__=='__main__':unittest.main()
