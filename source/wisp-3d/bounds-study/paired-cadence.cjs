const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const headed=process.env.HAUNT_HEADED==='1',balanced=process.env.HAUNT_BALANCED==='1';
 const browser=await chromium.launch({headless:!headed,args:['--mute-audio']}),results=[];
 try{
  for(const fast of(balanced?[false,true,true,false]:[false,true])){
   const context=await browser.newContext({viewport:{width:1280,height:720}}),errors=[];
   context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
   if(!fast)await context.route('**/assets/wisp-3d-runtime.js',async route=>{
    const response=await route.fetch(),source=await response.text(),needle='this.envelopeBounds.update(this.worldBounds);';
    if(!source.includes(needle))throw Error('Exact comparison patch did not match runtime');
    await route.fulfill({response,body:source.replace(needle,'this.worldBounds.setFromObject(this.root,true);')});
   });
   const operator=await context.newPage(),base=process.env.HAUNT_TEST_BASE||'http://127.0.0.1:8812';
   await operator.goto(base);await operator.waitForFunction(()=>window.HauntWisp?.inspect().ready);
   await operator.click('#try3DWisp');await operator.waitForFunction(()=>window.HauntStage3D?.inspect().frames>3);
   const popup=context.waitForEvent('page');await operator.click('#open');const projector=await popup;
   await projector.waitForLoadState('domcontentloaded');await projector.waitForFunction(()=>window.HauntStage3D?.inspect().frames>3);
   if(balanced||headed)await operator.waitForTimeout(4000);
   await operator.evaluate(()=>HauntForms.perform('dance'));
   const samples=await Promise.all([operator,projector].map(page=>page.evaluate(async()=>{
    const start=performance.now(),initial=HauntStage3D.inspect().frames;
    await new Promise(resolve=>setTimeout(resolve,8000));
    const elapsed=performance.now()-start,current=HauntStage3D.inspect();
    return{elapsedMs:elapsed,frames:current.frames-initial,observedFramesPerSecond:(current.frames-initial)*1000/elapsed,audioState:HauntWisp.inspect().audioState,ready:current.ready,inside:current.bounds.inside,softwareRenderer:current.softwareRenderer,renderScale:current.renderScale};
   })));
   const driver=await operator.evaluate(()=>{
    const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2'),extension=gl?.getExtension('WEBGL_debug_renderer_info');
    const name=extension?gl.getParameter(extension.UNMASKED_RENDERER_WEBGL):'unavailable';
    gl?.getExtension('WEBGL_lose_context')?.loseContext();return name;
   });
   results.push({mode:fast?'envelope':'exact baseline override',driver,operator:samples[0],projector:samples[1],errors});
   await context.close();
  }
  const report={headed,balanced,results,scope:'Actual operator UI popout; driver recorded; local browser playback with baseline software soak active; no microphone/provider or physical projection acceptance'};
  fs.writeFileSync(path.join(process.env.HAUNT_PROOF_DIR||path.resolve('../wisp-live-rig-proof'),`bounds-v4-${headed?'native-':''}paired-${balanced?'balanced':'cadence'}.json`),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  if(results.some(r=>r.errors.length||r.operator.audioState!=='not-created'||r.projector.audioState!=='not-created'))throw Error('Paired playback errors/audio ownership failure');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
