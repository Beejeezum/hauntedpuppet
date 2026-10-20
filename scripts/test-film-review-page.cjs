const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
(async()=>{const browser=await chromium.launch({args:['--mute-audio']});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto((process.env.HAUNT_TEST_BASE||'http://127.0.0.1:8898')+'/source/wisp-performance-reference/ambient-show/review.html');
 await page.waitForFunction(()=>[...document.querySelectorAll('video')].length===4&&[...document.querySelectorAll('video')].every(v=>v.readyState>=1));
 assert(await page.locator('video').evaluateAll(v=>v.every(x=>x.paused&&x.muted&&!x.autoplay)));
 for(const video of await page.locator('video').all())await video.evaluate(async v=>{
  const ended=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Review decode timeout')),40000);v.addEventListener('ended',()=>{clearTimeout(timer);resolve();},{once:true});});await v.play();await ended;
 });
 const films=await page.locator('video').evaluateAll(videos=>videos.map(v=>{const q=v.getVideoPlaybackQuality();return{file:new URL(v.currentSrc).pathname,duration:v.duration,ended:v.ended,muted:v.muted,totalVideoFrames:q.totalVideoFrames,droppedVideoFrames:q.droppedVideoFrames};}));
 const expectedFrames=[122,122,243,364,485],joinButtons=page.locator('[data-join-frame]');assert.equal(await joinButtons.count(),expectedFrames.length);const joins=[];
 for(let i=0;i<expectedFrames.length;i++){
  const button=joinButtons.nth(i),frame=expectedFrames[i];assert.equal(await button.getAttribute('data-join-frame'),String(frame));await button.click();
  await page.waitForFunction(({index,from})=>{const b=document.querySelectorAll('[data-join-frame]')[index],v=b.closest('section').querySelector('video');return !v.paused&&v.currentTime>=from&&v.currentTime<from+.8;},{index:i,from:frame/24-1});
  const state=await button.evaluate(b=>{const v=b.closest('section').querySelector('video');return{label:b.textContent,time:v.currentTime,muted:v.muted,otherPlaying:[...document.querySelectorAll('video')].filter(x=>x!==v&&!x.paused).length};});assert.equal(state.muted,true);assert.equal(state.otherPlaying,0);joins.push(state);await page.locator('video').evaluateAll(v=>v.forEach(x=>x.pause()));
 }
 await page.locator('details').evaluateAll(v=>v.forEach(x=>x.open=true));
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 const report={passed:true,scope:'Local source review page; isolated muted Chromium, all four videos decode to end, no autoplay. Browser frame counters are not human seam, sound or physical projection acceptance.',films,joins,mobileOverflow:false,errors};
 fs.writeFileSync('work/film-review-page.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
