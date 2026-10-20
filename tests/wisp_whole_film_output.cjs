const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
(async()=>{const browser=await chromium.launch({args:['--mute-audio']});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto((process.env.HAUNT_SOURCE_BASE||'http://127.0.0.1:8896')+'/source/wisp-performance-reference/runway-pilots/wisp-whole-film-handoff.html');
 const opened=page.waitForEvent('popup');await page.getByRole('button',{name:'Open silent rehearsal output'}).click();const output=await opened;output.on('pageerror',e=>errors.push(e.message));await output.waitForFunction(()=>window.WispFilmOutput);
 assert.equal(await output.locator('audio,video').count(),0);
 const lit=()=>{const c=document.querySelector('canvas'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return d.some((v,i)=>i%4!==3&&v>32);};
 await page.click('#idle');await page.waitForFunction(()=>WholeFilmReview.inspect().state==='idle');await output.waitForFunction(lit);
 assert.equal(await output.evaluate(()=>WispFilmOutput.inspect().silent),true);
 await page.click('#stop');assert.equal(await output.evaluate(lit),false);
 await page.click('#idle');await output.waitForFunction(lit);
 // A real paused decode ceases mirror progress; the existing output watchdog clears it.
 await page.evaluate(()=>WholeFilmReview.active.pause());await output.waitForFunction(()=>WispFilmOutput.inspect().stale,{},{timeout:4000});assert.equal(await output.evaluate(lit),false);
 await page.evaluate(()=>WholeFilmReview.active.play());await output.waitForFunction(()=>!WispFilmOutput.inspect().stale);await output.waitForFunction(lit);
 await output.keyboard.press('Escape');assert.equal(await output.evaluate(lit),false);assert.equal(await output.evaluate(()=>WispFilmOutput.inspect().stopped),true);
 await output.close();const secondOpen=page.waitForEvent('popup');await page.getByRole('button',{name:'Open silent rehearsal output'}).click();const second=await secondOpen;await second.waitForFunction(lit);await page.close();let ownerCloseOutcome='closed';if(!second.isClosed()){try{await second.waitForFunction(()=>WispFilmOutput.inspect().stopped);assert.equal(await second.evaluate(lit),false);ownerCloseOutcome='cleared';}catch(error){if(!second.isClosed())throw error;}}
 assert.deepEqual(errors,[]);const evidence={result:'PASS',scope:'isolated silent browser output, not physical projection',outputMediaElements:0,ownerStopClears:true,pausedDecodeWatchdog:true,resumeRecovers:true,escapeClears:true,ownerCloseOutcome,errors};fs.writeFileSync('work/whole-film-output-browser.json',JSON.stringify(evidence,null,2));console.log(evidence);
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
