// Simulated delayed responses verify that an old acknowledgement cannot impersonate a new command.
const assert=require('node:assert/strict'),pw=require('playwright');
(async()=>{
 const fixture=await require('./tonight_fixture.cjs').start(),engine=process.env.HAUNT_BROWSER||'chromium',browser=await pw[engine].launch();
 const page=await browser.newPage();let acks=[],sent=0,held=null;
 try{
  await page.addInitScript(()=>sessionStorage.setItem('wispRemoteToken','test-only'));
  await page.route('**/api/state',r=>r.fulfill({json:{connected:true,state:{workspace:'films',loop:'after-dark'},cues:['Watching-Eyes','Night-Watch'],acks}}));
  await page.route('**/api/command',r=>{sent++;if(sent===2){held=r;return;}return r.fulfill({status:202,json:{seq:String(sent),status:'queued'}});});
  await page.goto(fixture.base+'/phone_remote/index.html');await page.locator('[data-value="Watching-Eyes"]').click();
  await page.waitForFunction(()=>actionStatus.textContent.includes('performance to finish'));
  await page.locator('[data-value="Night-Watch"]').click();assert.equal(await page.locator('#actionStatus').innerText(),'Sending to the laptop…');
  // First command finishes while the second request has not reached its acknowledgement.
  acks=[{seq:'1',status:'applied'}];await page.waitForTimeout(1200);assert.equal(await page.locator('#actionStatus').innerText(),'Sending to the laptop…');
  assert(held);await held.fulfill({status:202,json:{seq:'2',status:'queued'}});await page.waitForFunction(()=>actionStatus.textContent.includes('performance to finish'));
  acks.push({seq:'2',status:'applied'});await page.waitForFunction(()=>actionStatus.textContent==='Applied on the laptop.');
  console.log('PASS '+engine+' immediate send feedback and stale acknowledgement isolation.');
 }finally{await browser.close();await fixture.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
