// Native scenes with one explicit synthetic decoder failure; no providers or capture.
const assert=require('node:assert/strict'),fs=require('node:fs'),pw=require('playwright');
process.env.HAUNT_TONIGHT_ROOT='.';
(async()=>{
 const fixture=await require('../tonight_fixture.cjs').start(),engine=process.env.HAUNT_BROWSER||'chromium',browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{}),page=await browser.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const deadline=require('./browser-deadline.cjs').browserDeadline({folder:'work/yard-operator/'+engine+'-recovery',label:engine+' decoder recovery'});
 const base=fixture.base+'/source/attraction-v2/console/';
 async function faultFirstGhost(){deadline.phase('synthetic decoder failure and recovery');
  await page.goto(base+'haunt-loops.html');await page.waitForFunction(()=>window.WispAfterDark);
  await page.evaluate(async()=>{
   const {NightWatch}=await import('./night-watch.mjs'),start=NightWatch.prototype.start;
   // Put Wisp first only in this fault test; normal-order full cycles have a separate test.
   NightWatch.prototype.start=function(available){start.call(this,available);if(this.order.includes('apparitions'))this.order=['apparitions',...this.order.filter(x=>x!=='apparitions')];return this.order[0];};
   document.querySelector('#film').play=()=>Promise.reject(new DOMException('Synthetic decoder unavailable','NotSupportedError'));
  });
  await page.locator('#cycle').check();await page.locator('#start').click();
  await page.waitForFunction(()=>WispAfterDark.inspect().recovering);
 }
 try{
  await faultFirstGhost();const state=await page.evaluate(()=>WispAfterDark.inspect());
  assert.deepEqual(state.available,{eyes:true,spider:true,apparitions:false});assert(!state.running);assert(await page.locator('[data-program=apparitions]').isDisabled());
  const popup=page.waitForEvent('popup');await page.locator('#projector').click();const output=await popup;await output.waitForFunction(()=>window.WispFilmOutput);
  await page.waitForTimeout(1000);assert(await page.evaluate(()=>WispAfterDark.inspect().recovering));
  assert.equal(await page.locator('#stage').evaluate(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let peak=0;for(let i=0;i<d.length;i+=4)peak=Math.max(peak,d[i],d[i+1],d[i+2]);return peak;}),0);
  await page.waitForFunction(()=>{const s=WispAfterDark.inspect();return s.running&&s.nightWatch.running&&s.program==='eyes'&&s.eyes.slots.some(x=>x.plays>0);},null,{timeout:10000});
  assert.equal(await output.locator('video,audio').count(),0);assert(await output.evaluate(()=>WispFilmOutput.inspect().silent));
  await page.bringToFront();await page.locator('[data-program=spider]').click();await page.waitForFunction(()=>WispAfterDark.inspect().spider.frames>20);assert(!(await page.evaluate(()=>WispAfterDark.inspect().nightWatch.running)));await page.locator('#stop').click();
  await faultFirstGhost();await page.locator('#stop').click();await page.waitForTimeout(5500);assert(!(await page.evaluate(()=>WispAfterDark.inspect().running||WispAfterDark.inspect().recovering)));
  await faultFirstGhost();await page.locator('[data-program=spider]').click();await page.waitForTimeout(5500);assert(!(await page.evaluate(()=>WispAfterDark.inspect().running||WispAfterDark.inspect().recovering)));assert.equal(await page.evaluate(()=>WispAfterDark.inspect().program),'spider');
  await page.locator('#start').click();await page.waitForFunction(()=>WispAfterDark.inspect().spider.frames>20);await page.locator('#stop').click();
  await page.goto(base+'haunt-loops.html');await page.waitForFunction(()=>window.WispAfterDark);await page.locator('[data-program=apparitions]').click();await page.locator('#start').click();await page.waitForFunction(()=>WispAfterDark.inspect().player.time>1);
  deadline.phase('native pause and recovery');await page.locator('#film').evaluate(v=>v.pause());await page.waitForFunction(()=>!WispAfterDark.inspect().available.apparitions,null,{timeout:6000});assert(!(await page.evaluate(()=>WispAfterDark.inspect().running)));assert.match(await page.locator('#loop-status').innerText(),/other scenes are ready/);
  await page.route('**/media/eyes-watch.mp4',r=>r.fulfill({contentType:'video/mp4',body:'synthetic broken eyes'}));await page.route('**/media/spider-rig-sheet-v1.png',r=>r.fulfill({contentType:'image/png',body:'synthetic broken spider'}));
  await page.goto(base+'haunt-loops.html');await page.waitForFunction(()=>window.WispAfterDark);await page.locator('#film').evaluate(v=>v.play=()=>Promise.reject(new Error('Synthetic last decoder failure')));await page.locator('#start').click();await page.waitForFunction(()=>!WispAfterDark.inspect().available.apparitions);assert(await page.locator('#start').isDisabled());assert(await page.locator('#cycle').isDisabled());assert(!(await page.evaluate(()=>WispAfterDark.inspect().recovering)));assert.match(await page.locator('#loop-status').innerText(),/No scene is available/);
  assert.deepEqual(errors,[]);fs.mkdirSync('work/yard-operator',{recursive:true});fs.writeFileSync('work/yard-operator/'+engine+'-decoder-recovery.json',JSON.stringify({engine,scope:'Native films/eyes/spider with synthetic play rejection and test-only first-scene ordering; not a repair of the Linux decoder',ghostDisabled:true,nativeStallIsolation:true,blackHold:true,remainingNightWatch:true,manualTakeover:true,stopCancelsRecovery:true,allUnavailableStops:true,silentProjector:true,errors},null,2));console.log('PASS '+engine+' failed-ghost isolation, dark recovery, manual takeover, Stop and silent projector');
 }finally{deadline.phase('closing browser and fixture');await browser.close();await fixture.close();deadline.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
