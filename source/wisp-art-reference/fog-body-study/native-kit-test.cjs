const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const{chromium,webkit}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
(async()=>{
 const browser=await(process.env.HAUNT_BROWSER==='webkit'?webkit:chromium).launch();const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const out=path.resolve(__dirname,'../../../../wisp-live-rig-proof/fog-native-kit-study-'+(process.env.HAUNT_BROWSER||'chromium'));fs.mkdirSync(out,{recursive:true});
 try{
  await page.goto((process.env.HAUNT_TEST_BASE||'http://127.0.0.1:8770')+'/assets/wisp-performance/');
  const result=await page.evaluate(async()=>{
   const {WispPerformanceRuntime}=await import('/assets/wisp-performance-runtime.js');
   const {DIGITS}=await import('/assets/wisp-performance/digit-skin.js');const original=JSON.stringify(DIGITS);
   const {createFogStudyKit}=await import('/source/wisp-art-reference/fog-body-study/native-kit.mjs');
   const kit=await createFogStudyKit(),pilot=await new WispPerformanceRuntime({frontKit:kit}).load();
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
  });
  assert.equal(result.nativeMotion.corrective.unresolvedCalls,0);assert.equal(result.pilotKit,'fog-cute-study');assert.equal(result.defaultKit,'painted-original');assert.equal(result.digitsUnchanged,true);assert.equal(result.defaultHandScale,1.2);assert.equal(errors.length,0);
  await page.screenshot({path:path.join(out,'native-cute.png')});
  await page.evaluate(()=>window.__nativePilot.dispose());
  fs.writeFileSync(path.join(out,'review.json'),JSON.stringify({...result,errors,scope:'Direct native kit loader, no browser routes or source substitutions; cute only; not physical projection/voice acceptance'},null,2));
  console.log('PASS direct kit loading, independent default rig, unchanged shared digit metadata, disposal; no request substitution');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
