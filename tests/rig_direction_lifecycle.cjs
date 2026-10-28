const assert=require('node:assert/strict'),fs=require('node:fs'),pw=require('playwright');
(async()=>{
 const fixture=await require('./tonight_fixture.cjs').start(),engine=process.env.HAUNT_BROWSER||'chromium',browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{}),results=[];
 try{
  for(const delayed of ['manifest','image','pagehide']){
   const context=await browser.newContext(),page=await context.newPage(),errors=[];let pending,requests=0;
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/rig-lifecycle.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Painted rig lifecycle</title>'}));
   await page.route(delayed==='image'?'**/cute-turn-five.png':'**/cute-turn-five.json',r=>{requests++;pending=r;});
   await page.goto(fixture.base+'/rig-lifecycle.html');
   await page.evaluate(async()=>{const {WispRigRuntime}=await import('/assets/wisp-rig-runtime.js');window.rig=new WispRigRuntime();await rig.load();});
   assert(await page.evaluate(()=>rig.ready),'Real painted Pixi rig initializes before optional direction pack completes');
   for(let i=0;i<100&&!pending;i++)await new Promise(r=>setTimeout(r,10));assert(pending,'Expected delayed optional '+delayed);
   await page.evaluate(action=>action==='pagehide'?dispatchEvent(new Event('pagehide')):rig.destroy(),delayed);
   await page.evaluate(()=>rig.directionTask);
   if(delayed==='pagehide'){assert(await page.evaluate(()=>rig.ready&&!rig.disposed&&!rig.directionFrames&&!rig.directionError),'Pagehide cancels optional request while retaining original front painting for page restoration');await page.evaluate(()=>rig.destroy());}
   assert.deepEqual(await page.evaluate(()=>({ready:rig.ready,disposed:rig.disposed,directionError:rig.directionError||null,views:rig.directionFrames?.length||0})),{ready:false,disposed:true,directionError:null,views:0});
   const before=requests;await page.evaluate(async()=>{rig.destroy();await rig.load();await rig.loadDirections('/assets/wisp-v2/');});
   assert.equal(requests,before,'Disposed rig cannot restart optional artwork requests');
   await pending.abort().catch(()=>{});assert.deepEqual(errors,[]);
   results.push({delayed,actualGpuRig:true,cancelled:true,noLateDirections:true,noRestart:true,noUnhandledErrors:true});await context.close();
  }
  fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/rig-direction-lifecycle-'+engine+'.json',JSON.stringify({passed:true,results,scope:'Actual Pixi/WebGL painting setup, deliberately delayed optional direction manifest/image, explicit destroy cancellation and no restart. Not visual motion/face acceptance or physical projection.'},null,2));
  console.log('PASS '+engine+' real painted rig cancels optional direction manifest/image on destroy, without late resources or restart.');
 }finally{await browser.close();await fixture.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
