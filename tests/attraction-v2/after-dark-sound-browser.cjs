// Actual AAC decode/Web Audio/native films. Test-only output tap silences hardware, retaining the real mixed signal for analysis/recording.
const assert=require('node:assert/strict'),fs=require('node:fs'),pw=require('playwright');process.env.HAUNT_TONIGHT_ROOT='.';
(async()=>{
 const fixture=await require('../tonight_fixture.cjs').start(),engine=process.env.HAUNT_BROWSER||'chromium',full=process.env.HAUNT_CYCLE==='1',browser=await pw[engine].launch(),context=await browser.newContext(),page=await context.newPage(),errors=[],requests=[];
 const folder=`work/yard-audio/${engine}`;fs.mkdirSync(folder,{recursive:true});
 await context.addInitScript(()=>{
  window.__contexts=[];const Native=window.AudioContext;
  window.AudioContext=class extends Native{
   constructor(...args){super(...args);this.__bus=this.createGain();const silent=this.createGain();silent.gain.value=0;this.__bus.connect(silent);silent.connect(super.destination);this.__analyser=this.createAnalyser();this.__bus.connect(this.__analyser);this.__record=this.createMediaStreamDestination();this.__bus.connect(this.__record);window.__contexts.push(this);}
   get destination(){return this.__bus||super.destination;}
  };
  navigator.mediaDevices.getUserMedia=()=>{throw Error('No capture permitted');};
 });
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/'))requests.push(r.url());});
 const state=()=>page.evaluate(()=>WispAfterDark.inspect());
 const report={engine,scope:'native AAC and Web Audio with test-only silent hardware bus, real native/raster browser animation; no physical projection or human listening approval',fullCycle:full,errors,requests};
 try{
  await page.goto(fixture.base+'/source/attraction-v2/console/haunt-loops.html');await page.waitForFunction(()=>window.WispAfterDark);assert.equal(await page.evaluate(()=>__contexts.length),0);
  if(full)await page.locator('#cycle').check();else await page.locator('[data-program=spider]').click();
  await page.locator('#start').click();await page.waitForFunction(()=>WispAfterDark.inspect().running);await page.locator('#sound').click();await page.waitForFunction(()=>WispAfterDark.inspect().sound.enabled);
  const outPromise=page.waitForEvent('popup');await page.locator('#projector').click();const output=await outPromise;await output.waitForLoadState();assert.equal(await output.evaluate(()=>__contexts.length),0);assert(await output.evaluate(()=>WispFilmOutput.inspect().silent));
  await page.evaluate(()=>{
   window.__audioAudit={peak:0,samples:0,maxActive:0,quietPeaks:[],events:0};
   const context=__contexts[0],data=new Float32Array(context.__analyser.fftSize);
   window.__audioTimer=setInterval(()=>{const s=WispAfterDark.inspect();context.__analyser.getFloatTimeDomainData(data);const peak=Math.max(...data.map(Math.abs));__audioAudit.peak=Math.max(__audioAudit.peak,peak);__audioAudit.samples++;__audioAudit.maxActive=Math.max(__audioAudit.maxActive,s.sound.active);__audioAudit.events=s.sound.played;if(s.nightWatch.emptyHold)__audioAudit.quietPeaks.push(peak);},50);
  });
  if(full&&engine==='chromium')await page.evaluate(()=>{const canvas=document.getElementById('stage'),stream=canvas.captureStream(30);stream.addTrack(__contexts[0].__record.stream.getAudioTracks()[0]);window.__chunks=[];window.__movie=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9,opus'});__movie.ondataavailable=e=>{if(e.data.size)__chunks.push(e.data);};__movie.start(1000);});
  if(full){await page.waitForFunction(()=>WispAfterDark.inspect().nightWatch.changes>=3,null,{timeout:155000});assert((await state()).sound.enabled);assert((await state()).sound.played>=9);}
  else{await page.waitForFunction(()=>WispAfterDark.inspect().sound.played>=3,null,{timeout:24000});await page.locator('[data-program=eyes]').click();await page.waitForFunction(()=>WispAfterDark.inspect().program==='eyes'&&WispAfterDark.inspect().running);assert((await state()).sound.enabled);}
  report.audio=await page.evaluate(()=>__audioAudit);assert(report.audio.peak>.01);assert(report.audio.peak<.7);assert(report.audio.maxActive<=3);if(full){assert(report.audio.quietPeaks.length>30);assert(report.audio.quietPeaks.every(p=>p<.0001));}
  if(full&&engine==='chromium'){
   const data=await page.evaluate(()=>new Promise(resolve=>{__movie.onstop=()=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(__chunks,{type:'video/webm'}));};__movie.stop();}));fs.writeFileSync(folder+'/night-watch-dry-effects.webm',Buffer.from(data,'base64'));
  }
  await page.locator('#sound-level').fill('80');assert.equal((await state()).sound.volume,.8);
  await page.locator('#stop').click();await page.waitForTimeout(150);assert(!(await state()).sound.enabled);assert.equal((await state()).sound.active,0);
  // A suspended analyser retains its final history; it is not live output.
  await page.waitForFunction(()=>__contexts[0].state==='suspended');
  report.stopEvidence='AudioContext suspended and all scheduled source nodes disconnected; frozen analyser history is not interpreted as playing audio.';
  await page.locator('#start').click();await page.waitForFunction(()=>WispAfterDark.inspect().running);assert(!(await state()).sound.enabled,'Stop requires a new explicit sound gesture');
  await page.locator('#sound').click();await page.waitForFunction(()=>WispAfterDark.inspect().sound.enabled);await page.locator('#sound').click();assert(!(await state()).sound.enabled);assert((await state()).running,'Turning off effects must not stop the picture');
  for(const width of [390,320]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});report.violations=await page.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa']}})).violations.map(v=>v.id));assert.deepEqual(report.violations,[]);
  await page.locator('#stop').click();await page.evaluate(()=>dispatchEvent(new Event('pagehide')));await page.waitForFunction(()=>__contexts[0].state==='closed');assert((await state()).sound.disposed);assert(!(await state()).sound.decoded);
  // Corrupted optional audio never stops the three visual scenes.
  await page.route('**/dry-air-palette.mp4',r=>r.fulfill({body:'corrupted',contentType:'audio/mp4'}));await page.reload();await page.locator('#start').click();await page.waitForFunction(()=>WispAfterDark.inspect().running);await page.locator('#sound').click();await page.waitForFunction(()=>!!WispAfterDark.inspect().sound.error);assert((await state()).running);assert(!(await state()).sound.enabled);assert.equal((await state()).sound.active,0);
  await page.unroute('**/dry-air-palette.mp4');await page.reload();await page.locator('#start').click();await page.waitForFunction(()=>WispAfterDark.inspect().running);
  let release,seen;const gate=new Promise(r=>release=r),requested=new Promise(r=>seen=r);await page.route('**/dry-air-palette.mp4',async route=>{seen();await gate;await route.continue().catch(()=>{});});
  await page.locator('#sound').click();await requested;await page.locator('#stop').click();release();await page.waitForTimeout(500);assert(!(await state()).sound.enabled);assert(!(await state()).sound.loading);assert.equal((await state()).sound.active,0);
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);report.result='passed';report.tests=['default silent/no AudioContext','actual decoded palette and audible-signal analysis','bounded sources','silent projector','stop/no tails','restart stays silent','optional sound independent of picture','mobile layout/axe','context disposal','corrupt audio fallback','Stop during delayed asset'];fs.writeFileSync(folder+'/report.json',JSON.stringify(report,null,2));console.log('PASS '+engine+' actual dry effects, motion timing, silent outputs, cancellation, resource cleanup and layout.');
 }catch(error){report.result='failed';report.failure=String(error);fs.writeFileSync(folder+'/report.json',JSON.stringify(report,null,2));await page.screenshot({path:folder+'/failure.png'});throw error;}
 finally{await browser.close();await fixture.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
