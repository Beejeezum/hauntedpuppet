"""Test only: real loopback transport with explicitly synthetic conversion."""
import asyncio,pathlib,importlib.util,signal,struct,math,json
from aiohttp import web
ROOT=pathlib.Path(__file__).resolve().parents[1];spec=importlib.util.spec_from_file_location('companion',ROOT/'source/wisp-voice-companion/server.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class FakeEngine:
 sr=22050
 def reset(self,voice):
  if voice not in ('cute','demon'):raise ValueError('voice')
 def convert(self,pcm):
  if len(pcm)!=12800:raise ValueError('PCM')
  return struct.pack('<4410f',*[.1*math.sin(i*.1)for i in range(4410)]),2.0
 def reference(self,voice,data):
  if not data.startswith(b'RIFF'):raise ValueError('WAV')
async def main():
 bridge=m.Bridge(FakeEngine());app=bridge.app()
 async def disconnect(r):
  if bridge.owner is not None:await bridge.owner.close()
  return web.json_response({'testOnly':True})
 # Register before static catchall by replacing the distinct reserved route.
 app.router.add_post('/test-only/disconnect',disconnect)
 runner=web.AppRunner(app,access_log=None);await runner.setup();site=web.TCPSite(runner,'127.0.0.1',0);await site.start();port=site._server.sockets[0].getsockname()[1];m.ALLOWED.add('http://127.0.0.1:'+str(port));print(json.dumps({'base':'http://127.0.0.1:'+str(port),'syntheticEngine':True}),flush=True);done=asyncio.Event();asyncio.get_running_loop().add_signal_handler(signal.SIGTERM,done.set)
 try:await done.wait()
 finally:await runner.cleanup()
asyncio.run(main())
