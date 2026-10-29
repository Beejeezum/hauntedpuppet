const assert=require('node:assert/strict'),fs=require('node:fs'),pw=require('playwright');
process.env.HAUNT_TONIGHT_ROOT='dist';
(async()=>{const fixture=await require('./tonight_fixture.cjs').start(),engine=process.env.HAUNT_BROWSER||'chromium',browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(fixture.base+'/assets/wisp-showdesk/index.html?rehearsal=expanded');await page.waitForFunction(()=>window.WispDesk);
  const checkBank=async()=>{
   assert.equal(await page.locator('main').getAttribute('data-cue-layout'),'console');assert.equal(await page.locator('main>aside>.stage-panel').count(),1);
   const bounds=await page.locator('#cues>button').evaluateAll(a=>a.map(b=>{const r=b.getBoundingClientRect();return{title:b.textContent,top:r.top,bottom:r.bottom,left:r.left,right:r.right};}));
   assert.equal(bounds.length,24);assert(bounds.every(b=>b.top>=0&&b.bottom<=768&&b.left>=0&&b.right<=1366),'All24 pads must fit a1366x768 laptop viewport: '+JSON.stringify(bounds));
  };
  await checkBank();await page.evaluate(()=>window.__sameStage=document.getElementById('stage'));
  await page.locator('#cues [data-cue=cute]').click();await page.waitForFunction(()=>WispDesk.inspect().director.phase==='playing');
  const before=await page.evaluate(()=>document.querySelector('#mediaSources video[data-cue=cute]').currentTime);
  fs.mkdirSync('work/cue-console',{recursive:true});await page.screenshot({path:'work/cue-console/'+engine+'-desktop.png'});
  await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>document.querySelector('main').dataset.cueLayout==='stacked');
  assert.equal(await page.locator('.primary>.stage-panel').count(),1);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.waitForTimeout(300);assert(await page.evaluate(t=>document.querySelector('#mediaSources video[data-cue=cute]').currentTime>t,before),'Responsive layout cannot restart/freeze native motion');
  assert(await page.evaluate(()=>document.getElementById('stage')===__sameStage));await page.screenshot({path:'work/cue-console/'+engine+'-mobile.png'});
  await page.setViewportSize({width:1366,height:768});await page.waitForFunction(()=>document.querySelector('main').dataset.cueLayout==='console');await page.evaluate(()=>scrollTo(0,0));await checkBank();
  const popup=page.waitForEvent('popup');await page.getByRole('button',{name:'Projector output',exact:true}).click();const output=await popup;await output.waitForFunction(()=>window.WispFilmOutput);assert(await output.evaluate(()=>WispFilmOutput.inspect().silent));assert.equal(await output.locator('audio,video').count(),0);
  await page.getByRole('button',{name:'■ Blackout',exact:true}).click();assert(await page.evaluate(()=>WispDesk.inspect().composition.black&&WispDesk.inspect().media.every(v=>v.paused&&v.muted)));
  await page.evaluate(()=>dispatchEvent(new Event('pagehide')));await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);assert.equal(await page.locator('main>aside>.stage-panel').count(),1,'Disposed layout listener must not move the stage again');assert.equal(await page.locator('video').count(),0);assert.deepEqual(errors,[]);
  fs.writeFileSync('test-results/cue-console-layout-'+engine+'.json',JSON.stringify({passed:true,viewport:[1366,768],pads:24,bankAboveFold:true,sameCanvasOnResize:true,nativeMotionContinues:true,phoneNoOverflow:true,silentProjector:true,blackoutAndDisposal:true,scope:'Real native-film browser layout/resizing and silent output. No human usability/physical-device/projector approval.'},null,2));
  console.log('PASS '+engine+'24 visible laptop pads, side preview, same live canvas across mobile resize, silence and cleanup');
 }finally{await browser.close();await fixture.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
