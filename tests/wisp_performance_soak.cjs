const{chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const seconds=Math.max(15,Number(process.env.HAUNT_SOAK_SECONDS)||180),base=process.env.HAUNT_TEST_BASE||'http://127.0.0.1:8770';
 const browser=await chromium.launch({args:['--mute-audio']}),context=await browser.newContext(),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/assets/wisp-performance-studio.html');await page.waitForFunction(()=>window.WispPerformanceStudio?.inspect().frames>3);
  await page.evaluate(()=>{const r=WispPerformanceStudio.rig;window.soakReference={root:r.root,face:r.faceTexture,meshes:[...r.meshes],front:r.frontRig,body:r.frontRig?.body,bodyGeometry:r.frontRig?.body.geometry,times:[],last:performance.now()};function tick(t){soakReference.times.push(t-soakReference.last);soakReference.last=t;requestAnimationFrame(tick);}requestAnimationFrame(tick);WispPerformanceStudio.play();window.soakTimer=setInterval(()=>WispPerformanceStudio.play(),15000);});
  const start=await page.evaluate(()=>WispPerformanceStudio.inspect().frames),wallStart=Date.now();
  for(let elapsed=0;elapsed<seconds;elapsed+=10){await page.waitForTimeout(Math.min(10,seconds-elapsed)*1000);const state=await page.evaluate(()=>WispPerformanceStudio.inspect());assert(state.ready&&state.bounds.inside);assert.equal(state.bones,12);assert.equal(state.meshes,20);assert.deepEqual(errors,[]);}
  const result=await page.evaluate(({start,wall})=>{const r=WispPerformanceStudio.rig,s=WispPerformanceStudio.inspect(),ref=soakReference,times=ref.times.slice(10).sort((a,b)=>a-b);clearInterval(soakTimer);return{seconds:wall,frames:s.frames-start,fps:(s.frames-start)/wall,medianFrameMs:times[Math.floor(times.length*.5)],p95FrameMs:times[Math.floor(times.length*.95)],stableResources:r.root===ref.root&&r.faceTexture===ref.face&&r.meshes.every((m,i)=>m===ref.meshes[i]),meshCount:r.meshes.length,rootChildren:r.root.children.length,layered:!!r.frontRig?.ready,stableLayered:r.frontRig===ref.front&&r.frontRig?.body===ref.body&&r.frontRig?.body.geometry===ref.bodyGeometry,renderer:s.renderer,scope:'Silent isolated browser render soak; synthetic mouth; no physical projection or genuine provider audio'};},{start,wall:(Date.now()-wallStart)/1000});
  assert(result.stableResources);assert.equal(result.rootChildren,result.layered?22:21);assert(result.stableLayered);assert(result.frames>seconds*8,'Unexpectedly low render cadence');
  await page.click('#stop');await page.waitForFunction(()=>WispPerformanceStudio.inspect().mouth==='rest');
  fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/wisp-performance-soak.json',JSON.stringify(result,null,2));console.log('PASS painted performance soak',JSON.stringify(result));
 }finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
