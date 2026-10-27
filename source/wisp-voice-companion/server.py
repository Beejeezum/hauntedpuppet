# SPDX-License-Identifier: GPL-3.0-only
"""Loopback-only single-operator PCM bridge; no microphone/provider credentials."""
import asyncio,concurrent.futures,hmac,json,pathlib,secrets,time,os,sys
from aiohttp import web,WSMsgType
ROOT=pathlib.Path(__file__).resolve().parents[2];PUBLIC=ROOT/'dist' if (ROOT/'scripts/public-tonight-demo.json').is_file()else None;HERE=pathlib.Path(__file__).resolve().parent
ALLOWED={'http://127.0.0.1:8899','http://localhost:8899','https://hauntedpuppet.netlify.app','https://deploy-preview-12--hauntedpuppet.netlify.app'}
class Bridge:
 def __init__(self,engine):self.engine=engine;self.token=secrets.token_urlsafe(32);self.owner=None;self.pool=concurrent.futures.ThreadPoolExecutor(max_workers=1)
 async def status(self,r):
  if r.headers.get('Origin')not in ALLOWED|{None}:raise web.HTTPForbidden()
  return web.json_response(dict(ready=True,engine='Seed-VC tiny',inputRate=16000,outputRate=self.engine.sr,blockMs=200,voices=['cute','demon'],token=self.token,busy=self.owner is not None),headers={'Cache-Control':'no-store','Access-Control-Allow-Origin':r.headers.get('Origin','http://127.0.0.1:8899'),'Access-Control-Allow-Private-Network':'true','Vary':'Origin'})
 async def reference(self,r):
  if r.headers.get('Origin')not in ALLOWED:raise web.HTTPForbidden()
  if not hmac.compare_digest(r.headers.get('Authorization',''),'Bearer '+self.token):raise web.HTTPUnauthorized()
  if self.owner is not None:raise web.HTTPConflict(text='Stop microphone before changing reference')
  data=await r.read()
  try:await asyncio.get_running_loop().run_in_executor(self.pool,self.engine.reference,r.match_info['voice'],data)
  except Exception:raise web.HTTPBadRequest(text='Use a 1–15second PCM16 WAV reference')
  return web.json_response({'saved':True,'memoryOnly':True},headers={'Access-Control-Allow-Origin':r.headers['Origin'],'Vary':'Origin'})
 async def options(self,r):
  if r.headers.get('Origin')not in ALLOWED:raise web.HTTPForbidden()
  return web.Response(headers={'Access-Control-Allow-Origin':r.headers['Origin'],'Access-Control-Allow-Private-Network':'true','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type','Vary':'Origin'})
 async def socket(self,r):
  if r.headers.get('Origin')not in ALLOWED:raise web.HTTPForbidden()
  if self.owner is not None:raise web.HTTPConflict(text='Another laptop voice session owns the converter')
  ws=web.WebSocketResponse(max_msg_size=14000,heartbeat=10);await ws.prepare(r);self.owner=ws
  try:
   message=await asyncio.wait_for(ws.receive(),5)
   if message.type!=WSMsgType.TEXT:raise ValueError('Handshake required')
   data=json.loads(message.data)
   if not hmac.compare_digest(str(data.get('token','')),self.token):raise ValueError('Local voice connection expired')
   voice=data.get('voice','cute');await asyncio.get_running_loop().run_in_executor(self.pool,self.engine.reset,voice);await ws.send_json(dict(type='ready',outputRate=self.engine.sr));sequence=0
   async for message in ws:
    if message.type==WSMsgType.TEXT:
     data=json.loads(message.data)
     if data.get('type')!='voice':raise ValueError('Unsupported control')
     await asyncio.get_running_loop().run_in_executor(self.pool,self.engine.reset,data.get('voice'));sequence=0;await ws.send_json(dict(type='ready',outputRate=self.engine.sr))
    elif message.type==WSMsgType.BINARY:
     if len(message.data)!=12800:raise ValueError('Invalid input block size')
     output,ms=await asyncio.wait_for(asyncio.get_running_loop().run_in_executor(self.pool,self.engine.convert,message.data),3)
     if ws.closed:break
     await ws.send_json(dict(type='metrics',processingMs=ms,sequence=sequence));await ws.send_bytes(output);sequence+=1
    elif message.type in (WSMsgType.ERROR,WSMsgType.CLOSE):break
  except Exception as e:
   if not ws.closed:await ws.send_json(dict(type='error',error='Voice conversion interrupted: '+type(e).__name__))
  finally:
   self.owner=None
   cleared=asyncio.get_running_loop().run_in_executor(self.pool,self.engine.reset,'cute')
   try:await ws.close()
   finally:await asyncio.shield(cleared)
  return ws
 async def shutdown(self,app):
  if self.owner is not None:await self.owner.close()
 async def close(self,app):
  self.pool.shutdown(wait=True,cancel_futures=True)
 def app(self):
  app=web.Application(client_max_size=4000000);app.router.add_get('/voice/status',self.status);app.router.add_options('/voice/status',self.options);app.router.add_get('/voice/stream',self.socket);app.router.add_post('/voice/reference/{voice}',self.reference);app.router.add_options('/voice/reference/{voice}',self.options)
  async def static(r):
   if PUBLIC is None:raise web.HTTPNotFound()
   name=r.match_info['path']or'assets/wisp-tonight/live-puppet.html';p=(PUBLIC/name).resolve();base=PUBLIC.resolve()
   if not p.is_relative_to(base)or not p.is_file():raise web.HTTPNotFound()
   return web.FileResponse(p,headers={'Cache-Control':'no-store'})
  app.router.add_get('/{path:.*}',static);app.on_shutdown.append(self.shutdown);app.on_cleanup.append(self.close);return app
if __name__=='__main__':
 from engine import SeedEngine
 runtime=pathlib.Path(os.environ.get('WISP_VOICE_WORK_DIR',ROOT/'work/wisp-voice-runtime'))
 import shutil
 if not(runtime/'ready-v1').exists()and shutil.disk_usage(runtime).free<3*1024**3:raise SystemExit('Free3GB before the first model download. No capture has started.')
 print('Loading local neural converter. No camera or microphone is opened by this process.',flush=True)
 engine=SeedEngine(pathlib.Path(os.environ.get('WISP_VOICE_WORK_DIR',ROOT/'work/wisp-voice-runtime'))/'seed-vc',{name:HERE/'references'/(name+'.wav')for name in ['cute','demon']})
 engine.warm();(runtime/'ready-v1').write_text('Models loaded and warmed. No acoustic acceptance implied.\n')
 print('Voice toolkit ready. Return to the Wisp app and choose Check toolkit connection.',flush=True)
 if PUBLIC is not None:print('Local Voice Studio: http://127.0.0.1:8899/assets/wisp-tonight/live-puppet.html',flush=True)
 web.run_app(Bridge(engine).app(),host='127.0.0.1',port=8899,access_log=None,print=None)
