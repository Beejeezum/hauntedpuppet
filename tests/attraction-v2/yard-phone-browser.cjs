// Real loopback pairing/command transport, native films, synthetic PCM. No LAN, key, paid call or physical phone.
const assert=require('node:assert/strict'),fs=require('node:fs'),{spawn}=require('node:child_process'),pw=require('playwright');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const fixture=spawn('python3',['tests/attraction-v2/yard-phone-fixture.py'],{stdio:['ignore','pipe','pipe']});
 let err='';fixture.stderr.on('data',x=>err+=x);
 const base=await new Promise((resolve,reject)=>{let raw='';fixture.stdout.on('data',x=>{raw+=x;try{resolve(JSON.parse(raw.trim()).base);}catch{}});fixture.on('exit',()=>reject(Error(err)));});
 const engine=process.env.HAUNT_BROWSER||'chromium',browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{});
 const laptop=await browser.newPage({viewport:{width:1280,height:900}}),mobile=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 await mobile.addInitScript(()=>{window.__audioContexts=0;window.__captureRequests=0;const Native=window.AudioContext;window.AudioContext=class extends Native{constructor(...args){super(...args);window.__audioContexts++;}};navigator.mediaDevices.getUserMedia=()=>{window.__captureRequests++;throw Error('Phone must remain silent and never capture');};});
 for(const page of [laptop,mobile])page.on('pageerror',e=>errors.push(e.message));
 const state=()=>laptop.evaluate(()=>WispYardScene.inspect());
 const metrics=()=>fetch(base+'/test/metrics').then(r=>r.json());
 const settings=value=>fetch(base+'/test/settings',{method:'POST',body:JSON.stringify(value)});
 const waitAck=()=>mobile.waitForFunction(()=>document.querySelector('#actionStatus').textContent==='Applied on the laptop.',null,{timeout:30000});
 const cue=async name=>{await mobile.locator(`[data-command=cue][data-value="${name}"]`).click();await waitAck();};
 const closeDialogs=()=>laptop.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(x=>x.close()));
 fs.mkdirSync('work/yard-operator',{recursive:true});
 try{
  await laptop.goto(base+'/source/attraction-v2/console/');
  await laptop.waitForFunction(()=>window.WispYardScene&&window.HauntPhone);
  await laptop.evaluate(()=>localStorage.setItem('wisp-yard-live-cast-v1',JSON.stringify({friendly:'friendly-c',scary:'evil-c'})));
  await laptop.locator('#start').click();await laptop.waitForFunction(()=>WispYardScene.inspect().playback.current==='friendly');
  await laptop.locator('#connection').click();await laptop.locator('#phone-open').click();
  await laptop.locator('#phoneEnable').click();await laptop.waitForFunction(()=>/^\d{6}$/.test(document.querySelector('#phoneCode').textContent));
  const url=await laptop.locator('#phoneUrl').getAttribute('href'),code=await laptop.locator('#phoneCode').textContent();
  assert.match(url,/^http:\/\/127\.0\.0\.1:\d+\/$/);
  await mobile.goto(url);await mobile.locator('#code').fill(code);await mobile.getByRole('button',{name:'Pair phone',exact:true}).click();
  await mobile.waitForFunction(()=>document.body.dataset.connected==='true'&&document.querySelector('#cueHeading').textContent==='Yard controls');
  assert.equal(await mobile.locator('#performMode').inputValue(),'lettering');assert.equal(await mobile.locator('#performText').getAttribute('maxlength'),'240');
  assert.equal(await mobile.locator('[data-live-only]:visible').count(),0);assert.equal(await mobile.locator('#phoneWelcome').isVisible(),false);
  assert.equal(await mobile.locator('#ambientPresets').isVisible(),false);assert.equal(await mobile.locator('video,audio').count(),0);
  assert.equal(await mobile.locator('[data-command=cue][data-value=friendly-stay]').count(),0);
  await mobile.locator('#performText').fill('Happy Halloween, little ghosts!');await mobile.locator('#performSend').click();
  await laptop.waitForFunction(()=>WispYardScene.inspect().lettering);await waitAck();assert.equal((await metrics()).providerRequests,0);
  await cue('Drift-Left');await laptop.waitForTimeout(900);assert((await state()).movement.value.x<0);
  await cue('Come-Home');await cue('Evil-Wisp');await laptop.waitForFunction(()=>WispYardScene.inspect().playback.current==='scary',null,{timeout:30000});
  await mobile.locator('#performCharacter').selectOption('scary');await mobile.locator('#performMode').selectOption('exact');
  await mobile.locator('#performText').fill('Synthetic transport check.');await mobile.locator('#performSend').click();
  await laptop.waitForFunction(()=>WispYardScene.inspect().speech.phase==='speaking');
  assert.notEqual(await mobile.locator('#actionStatus').textContent(),'Applied on the laptop.');await waitAck();assert.equal((await metrics()).providerRequests,1);
  await closeDialogs();await laptop.locator('#connection').click();const popupPromise=laptop.waitForEvent('popup');await laptop.locator('#projector').click();const popup=await popupPromise;await popup.waitForLoadState();
  assert.equal(await popup.locator('video,audio').count(),0);assert(await popup.evaluate(()=>WispFilmOutput.inspect().silent));await closeDialogs();
  await settings({delay:2.5});await mobile.locator('#performText').fill('This cancelled test must never speak.');await mobile.locator('#performSend').click();
  await laptop.waitForFunction(()=>WispYardScene.inspect().speech.phase==='preparing');await mobile.getByRole('button',{name:'Stop All',exact:true}).click();await waitAck();
  await laptop.waitForFunction(()=>!WispYardScene.inspect().playback.running);await sleep(2900);
  assert(!(await state()).speech.active);assert(!(await state()).lettering);
  assert.equal(await popup.evaluate(()=>Math.max(...document.querySelector('canvas').getContext('2d').getImageData(640,360,1,1).data)),0);
  await settings({delay:0});await cue('Start-Show');await laptop.waitForFunction(()=>WispYardScene.inspect().playback.current==='scary');
  await cue('Mixed-Auto');assert.equal((await state()).playback.mode,'auto');await cue('Friendly-Wisp');
  await laptop.waitForFunction(()=>WispYardScene.inspect().playback.current==='friendly',null,{timeout:30000});
  await mobile.locator('#performMode').selectOption('lettering');await mobile.locator('#performCharacter').selectOption('friendly');await mobile.locator('#performText').fill('Draft survives connection loss.');
  for(const width of [390,320]){await mobile.setViewportSize({width,height:844});assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await mobile.route('**/qa-axe.js',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8')}));
  await mobile.addScriptTag({url:new URL('qa-axe.js',url).href});
  const axe=await mobile.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa']}})).violations);assert.deepEqual(axe.map(v=>v.id),[]);
  // Redact the preview only if it ever contained private footage (this fixture uses shipped art).
  await mobile.screenshot({path:`work/yard-operator/${engine}-yard-phone.png`,fullPage:true});
  await laptop.locator('#connection').click();await laptop.locator('#phone-open').click();await laptop.locator('#phoneRevoke').click();
  await mobile.waitForFunction(()=>!document.querySelector('#pairPanel').hidden);assert.equal(await mobile.locator('#performText').inputValue(),'Draft survives connection loss.');
  await laptop.locator('#phoneDisable').click();await laptop.waitForFunction(()=>!HauntPhone.inspect().enabled);
  assert.deepEqual(errors,[]);
  assert.equal(await mobile.evaluate(()=>window.__audioContexts),0);assert.equal(await mobile.evaluate(()=>window.__captureRequests),0);
  fs.writeFileSync(`work/yard-operator/${engine}-yard-phone.json`,JSON.stringify({engine,scope:'real loopback HTTP pairing/commands + native media; synthetic PCM; not LAN/physical phone/provider/physical projection',providerRequests:(await metrics()).providerRequests,errors,tests:['pair','bounded yard controls','silent lettering','locked character','native audio completion acknowledgement','stop during delayed response','silent projector','remote restart','mixed auto','phone draft preservation','revoke and disable','390/320 layout','axe AA']},null,2));
  console.log('PASS '+engine+' real phone transport, bounded yard controls, synthetic speech completion, cancellation, silent output, pairing lifecycle and mobile layout.');
 }catch(error){await laptop.screenshot({path:`work/yard-operator/${engine}-yard-phone-laptop-failure.png`});await mobile.screenshot({path:`work/yard-operator/${engine}-yard-phone-mobile-failure.png`});console.error(errors);throw error;}
 finally{await browser.close();fixture.kill('SIGTERM');await new Promise(r=>fixture.on('exit',r));if(err)process.stderr.write(err);}
})().catch(error=>{console.error(error);process.exitCode=1;});
