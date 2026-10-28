const assert=require('node:assert/strict'),fs=require('node:fs'),pw=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
process.env.HAUNT_TONIGHT_ROOT=process.env.HAUNT_TONIGHT_ROOT||'dist';
(async()=>{const fixture=await require('./tonight_fixture.cjs').start(),engine=process.env.HAUNT_BROWSER||'chromium',browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__captureCalls=0;navigator.mediaDevices.getUserMedia=()=>{__captureCalls++;return Promise.reject(Error('Capture forbidden in review'));};const volume=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'volume');Object.defineProperty(HTMLMediaElement.prototype,'volume',{get:volume.get,set(value){this.__requestedVolume=value;volume.set.call(this,0);}});});
 await page.goto(fixture.base+'/assets/wisp-cue-review/index.html');await page.waitForFunction(()=>document.getElementById('film').readyState>=1);
 assert(await page.locator('.status').innerText().then(t=>t.includes('not the finished story')));assert(await page.evaluate(()=>film.paused&&film.muted&&film.currentTime===0));
 await page.getByRole('button',{name:'3 · A hand from the mist'}).click();await page.waitForFunction(()=>film.currentTime>20&&film.paused);assert(await page.evaluate(()=>film.muted));
 await page.getByRole('button',{name:'Play from start with sound'}).click();await page.waitForFunction(()=>!film.paused&&film.currentTime>.1&&film.currentTime<5);
 assert(await page.evaluate(()=>!film.muted&&film.__requestedVolume===.65&&film.volume===0),'Explicit sound request is tested through a zero-volume sink');
 await page.getByRole('button',{name:'2 · Trying to be scary'}).click();await page.waitForFunction(()=>film.paused&&film.currentTime>10&&film.currentTime<11);assert.equal(await page.evaluate(()=>__captureCalls),0);
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.evaluate(()=>{window.__reviewFilm=film;window.dispatchEvent(new Event('pagehide'));});assert(await page.evaluate(()=>__reviewFilm.paused&&__reviewFilm.muted&&!__reviewFilm.querySelector('source')));assert.deepEqual(errors,[]);
 fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/cue-review-'+engine+'.json',JSON.stringify({passed:true,scope:'Actual one-file rehearsal decoded, zero-volume audition sink, manual sound enable, chapter seek/pause, no capture, narrow layout and pagehide cleanup. No human sound/motion or physical projection acceptance.'},null,2));console.log('PASS '+engine+' actual review film, manual sound, chapter seeking, capture-free cleanup and mobile layout.');
 }finally{await browser.close();await fixture.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
