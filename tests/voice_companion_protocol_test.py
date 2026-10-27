import asyncio,importlib.util,pathlib,struct,unittest,zipfile,tempfile
try:
 from aiohttp.test_utils import TestClient,TestServer
except ImportError:raise unittest.SkipTest('Install pinned aiohttp for the explicit companion protocol test step')
from aiohttp import WSServerHandshakeError,WSMsgType
ROOT=pathlib.Path(__file__).resolve().parents[1];spec=importlib.util.spec_from_file_location('wisp_companion',ROOT/'source/wisp-voice-companion/server.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
ORIGIN={'Origin':'http://127.0.0.1:8899'}
class FakeEngine:
 sr=22050
 def reset(self,voice):
  if voice not in ('cute','demon'):raise ValueError('bad voice')
  self.voice=voice
 def reference(self,voice,data):
  if voice not in ('cute','demon')or not data.startswith(b'RIFF'):raise ValueError('reference')
  self.reference_bytes=len(data)
 def convert(self,pcm):
  values=struct.unpack('<3200f',pcm)
  if any(not(-1<=v<=1)for v in values):raise ValueError('Invalid PCM')
  return struct.pack('<4410f',*([.01]*4410)),2.0
class Tests(unittest.IsolatedAsyncioTestCase):
 async def asyncSetUp(self):
  self.bridge=module.Bridge(FakeEngine());self.client=TestClient(TestServer(self.bridge.app()));await self.client.start_server()
 async def asyncTearDown(self):await self.client.close()
 async def test_origin_and_protocol(self):
  response=await self.client.get('/voice/status',headers={'Origin':'https://untrusted.example'});self.assertEqual(response.status,403)
  response=await self.client.get('/voice/status',headers=ORIGIN);status=await response.json();self.assertTrue(status['ready'])
  with self.assertRaises(WSServerHandshakeError):await self.client.ws_connect('/voice/stream',headers={'Origin':'https://untrusted.example'})
  ws=await self.client.ws_connect('/voice/stream',headers=ORIGIN);await ws.send_json({'token':status['token'],'voice':'cute'});self.assertEqual((await ws.receive_json())['type'],'ready')
  with self.assertRaises(WSServerHandshakeError):await self.client.ws_connect('/voice/stream',headers=ORIGIN)
  await ws.send_bytes(struct.pack('<3200f',*([.02]*3200)));metrics=await ws.receive_json();self.assertEqual(metrics['processingMs'],2.0);audio=await ws.receive();self.assertEqual(audio.type,WSMsgType.BINARY);self.assertEqual(len(audio.data),17640)
  await ws.send_json({'type':'voice','voice':'demon'});self.assertEqual((await ws.receive_json())['type'],'ready');self.assertEqual(self.bridge.engine.voice,'demon');await ws.close();await asyncio.sleep(.03);self.assertIsNone(self.bridge.owner)
 async def test_packaged_frontend_has_public_assets(self):
  with tempfile.TemporaryDirectory()as folder:
   with zipfile.ZipFile(ROOT/'assets/wisp-voice-companion.zip')as archive:
    self.assertTrue(all(name.startswith('Wisp Voice Toolkit/')and '..'not in pathlib.PurePosixPath(name).parts for name in archive.namelist()));archive.extractall(folder)
   package=pathlib.Path(folder)/'Wisp Voice Toolkit';spec=importlib.util.spec_from_file_location('packaged_companion',package/'server.py');packaged=importlib.util.module_from_spec(spec);spec.loader.exec_module(packaged);client=TestClient(TestServer(packaged.Bridge(FakeEngine()).app()));await client.start_server()
   try:
    for name in ['live-puppet.html','live-puppet.mjs','friendly-fog-reference.png']:
     response=await client.get('/assets/wisp-tonight/'+name);self.assertEqual(response.status,200)
    for name in ['assets/wisp-live/neural-worklet.js','assets/vendor/mediapipe/face_landmarker.task','assets/puppeteer-pitch-worklet.js']:
     response=await client.get('/'+name);self.assertEqual(response.status,200)
    response=await client.get('/api/status');self.assertEqual(response.status,404)
   finally:await client.close()
 async def test_private_reference_upload(self):
  response=await self.client.post('/voice/reference/cute',headers=ORIGIN,data=b'RIFFtest');self.assertEqual(response.status,401)
  headers={**ORIGIN,'Authorization':'Bearer '+self.bridge.token}
  response=await self.client.post('/voice/reference/cute',headers=headers,data=b'not wav');self.assertEqual(response.status,400)
  response=await self.client.post('/voice/reference/cute',headers=headers,data=b'RIFFtest');self.assertEqual(response.status,200);self.assertTrue((await response.json())['memoryOnly'])
 async def test_bad_token_and_bad_frames_release_owner(self):
  ws=await self.client.ws_connect('/voice/stream',headers=ORIGIN);await ws.send_json({'token':'invalid'});self.assertEqual((await ws.receive_json())['type'],'error');await ws.close();await asyncio.sleep(.03);self.assertIsNone(self.bridge.owner)
  ws=await self.client.ws_connect('/voice/stream',headers=ORIGIN);await ws.send_json({'token':self.bridge.token,'voice':'cute'});await ws.receive_json();await ws.send_bytes(b'bad');self.assertEqual((await ws.receive_json())['type'],'error');await ws.close();await asyncio.sleep(.03);self.assertIsNone(self.bridge.owner)
if __name__=='__main__':unittest.main()
