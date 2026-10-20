const {liveWorkspaceUrl}=require('./live-url.cjs');
const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch(),desktopContext=await browser.newContext(),desk=await desktopContext.newPage();desk.setDefaultTimeout(20000);
 await desk.route('**/api/performance',route=>route.fulfill({status:503,json:{error:'Controlled cue-generation failure.'}}));
 await desk.goto(liveWorkspaceUrl((process.env.HAUNT_TEST_BASE||'http://127.0.0.1:8770')+''));await desk.waitForFunction(()=>window.HauntPhone&&HauntWisp.inspect().ready);await desk.evaluate(()=>HauntPhone.disable());
 await desk.locator('#customCueTitle').evaluate(el=>el.closest('details').open=true);await desk.fill('#customCueTitle','Cue failure regression');await desk.fill('#customCueWords','This line deliberately tests recovery from an unavailable voice service.');await desk.click('#addShowCue');
 const cueId=await desk.evaluate(()=>HauntShow.remoteState().cues.at(-1));await desk.locator('.phone-controls').evaluate(e=>e.open=true);await desk.click('#phoneEnable');await desk.waitForFunction(()=>/^\d{6}$/.test(document.getElementById('phoneCode').textContent));const code=await desk.locator('#phoneCode').textContent();
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),phone=await mobile.newPage();phone.setDefaultTimeout(20000);await phone.goto(liveWorkspaceUrl('http://127.0.0.1:8771'));await phone.fill('#code',code);await phone.locator('#pairForm button').click();await phone.waitForFunction(()=>document.getElementById('connection').textContent==='Connected to the laptop');
 await phone.locator(`[data-command="cue"][data-value="${cueId}"]`).click();await phone.waitForFunction(()=>document.getElementById('actionStatus').textContent==='The laptop could not apply that command.');
 await phone.locator('[data-command="cue"][data-value="hello"]').click();await desk.waitForFunction(()=>HauntWisp.inspect().state==='speaking');await phone.click('[data-command="stop"]');await desk.waitForFunction(()=>HauntWisp.inspect().mouth==='rest'&&HauntWisp.inspect().performanceId===null);await phone.waitForFunction(()=>document.getElementById('actionStatus').textContent==='Applied on the laptop.');await phone.waitForTimeout(1500);assert.equal(await phone.locator('#actionStatus').textContent(),'Applied on the laptop.','An older cancelled cue must not overwrite newer Stop feedback');
 await desk.evaluate(()=>HauntPhone.disable());await browser.close();console.log('PASS phone cue failure is reported honestly and Stop feedback survives late cue cancellation.');
})().catch(e=>{console.error(e);process.exit(1)});
