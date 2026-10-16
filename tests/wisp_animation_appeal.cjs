// Optional real-time visual rehearsal; synthetic/offline and never starts voice or microphone.
const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const output=process.env.HAUNT_ANIMATION_PROOF||path.resolve('../wisp-night-performance-proof');fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:output,size:{width:1280,height:720}}}),page=await context.newPage(),errors=[],voiceRequests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST'&&/realtime|conversation|speak|session/.test(r.url()))voiceRequests.push(r.url());});
 await page.route('**/*',route=>route.request().isNavigationRequest()&&new URL(route.request().url()).pathname==='/'?route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Wisp offline animation rehearsal</title><body></body>'}):route.continue());
 await page.goto(process.env.HAUNT_TEST_BASE||'http://127.0.0.1:8770');
 const result=await page.evaluate(async()=>{
  const {PaintedWisp}=await import('/assets/painted-wisp.js'),{actionDuration}=await import('/assets/wisp-choreography.js');const w=new PaintedWisp();await w.load();
  document.body.replaceChildren(w.canvas);document.body.style.cssText='margin:0;background:#08091a;overflow:hidden';w.canvas.style.cssText='display:block;width:100vw;height:100vh;object-fit:contain';
  const sequence=['wave','surprise','dance','twirl','peekaboo','celebrate','bounce','orbit','shy','laugh','enter','exit'],p={state:'idle',visible:1,density:1,motion:{float:85,gesture:100},acting:{},gaze:'audience',blink:0};
  let start=performance.now(),previous=start,frames=0,minimum=Infinity,maximum=0,clipped=0,actions=new Set();
  await new Promise(resolve=>{function step(now){const clock=(now-start)/1000,dt=(now-previous)/1000;previous=now;let remaining=clock,kind='';for(const name of sequence){const slot=actionDuration(name)+.65;if(remaining<slot){kind=name;break;}remaining-=slot;}const action={kind,at:remaining};actions.add(kind);w.render({...p,clock,dt,action});const s=w.inspect();minimum=Math.min(minimum,s.bounds.minY);maximum=Math.max(maximum,s.bounds.maxY);if(!s.bounds.inside)clipped++;frames++;if(clock<60)requestAnimationFrame(step);else resolve();}requestAnimationFrame(step);});
  return {durationSeconds:(performance.now()-start)/1000,frames,minimum,maximum,clipped,actions:[...actions].filter(Boolean),renderer:w.inspect().renderer,layers:w.inspect().assetCount};
 });
 assert.equal(result.clipped,0);assert.equal(result.actions.length,12);assert(result.durationSeconds>=60);assert(result.frames>1200);assert.deepEqual(errors,[]);assert.deepEqual(voiceRequests,[]);
 await page.screenshot({path:path.join(output,'cute-wisp-performance-final.png')});const video=page.video();await context.close();const originalVideo=await video.path();await video.saveAs(path.join(output,'cute-wisp-12-routines-rehearsal.webm'));if(originalVideo!==path.join(output,'cute-wisp-12-routines-rehearsal.webm'))fs.unlinkSync(originalVideo);await browser.close();fs.writeFileSync(path.join(output,'cute-wisp-rehearsal.json'),JSON.stringify({...result,errors,voiceRequests,scope:'60 second real-time offline painted character choreography. No provider, microphone, physical projector or audience test.'},null,2));console.log('PASS 60 second animation appeal rehearsal',JSON.stringify(result));
})().catch(e=>{console.error(e);process.exit(1)});
