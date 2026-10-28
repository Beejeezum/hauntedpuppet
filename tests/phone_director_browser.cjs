const assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const fixture=await require('./tonight_fixture.cjs').start(),browser=await chromium.launch({args:['--mute-audio']});try{
 const page=await browser.newPage({viewport:{width:390,height:844}});let connected=true,workspace='director',fail=false,acks=[],sent=[],advertised=['friendly-wave','scary-reach'];
 await page.addInitScript(()=>{sessionStorage.setItem('wispRemoteToken','test-only');navigator.mediaDevices.getUserMedia=()=>{throw Error('Phone must never capture');};});
 await page.route('**/api/state',r=>r.fulfill({json:{connected,state:{workspace,status:'Ready for a line'},cues:advertised,acks}}));
 await page.route('**/api/command',r=>{const body=r.request().postDataJSON();sent.push(body);return r.fulfill({status:fail?503:202,json:fail?{error:'Laptop disconnected'}:{seq:String(sent.length),status:'queued'}});});
 await page.goto(fixture.base+'/phone_remote/index.html');await page.locator('#directorPanel').waitFor({state:'visible'});
 await page.fill('#performText','Hello, little vampire!');await page.selectOption('#performAnimation','friendly-wave');await page.click('#performSend');
 await page.waitForFunction(()=>actionStatus.textContent.includes('performance to finish'));
 assert.deepEqual(sent[0].value,{text:'Hello, little vampire!',mode:'exact',character:'friendly',animation:'friendly-wave'});assert.equal(sent[0].command,'perform');
 assert.equal(await page.inputValue('#performText'),'Hello, little vampire!');assert.equal(await page.locator('audio,video').count(),0);
 acks=[{seq:'1',status:'applied'}];await page.waitForFunction(()=>actionStatus.textContent==='Applied on the laptop.');
 await page.selectOption('#performCharacter','scary');assert.deepEqual(await page.locator('#performAnimation option').evaluateAll(options=>options.map(o=>o.value)),['scary-reach']);
 assert(await page.locator('[data-value="Ambient-Scary"]').isDisabled(),'Old or unavailable ambience controls stay disabled');advertised.push('Ambient-Scary');await page.waitForFunction(()=>!document.querySelector('[data-value="Ambient-Scary"]').disabled);await page.click('[data-value="Ambient-Scary"]');assert.equal(sent.at(-1).command,'cue');assert.equal(sent.at(-1).value,'Ambient-Scary');assert.deepEqual(await page.locator('#performAnimation option').evaluateAll(options=>options.map(o=>o.value)),['scary-reach'],'Ambient controls cannot appear as speaking animations');
 fail=true;await page.click('#performSend');await page.waitForFunction(()=>actionStatus.textContent==='Laptop disconnected');assert.equal(await page.inputValue('#performText'),'Hello, little vampire!');
 connected=false;await page.waitForFunction(()=>performSend.disabled);connected=true;workspace='films';await page.locator('#directorPanel').waitFor({state:'hidden'});assert.equal(await page.inputValue('#performText'),'Hello, little vampire!');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));console.log('PASS phone director payload, silent mobile composer, failed-send draft preservation, acknowledgement and workspace/disconnect gating');
 }finally{await browser.close();await fixture.close()}})().catch(e=>{console.error(e);process.exitCode=1});
