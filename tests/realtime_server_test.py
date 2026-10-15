import unittest,sys,os,json,threading,time,urllib.error
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]));import realtime_voice as r
SDP='v=0\r\no=- test\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n'
NONCE='12345678-1234-1234-1234-123456789abc'
class Response:
 headers={'Location':'https://api.openai.com/v1/realtime/calls/rtc_test123'}
 def __enter__(self):return self
 def __exit__(self,*a):pass
 def read(self,*a):return SDP.encode()
class NativeServer(unittest.TestCase):
 def setUp(self):r.CALLS.clear();r.CREATING=False
 def tearDown(self):r.CALLS.clear();r.CREATING=False
 def test_realtime_contract(self):
  with patch.dict(os.environ,{'OPENAI_API_KEY':'test-only'}),patch.object(r.urllib.request,'urlopen',return_value=Response()) as req:
   d=r.create({'sdp':SDP,'sessionNonce':NONCE,'audience':'little'});wire=req.call_args.args[0]
   self.assertEqual(wire.full_url,'https://api.openai.com/v1/realtime/calls');self.assertIn(b'"type": "realtime"',wire.data);self.assertIn(b'gpt-realtime-2.1',wire.data);self.assertIn(b'marin',wire.data);self.assertNotIn('live/sessions',wire.full_url);self.assertNotIn('test-only',json.dumps(d));self.assertTrue(d['canHangup']);self.assertEqual(d['ticket'],NONCE)
   r.end({'ticket':NONCE});self.assertEqual(len(r.CALLS),0);self.assertTrue(req.call_args.args[0].full_url.endswith('/hangup'))
 def test_one_call_and_heartbeat(self):
  with patch.dict(os.environ,{'OPENAI_API_KEY':'test-only'}),patch.object(r.urllib.request,'urlopen',return_value=Response()):
   r.create({'sdp':SDP,'sessionNonce':NONCE})
   with self.assertRaises(r.CallBusy):r.create({'sdp':SDP,'sessionNonce':'abcdef12-1234-1234-1234-123456789abc'})
   self.assertTrue(r.heartbeat({'ticket':NONCE})['alive']);r.reap(time.monotonic()+100);self.assertEqual(len(r.CALLS),0)
 def test_cancel_pending_create(self):
  opened=threading.Event();release=threading.Event();errors=[]
  def urlopen(req,**kw):
   if req.full_url.endswith('/calls'):opened.set();release.wait(2)
   return Response()
  def run():
   try:r.create({'sdp':SDP,'sessionNonce':NONCE})
   except Exception as e:errors.append(e)
  with patch.dict(os.environ,{'OPENAI_API_KEY':'test-only'}),patch.object(r.urllib.request,'urlopen',side_effect=urlopen):
   t=threading.Thread(target=run);t.start();self.assertTrue(opened.wait(2));self.assertTrue(r.end({'ticket':NONCE})['pendingCleanup']);release.set();t.join(3);self.assertFalse(t.is_alive());self.assertEqual(len(r.CALLS),0);self.assertIsInstance(errors[0],ValueError)
 def test_network_cleanup_retry(self):
  with patch.dict(os.environ,{'OPENAI_API_KEY':'test-only'}),patch.object(r.urllib.request,'urlopen',return_value=Response()):r.create({'sdp':SDP,'sessionNonce':NONCE})
  with patch.dict(os.environ,{'OPENAI_API_KEY':'test-only'}),patch.object(r.urllib.request,'urlopen',side_effect=TimeoutError('network')):
   with self.assertRaises(TimeoutError):r.end({'ticket':NONCE})
  self.assertTrue(r.CALLS[NONCE]['ending'])
  with patch.dict(os.environ,{'OPENAI_API_KEY':'test-only'}),patch.object(r.urllib.request,'urlopen',return_value=Response()):r.reap(time.monotonic()+10)
  self.assertEqual(len(r.CALLS),0)
 def test_bad_requests_and_missing_key(self):
  for data in ({'sdp':'abc'},{'sdp':SDP,'sessionNonce':NONCE,'audience':'adult'},{'sdp':SDP,'sessionNonce':NONCE,'voice':'unknown'}):
   with self.assertRaises(ValueError):r.create(data)
  with patch.dict(os.environ,{},clear=True),self.assertRaises(ValueError):r.create({'sdp':SDP,'sessionNonce':NONCE})
 def test_no_unsolicited_turns_or_unbounded_tools(self):
  c=r.session_config({});self.assertEqual(c['audio']['output']['voice'],'marin');self.assertEqual([t['name'] for t in c['tools']],['end_encounter']);self.assertTrue(c['audio']['input']['turn_detection']['interrupt_response']);self.assertIn('Do not start a conversation',c['instructions'])
if __name__=='__main__':unittest.main()
