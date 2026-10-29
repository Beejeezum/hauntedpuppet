const assert = require('node:assert/strict');
const fs = require('node:fs');
const pw = require('playwright');
(async () => {
 const crypto=require('node:crypto');
 const root='source/wisp-performance-reference/ambient-show/single-movie-study/finite-cues/';
 const manifest=JSON.parse(fs.readFileSync(root+'packaging-review.json'));
 for(const cue of manifest.cues)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(root+cue.id+'.mp4')).digest('hex'),cue.compressedAssetSha256);
 const fixture = await require('./tonight_fixture.cjs').start();
 const base = '/source/wisp-performance-reference/ambient-show/single-movie-study/finite-cues/';
 try {
  const engines=process.env.HAUNT_BROWSER?[process.env.HAUNT_BROWSER]:['chromium','webkit'];
  if(engines.some(engine=>!['chromium','webkit'].includes(engine)))throw Error('Expected chromium or webkit');
  for (const engine of engines) {
   const browser = await pw[engine].launch(engine === 'chromium' ? { args: ['--mute-audio'] } : {});
   try {
    const page = await browser.newPage();
    await page.route('**/finite-study-test.html', r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><video muted playsinline width="640" height="360"></video>' }));
    await page.goto(fixture.base + '/finite-study-test.html');
    const result = await page.evaluate(async base => {
     const { FiniteCueStudy } = await import(base + 'finite-player.mjs');
     const video = document.querySelector('video'); video.muted = true; video.volume = 0;
     const player = window.player = new FiniteCueStudy(video);
     const a = { id:'friendly',url:base+'friendly-drift.mp4',frames:122,fps:24 };
     const b = { id:'morph',url:base+'cute-to-evil.mp4',frames:121,fps:24 };
     const waitEnded = () => new Promise((resolve,reject) => {
      const timer=setTimeout(()=>{cleanup();reject(Error('Finite end deadline'));},22000);
      const cleanup=()=>{clearTimeout(timer);video.removeEventListener('ended',done);video.removeEventListener('error',fail);};
      const done=()=>{cleanup();resolve();},fail=()=>{cleanup();reject(Error('Native media error'));};
      video.addEventListener('ended',done,{once:true});video.addEventListener('error',fail,{once:true});
     });
     const cases=[];
     for(const cues of [[a],[a,b],[b,a]]) {
      const prepared=await player.prepare(cues);
      const ranges=Array.from({length:video.buffered.length},(_,i)=>[video.buffered.start(i),video.buffered.end(i)]);
      let first=null,last=null,count=0,id,active=true,maxMediaGap=0;const joinFrames=[];
      const sample=(_,m)=>{if(!active)return;first??=m.mediaTime;if(last!==null)maxMediaGap=Math.max(maxMediaGap,m.mediaTime-last);last=m.mediaTime;if(prepared.windows.some(w=>Math.abs(m.mediaTime-w.start)<.15))joinFrames.push(m.mediaTime);count++;id=video.requestVideoFrameCallback(sample);};
      id=video.requestVideoFrameCallback(sample);
      const end=waitEnded();video.playbackRate=cues.length===2&&cues[0].id==='friendly'?1:4;await player.play();await end;
      active=false;video.cancelVideoFrameCallback(id);
      cases.push({...prepared,ranges,first,last,count,maxMediaGap,joinFrames,playbackRate:video.playbackRate,time:video.currentTime,ended:video.ended,mediaError:video.error?.code||0});
     }
     // Append new selections while the first native clip is already playing.
     const loadsBefore=player.sourceLoads;
     await player.prepare([a],{open:true});const continuousSrc=video.src;
     let continuousLast=null,continuousFrames=0,continuousGap=0,continuousID,continuousActive=true;
     const continuousFrame=(_,m)=>{if(!continuousActive)return;if(continuousLast!==null)continuousGap=Math.max(continuousGap,m.mediaTime-continuousLast);continuousLast=m.mediaTime;continuousFrames++;continuousID=video.requestVideoFrameCallback(continuousFrame);};
     continuousID=video.requestVideoFrameCallback(continuousFrame);
     video.playbackRate=1;const continuousEnd=waitEnded();await player.play();
     const movingDeadline=performance.now()+5000;while(video.currentTime<.25){if(performance.now()>movingDeadline)throw Error('Continuous start stalled');await new Promise(r=>setTimeout(r,10));}
     const appendResults=await Promise.all([player.append([b]),player.append([a],{seal:true})]);
     await continuousEnd;continuousActive=false;video.cancelVideoFrameCallback(continuousID);
     const continuous={...player.snapshot(),loads:player.sourceLoads-loadsBefore,sameSource:video.src===continuousSrc,last:continuousLast,frames:continuousFrames,maxMediaGap:continuousGap,time:video.currentTime,ended:video.ended,appendDurations:appendResults.map(x=>x.duration)};
     let sealedRejected=false;try{await player.append([b]);}catch{sealedRejected=video.src===continuousSrc&&player.sealed;}
     player.stop();const stopped={src:video.getAttribute('src'),duration:player.duration,paused:video.paused,objectURL:player.objectURL};
     // A delayed old fetch must settle cancelled and must not remove a new source.
     const originalFetch=window.fetch;let release;
     window.fetch=(url,options)=>String(url).includes('delayed.mp4')?new Promise(resolve=>{release=()=>resolve(new Response(new Uint8Array()));}):originalFetch(url,options);
     const old=player.prepare([{...a,url:base+'delayed.mp4'}]).then(()=> 'unexpected',e=>e.name);
     const deadline=performance.now()+5000;while(!release){if(performance.now()>deadline)throw Error('No delayed request');await new Promise(r=>setTimeout(r,10));}
     const replacement=await player.prepare([b]);const replacementSrc=video.src;const oldResult=await Promise.race([old,new Promise((_,reject)=>setTimeout(()=>reject(Error('Cancelled fetch stayed pending')),1000))]);release();await new Promise(r=>setTimeout(r,0));
     window.fetch=originalFetch;
     const stale={oldResult,preserved:video.src===replacementSrc,duration:player.duration};
     // Stop/replacement cancels both an in-flight append and the queued tail.
     await player.prepare([a],{open:true});let releaseAppend;
     window.fetch=(url,options)=>String(url).includes('delayed-append.mp4')?new Promise(resolve=>{releaseAppend=()=>resolve(new Response(new Uint8Array()));}):originalFetch(url,options);
     const inflight=player.append([{...b,url:base+'delayed-append.mp4'}]).then(()=> 'unexpected',e=>e.name);
     const queued=player.append([a],{seal:true}).then(()=> 'unexpected',e=>e.name);
     const appendDeadline=performance.now()+5000;while(!releaseAppend){if(performance.now()>appendDeadline)throw Error('No delayed append request');await new Promise(r=>setTimeout(r,10));}
     await player.prepare([b]);const freshSource=video.src;
     const cancelledAppends=await Promise.race([Promise.all([inflight,queued]),new Promise((_,reject)=>setTimeout(()=>reject(Error('Append cancellation stayed pending')),1000))]);
     releaseAppend();await new Promise(r=>setTimeout(r,0));window.fetch=originalFetch;
     const appendCancellation={results:cancelledAppends,preserved:video.src===freshSource,windows:player.windows.map(x=>x.id)};
     let fetchFailure=false;try{await player.prepare([{...a,url:base+'missing.mp4'}]);}catch(error){fetchFailure=error.message==='Finite cue unavailable'&&!video.getAttribute('src')&&!player.objectURL;}
     player.dispose();player.dispose();
     let disposedReject=false;try{await player.prepare([a]);}catch{disposedReject=true;}
     return {cases,continuous,sealedRejected,stopped,stale,appendCancellation,fetchFailure,disposedReject,disposedSrc:video.getAttribute('src'),sourceLoads:player.sourceLoads,scope:'Forward order at normal 1x rate; other cases accelerated 4x. Callback gaps are observations, not proof of presentation quality. Muted native MSE finite-media playback and cancellation only; no human smoothness, acoustic, provider, phone or physical projection acceptance.'};
    },base);
    fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync(`test-results/finite-cue-study-${engine}.json`,JSON.stringify(result,null,2));
    for(const c of result.cases){assert(c.ended);assert.equal(c.mediaError,0);assert(Math.abs(c.time-c.duration)<.002);assert(c.count>2);assert(c.last<c.duration);assert(Math.abs(c.last-(c.duration-1/24))<.002,'Final native frame missing');assert(c.ranges.every(r=>r[1]<=c.duration+.002));}
    result.cases.forEach((entry,index)=>assert.equal(entry.sourceLoads,index+1));assert.equal(result.cases[1].duration,243/24);
    assert.equal(result.continuous.loads,1);assert(result.continuous.sameSource);assert(result.continuous.ended);assert(result.continuous.sealed);assert.deepEqual(result.continuous.windows.map(x=>x.id),['friendly','morph','friendly']);assert(Math.abs(result.continuous.time-365/24)<.002);assert(Math.abs(result.continuous.last-364/24)<.002);assert(result.sealedRejected);
    assert.deepEqual(result.stopped,{src:null,duration:0,paused:true,objectURL:null});
    assert.deepEqual(result.appendCancellation.results,['AbortError','AbortError']);assert(result.appendCancellation.preserved);assert.deepEqual(result.appendCancellation.windows,['morph']);
    assert.equal(result.stale.oldResult,'AbortError');assert(result.stale.preserved);assert.equal(result.stale.duration,121/24);assert(result.fetchFailure);assert(result.disposedReject);assert.equal(result.disposedSrc,null);
    await page.goto(fixture.base+base+'index.html');
    await page.getByRole('button',{name:'Friendly → morph',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('video').currentTime>.3&&document.querySelector('output').textContent==='Playing selected finite sequence.');
    assert(await page.locator('video').evaluate(v=>v.muted&&v.volume===0));
    if(engine==='chromium')await page.screenshot({path:'test-results/finite-cue-study-ui.png'});
    await page.getByRole('button',{name:'Blackout / Stop'}).click();
    assert(await page.locator('video').evaluate(v=>v.paused&&!v.getAttribute('src')));
    await page.getByRole('button',{name:'Queue while playing',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('video').currentTime>.3&&Math.abs(document.querySelector('video').duration-365/24)<.002);
    await page.getByRole('button',{name:'Blackout / Stop'}).click();
    assert(await page.locator('video').evaluate(v=>v.paused&&!v.getAttribute('src')));
    await page.goto('about:blank');
    console.log(engine+' finite cue end, selected order, Stop, stale replacement and disposal PASS');
   } finally {await browser.close();}
  }
 } finally {await fixture.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
