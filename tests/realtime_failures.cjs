const {liveWorkspaceUrl}=require('./live-url.cjs');
const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']}),results=[];
 for(const scenario of ['missing-key','permission-denied','provider-401','provider-429','invalid-sdp','stop-during-negotiation','late-microphone-permission']){
  const context=await browser.newContext({permissions:['microphone']}),page=await context.newPage(),errors=[];page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));let sessions=0,ends=0;
  await page.route('**/api/status',async route=>{const data=await(await route.fetch()).json();await route.fulfill({json:{...data,realtime:{...data.realtime,supported:true,configured:scenario!=='missing-key'}}});});
  await page.route('**/api/realtime/end',route=>{ends++;return route.fulfill({json:{ended:true}})});
  await page.route('**/api/realtime/session',async route=>{sessions++;if(scenario==='stop-during-negotiation')await new Promise(r=>setTimeout(r,1200));try{if(scenario==='provider-401')await route.fulfill({status:401,json:{error:'The connected key is invalid.'}});else if(scenario==='provider-429')await route.fulfill({status:429,json:{error:'Voice rate limit reached. Please try again shortly.'}});else await route.fulfill({status:201,json:{ticket:'test-ticket',model:'gpt-realtime-2.1',sdp:'invalid answer'}});}catch{}});
  if(scenario==='permission-denied')await page.addInitScript(()=>navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('Permission denied','NotAllowedError')});
  if(scenario==='late-microphone-permission')await page.addInitScript(()=>navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>{window.resolveMic=()=>{const ctx=new AudioContext(),dest=ctx.createMediaStreamDestination();window.lateMicContext=ctx;window.lateMicStream=dest.stream;resolve(dest.stream);}}));
  if(scenario==='missing-key')await page.addInitScript(()=>{window.missingKeyCapture=0;navigator.mediaDevices.getUserMedia=async()=>{window.missingKeyCapture++;throw Error('Unconfigured voice must not capture');};});
  await page.goto(liveWorkspaceUrl((process.env.HAUNT_TEST_BASE||'http://127.0.0.1:8770')+''));await page.waitForFunction(()=>window.HauntRealtime&&HauntWisp.inspect().ready);
  if(scenario==='missing-key'){assert(await page.locator('#startMic').isDisabled());await page.evaluate(()=>HauntRealtime.start());assert.equal(await page.evaluate(()=>window.missingKeyCapture),0);}else await page.click('#startMic');
  if(scenario==='stop-during-negotiation'){await page.waitForFunction(()=>HauntRealtime.inspect().peer!=='closed');await page.click('#stop');await page.waitForTimeout(1800);}
  else if(scenario==='late-microphone-permission'){await page.waitForFunction(()=>typeof window.resolveMic==='function');await page.click('#stop');await page.evaluate(()=>resolveMic());await page.waitForTimeout(100);assert(await page.evaluate(()=>lateMicStream.getTracks().every(t=>t.readyState==='ended')));await page.evaluate(()=>lateMicContext.close());}
  else await page.waitForFunction(()=>HauntRealtime.inspect().connection==='error');
  const state=await page.evaluate(()=>({rtc:HauntRealtime.inspect(),mouth:HauntWisp.inspect().mouth,helpers:document.querySelectorAll('audio').length,startDisabled:document.getElementById('startMic').disabled}));
  assert.equal(state.rtc.micTracks,0,scenario);assert.equal(state.rtc.peer,'closed',scenario);assert.equal(state.rtc.outputActive,false,scenario);assert.equal(state.helpers,0,scenario);assert.equal(state.startDisabled,scenario==='missing-key',scenario);assert.deepEqual(errors,[],scenario);
  if(['missing-key','permission-denied','late-microphone-permission'].includes(scenario))assert.equal(sessions,0,scenario);
  if(scenario==='permission-denied')assert(/permission was denied/i.test(state.rtc.lastError));
  if(scenario==='provider-429')assert(/rate limit/i.test(state.rtc.lastError));
  results.push({scenario,passed:true,sessions,ends,error:state.rtc.lastError});await context.close();
 }
 fs.mkdirSync(path.join(__dirname,'../test-results'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../test-results/realtime-failures.json'),JSON.stringify({passed:true,provider:'simulated failures; no cloud calls',results},null,2));await browser.close();console.log('PASS seven native failure/cancellation paths, no leaked microphone or media helper.');
})().catch(e=>{console.error(e);process.exit(1)});
