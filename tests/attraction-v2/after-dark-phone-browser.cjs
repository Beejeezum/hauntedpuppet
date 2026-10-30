// Real loopback pairing/lease/commands, shipped raster/native art. No LAN, paid API, microphone or physical phone.
const assert=require('node:assert/strict'),fs=require('node:fs'),{spawn}=require('node:child_process'),pw=require('playwright');
(async()=>{
 const fixture=spawn('python3',['tests/attraction-v2/yard-phone-fixture.py'],{stdio:['ignore','pipe','pipe']});let err='';fixture.stderr.on('data',x=>err+=x);
 const base=await new Promise((resolve,reject)=>{let raw='';fixture.stdout.on('data',x=>{raw+=x;try{resolve(JSON.parse(raw.trim()).base);}catch{}});fixture.on('exit',()=>reject(Error(err)));});
 const engine=process.env.HAUNT_BROWSER||'chromium',browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{});
 const laptop=await browser.newPage({viewport:{width:1280,height:900}}),mobile=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 for(const page of [laptop,mobile]){page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{window.__audioContexts=0;window.__captures=0;const Native=window.AudioContext;window.AudioContext=class extends Native{constructor(...args){super(...args);window.__audioContexts++;}};navigator.mediaDevices.getUserMedia=()=>{window.__captures++;throw Error('Silent scene must not capture');};});}
 const state=()=>laptop.evaluate(()=>WispAfterDark.inspect()),waitAck=()=>mobile.waitForFunction(()=>document.querySelector('#actionStatus').textContent==='Applied on the laptop.',null,{timeout:30000});
 const cue=async name=>{await mobile.locator(`[data-command=cue][data-value="${name}"]`).click();await waitAck();};
 const closeDialogs=()=>laptop.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(x=>x.close()));
 fs.mkdirSync('work/yard-operator',{recursive:true});
 try{
  await laptop.goto(base+'/source/attraction-v2/console/haunt-loops.html');await laptop.waitForFunction(()=>window.WispAfterDark);
  await laptop.locator('#phone-open').click();await laptop.locator('#phoneEnable').click();await laptop.waitForFunction(()=>/^\d{6}$/.test(document.querySelector('#phoneCode').textContent));
  const url=await laptop.locator('#phoneUrl').getAttribute('href'),code=await laptop.locator('#phoneCode').textContent();assert.match(url,/^http:\/\/127\.0\.0\.1:\d+\/$/);
  await mobile.goto(url);await mobile.locator('#code').fill(code);await mobile.getByRole('button',{name:'Pair phone',exact:true}).click();
  await mobile.waitForFunction(()=>document.body.dataset.program==='after-dark'&&document.body.dataset.connected==='true');
  assert.equal(await mobile.locator('#cueHeading').innerText(),'After-dark scenes');assert.equal(await mobile.locator('#cues button').count(),4);
  assert.equal(await mobile.locator('#directorPanel').isVisible(),false);assert.equal(await mobile.locator('#phoneWelcome').isVisible(),false);assert.equal(await mobile.locator('[data-live-only]:visible').count(),0);
  await cue('Spider-on-Silk');await laptop.waitForFunction(()=>WispAfterDark.inspect().spider.phase!=='empty'&&WispAfterDark.inspect().spider.frames>20);
  assert.equal((await state()).program,'spider');assert((await state()).running);
  await closeDialogs();const pp=laptop.waitForEvent('popup');await laptop.locator('#projector').click();const popup=await pp;await popup.waitForLoadState();assert(await popup.evaluate(()=>WispFilmOutput.inspect().silent));assert.equal(await popup.locator('video,audio').count(),0);
  await cue('Quiet-Apparitions');await laptop.waitForFunction(()=>WispAfterDark.inspect().player.time>.6);assert.equal((await state()).player.form,'scary');
  await cue('Night-Watch');assert((await state()).nightWatch.running);assert.equal((await state()).program,'eyes');
  await cue('Spider-on-Silk');assert(!(await state()).nightWatch.running);
  // A second phone command must not wait for the current 700ms scene transition.
  await mobile.locator('[data-command=cue][data-value="Quiet-Apparitions"]').click();await laptop.waitForFunction(()=>document.querySelector('#loop-status').textContent.includes('clear'));
  await mobile.getByRole('button',{name:'Stop All',exact:true}).click();await waitAck();await laptop.waitForTimeout(1100);assert(!(await state()).running);assert(!(await state()).loading);
  assert.equal(await popup.evaluate(()=>Math.max(...document.querySelector('canvas').getContext('2d').getImageData(640,360,1,1).data)),0);
  await cue('Watching-Eyes');await mobile.locator('#blackout').click();await waitAck();assert(!(await state()).running);
  for(const width of [390,320]){await mobile.setViewportSize({width,height:844});assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await mobile.route('**/qa-axe.js',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8')}));await mobile.addScriptTag({url:new URL('qa-axe.js',url).href});
  const axe=await mobile.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa']}})).violations);assert.deepEqual(axe.map(v=>v.id),[]);
  await mobile.screenshot({path:`work/yard-operator/${engine}-after-dark-phone.png`,fullPage:true});
  await laptop.locator('#phone-open').click();await laptop.setViewportSize({width:320,height:844});assert(await laptop.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await laptop.screenshot({path:`work/yard-operator/${engine}-after-dark-pairing.png`,fullPage:true});await closeDialogs();
  // Navigating back uses an explicit ownership handoff; the paired phone session survives.
  await laptop.goto(base+'/source/attraction-v2/console/');await laptop.waitForFunction(()=>window.WispYardScene&&window.HauntPhone);await laptop.waitForTimeout(5500);
  await laptop.locator('#connection').click();await laptop.locator('#phone-open').click();await laptop.locator('#phoneEnable').click();
  await mobile.waitForFunction(()=>document.body.dataset.workspace==='yard'&&document.querySelector('#cueHeading').textContent==='Yard controls');
  assert.equal(await mobile.locator('#pairPanel').isVisible(),false);await cue('Start-Show');await laptop.waitForFunction(()=>WispYardScene.inspect().playback.running);
  await mobile.getByRole('button',{name:'Stop All',exact:true}).click();await waitAck();
  // Return to After dark with the same paired phone; stale yard actions disappear.
  await laptop.goto(base+'/source/attraction-v2/console/haunt-loops.html');await laptop.waitForFunction(()=>window.WispAfterDark);await laptop.waitForTimeout(5500);
  await laptop.locator('#phone-open').click();await laptop.locator('#phoneEnable').click();await mobile.waitForFunction(()=>document.body.dataset.program==='after-dark');assert.equal(await mobile.locator('#cues button').count(),4);
  await cue('Night-Watch');assert((await state()).nightWatch.running);await mobile.locator('#blackout').click();await waitAck();
  await laptop.locator('#phoneDisable').click();await laptop.waitForFunction(()=>!HauntPhone.inspect().enabled);
  assert.deepEqual(errors,[]);assert.equal((await fetch(base+'/test/metrics').then(r=>r.json())).providerRequests,0);
  for(const page of [laptop,mobile]){assert.equal(await page.evaluate(()=>window.__audioContexts),0);assert.equal(await page.evaluate(()=>window.__captures),0);}
  fs.writeFileSync(`work/yard-operator/${engine}-after-dark-phone.json`,JSON.stringify({engine,scope:'real isolated loopback phone transport and native/raster browser render; no LAN/physical phone/projector/provider',errors,providerRequests:0,tests:['four available cues','start from black','silent popup','native ghost','Night watch','manual takeover','Stop during transition','blackout/restart','phone 390/320 layout','laptop pairing 320 layout','axe AA','After dark to Stagehand to After dark without re-pairing','explicit ownership only','disable','no audio/capture']},null,2));
  console.log('PASS '+engine+' After-dark phone cues, Night watch/manual takeover, panic, silence, layout and existing-pair handoff.');
 }catch(error){await laptop.screenshot({path:`work/yard-operator/${engine}-after-dark-phone-laptop-failure.png`});await mobile.screenshot({path:`work/yard-operator/${engine}-after-dark-phone-mobile-failure.png`});console.error(errors);throw error;}
 finally{await browser.close();fixture.kill('SIGTERM');await new Promise(r=>fixture.on('exit',r));if(err)process.stderr.write(err);}
})().catch(error=>{console.error(error);process.exitCode=1;});
