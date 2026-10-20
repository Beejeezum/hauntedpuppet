const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
(async()=>{const browser=await chromium.launch({args:['--mute-audio']});
try{const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],outside=[];
page.on('pageerror',e=>errors.push(e.message));const base=process.env.HAUNT_SOURCE_BASE||'http://127.0.0.1:8896';
await page.route('**/*',r=>{if(new URL(r.request().url()).origin===base)return r.continue();outside.push(r.request().url());return r.abort();});
await page.addInitScript(()=>{window.captureAttempts=0;navigator.mediaDevices.getUserMedia=async()=>{captureAttempts++;throw Error('Unexpected capture');};});
await page.goto(base+'/source/wisp-performance-reference/runway-pilots/wisp-whole-film-handoff.html');
assert.equal(await page.evaluate(()=>WholeFilmReview.inspect().state),'stopped');
assert.equal(await page.evaluate(()=>[...document.querySelectorAll('video')].every(v=>v.paused&&v.muted)),true);
await page.click('#greet');await page.waitForFunction(()=>WholeFilmReview.inspect().state==='speaking');
assert.equal(await page.evaluate(()=>WholeFilmReview.active.muted),true);
await page.waitForFunction(()=>WholeFilmReview.inspect().state==='idle',{},{timeout:12000});
assert.equal(await page.evaluate(()=>WholeFilmReview.active.loop),true);
assert.equal(await page.evaluate(()=>[...document.querySelectorAll('video')].filter(v=>v.style.opacity==='1').length),1);
const handoffs=await page.evaluate(()=>WholeFilmReview.inspect().handoffs);assert.equal(handoffs.length,1);assert.ok(handoffs[0]>=0);
await page.waitForTimeout(5500);assert.equal(await page.evaluate(()=>WholeFilmReview.inspect().state),'idle');
await page.screenshot({path:'work/whole-film-handoff-idle.png'});
await page.click('#stop');assert.equal(await page.locator('video[src]').count(),0);
assert.equal(await page.evaluate(()=>[...document.querySelectorAll('video')].every(v=>v.muted&&v.paused&&v.style.opacity==='0')),true);
// Cancel before the first decoded frame: no stale speech/idle restart after Blackout.
await page.evaluate(()=>{WholeFilmReview.playSpeech();WholeFilmReview.stop();});await page.waitForTimeout(500);
assert.equal(await page.evaluate(()=>WholeFilmReview.inspect().state),'stopped');
// Two rapid requests must leave the latest idle in control.
await page.evaluate(()=>{WholeFilmReview.playSpeech();WholeFilmReview.playIdle();});
await page.waitForFunction(()=>WholeFilmReview.inspect().state==='idle');
assert.equal(await page.evaluate(()=>WholeFilmReview.active.paused),false);
// Synthetic media-error event after decoding must not leave a frozen apparition.
await page.evaluate(()=>WholeFilmReview.active.dispatchEvent(new Event('error')));
assert.equal(await page.evaluate(()=>WholeFilmReview.inspect().state),'unavailable');
assert.equal(await page.locator('video[src]').count(),0);
await page.click('#idle');await page.waitForFunction(()=>WholeFilmReview.inspect().state==='idle');
await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>WholeFilmReview.inspect().state),'stopped');
assert.equal(await page.evaluate(()=>captureAttempts),0);assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
const evidence={result:'PASS',scope:'isolated muted browser; prepared films only',speechToLivingIdle:true,handoffMilliseconds:handoffs,idleContinuesBeyondCycle:true,blackoutCancelsPending:true,rapidRequestLatestWins:true,syntheticActiveMediaFailureClearsAndRecovers:true,captureAttempts:0,externalRequests:0,errors};
fs.writeFileSync('work/whole-film-handoff-browser.json',JSON.stringify(evidence,null,2));console.log(evidence);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
