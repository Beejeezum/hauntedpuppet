const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const http=require('node:http');
const{chromium,webkit}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
const bodyMorph=process.argv.includes('--body-morph');
(async()=>{
 const browser=await(process.env.HAUNT_BROWSER==='webkit'?webkit:chromium).launch();const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const out=path.resolve(__dirname,'../../../../wisp-live-rig-proof/fog-native-kit-study-'+(process.env.HAUNT_BROWSER||'chromium')+(bodyMorph?'-morph':''));fs.mkdirSync(out,{recursive:true});
 // Test-owned loopback fixture: production server intentionally rejects source/.
 const root=path.resolve(__dirname,'../../..'),types={'.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.png':'image/png','.webp':'image/webp'};
 const fixture=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://127.0.0.1').pathname;
  if(pathname==='/native-kit-fixture'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><body style="margin:0;background:black">');}
  let target;try{target=path.resolve(root,'.'+decodeURIComponent(pathname));}catch{res.statusCode=404;return res.end();}
  const allowed=target.startsWith(root+path.sep+'assets'+path.sep)||target.startsWith(__dirname+path.sep);
  if(!allowed||!types[path.extname(target)]||!fs.existsSync(target)||!fs.statSync(target).isFile()){res.statusCode=404;return res.end();}
  res.setHeader('Content-Type',types[path.extname(target)]);fs.createReadStream(target).pipe(res);
 });
 await new Promise(resolve=>fixture.listen(0,'127.0.0.1',resolve));
 const fixtureBase='http://127.0.0.1:'+fixture.address().port;

 try{
  for(const file of ['/server.py','/.env','/source/wisp-art-reference/fog-body-study/native-kit-test.cjs'])assert.equal((await fetch(fixtureBase+file)).status,404,'Fixture exposed a private/unsupported file');
  await page.goto(fixtureBase+'/native-kit-fixture');
  const result=await page.evaluate(async bodyMorph=>{
   const {WispPerformanceRuntime}=await import('/assets/wisp-performance-runtime.js');
   const {DIGITS}=await import('/assets/wisp-performance/digit-skin.js');const original=JSON.stringify(DIGITS);
   const {createFogStudyKit}=await import('/source/wisp-art-reference/fog-body-study/native-kit.mjs');
   const kit=await createFogStudyKit();if(bodyMorph){const {createNativeBodyMorph}=await import('/source/wisp-art-reference/fog-body-study/front-form-morph.mjs');kit.createBodyViews=createNativeBodyMorph;kit.eyeMaterial=t=>{const u=Math.max(0,Math.min(1,(t-.4)/.6));return u*u*(3-2*u);};}const pilot=await new WispPerformanceRuntime({frontKit:kit}).load();
   if(!pilot.ready||!pilot.frontRig?.ready)throw Error(pilot.error||pilot.frontError||'Native kit failed');
   const frames=[];for(const clock of [0,2,5]){pilot.render({clock,freeze:true,allowEvil:false});frames.push(pilot.frontRig.inspect());}
   const {performanceFrame}=await import('/assets/wisp-performance/reel.js');
   const corrective=await import('/source/wisp-art-reference/fog-body-study/area-corrective.mjs');corrective.resetCorrectiveMetrics();
   let nativeFrames=0;for(let i=0;i<=672;i++){const f=performanceFrame(i/60);pilot.render({...f.params,allowEvil:false},0);nativeFrames++;}
   const nativeMotion={frames:nativeFrames,corrective:{...corrective.correctiveTotals},scope:'deterministic native-renderer cute sequence; synthetic mouth; not RAF cadence or voice'};
   // Load default after the candidate: per-kit metadata must not leak into it.
   const fallback=await new WispPerformanceRuntime().load();if(!fallback.frontRig?.ready)throw Error(fallback.frontError||'Default failed');
   fallback.render({clock:2,freeze:true});
   const result={nativeMotion,pilotReady:pilot.ready,pilotKit:pilot.frontRig.inspect().kitId,defaultKit:fallback.frontRig.inspect().kitId,digitsUnchanged:original===JSON.stringify(DIGITS),defaultHandScale:fallback.frontRig.inspect().arms.left.handScale,frames};
   document.body.replaceChildren(pilot.canvas);window.__nativePilot=pilot;fallback.dispose();pilot.render({clock:3,freeze:true,allowEvil:false});return result;
  },bodyMorph);
  assert.equal(result.nativeMotion.corrective.unresolvedCalls,0);assert.equal(result.pilotKit,'fog-cute-study');assert.equal(result.defaultKit,'painted-original');assert.equal(result.digitsUnchanged,true);assert.equal(result.defaultHandScale,1.2);assert.equal(errors.length,0);
  await page.screenshot({path:path.join(out,'native-cute.png')});
  if(bodyMorph){result.formSamples=[];for(const value of [0,.25,.5,.75,1,.75,.5,.25,0]){const state=await page.evaluate(value=>{__nativePilot.render({clock:12,dt:1/60,freeze:true,action:{kind:'wave',at:1.6},state:'speaking',weights:{A:1},jaw:1,mood:'angry'},value);return __nativePilot.inspect();},value);assert.equal(state.faceRig.blend,value);assert(state.frontRig.viewAngle<1);result.formSamples.push({value,face:state.faceRig,bounds:state.bounds});if([0,.5,1].includes(value))await page.screenshot({path:path.join(out,'native-form-'+value+'.png')});}}

  await page.evaluate(()=>window.__nativePilot.dispose());
  fs.writeFileSync(path.join(out,'review.json'),JSON.stringify({...result,errors,scope:bodyMorph?'Native front body/face morph pilot with inherited incompatible evil arms; raw component canvas, not protected projection; no art/voice/physical acceptance':'Direct native kit loader, no browser routes or source substitutions; cute only; not physical projection/voice acceptance'},null,2));
  console.log('PASS direct kit loading, independent default rig, unchanged shared digit metadata, disposal; no request substitution');
 }finally{await browser.close();await new Promise(resolve=>fixture.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1});
