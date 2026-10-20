// Repeated real-media cue changes in an isolated silent browser, never a user profile.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
(async()=>{
 const cycles=Number(process.env.HAUNT_DESK_CYCLES||20);assert(Number.isInteger(cycles)&&cycles>=1&&cycles<=50);
 const browser=await chromium.launch({args:['--mute-audio']});let watchdog;const samples=[],runId=Date.now();
 const record=report=>{fs.mkdirSync('test-results',{recursive:true});fs.mkdirSync('work',{recursive:true});const json=JSON.stringify(report,null,2);fs.writeFileSync('work/showdesk-soak-'+runId+'.json',json);fs.writeFileSync('test-results/showdesk-soak-progress.json',json);};
 try{
  watchdog=setTimeout(()=>{console.error('Showdesk soak exceeded bounded runtime');process.exit(1);},360000);
  const context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.HAUNT_TEST_BASE||'http://127.0.0.1:8898')+'/source/wisp-performance-reference/ambient-show/showdesk.html');await page.waitForFunction(()=>window.WispDesk);await page.locator('#pace').selectOption('500');
  const popup=context.waitForEvent('page');await page.getByRole('button',{name:'Open silent rehearsal output'}).click();const output=await popup;await output.waitForFunction(()=>window.WispFilmOutput);
  const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');
  for(let cycle=1;cycle<=cycles;cycle++){
   for(const [id,title]of [['cute','Friendly Wisp'],['scary','Menacing Wisp'],['cute','Friendly Wisp']]){
    await page.getByRole('button',{name:new RegExp(title)}).click();await page.waitForFunction(id=>WispDesk.inspect().director.phase==='playing'&&WispDesk.inspect().director.current===id,id,{timeout:15000});await page.waitForTimeout(250);
   }
   const state=await page.evaluate(()=>WispDesk.inspect());assert.equal(state.effects,0);assert.equal(state.media.length,2);assert(state.media.every(v=>v.muted));assert.equal(await page.locator('video').count(),2);assert.equal(await page.locator('audio').count(),0);assert.equal(await output.locator('audio,video').count(),0);
   const performanceMetrics=(await cdp.send('Performance.getMetrics')).metrics;
   samples.push({cycle,phase:state.director.phase,heapBytes:performanceMetrics.find(m=>m.name==='JSHeapUsedSize')?.value,ownerVideos:2,ownerAudioElements:0,outputMediaElements:0});
   record({complete:false,requested:cycles,samples});console.log('Showdesk soak cycle '+cycle+'/'+cycles);
  }
  await page.getByRole('button',{name:/BLACKOUT \/ STOP/}).click();await output.waitForFunction(()=>{const c=document.querySelector('canvas');return !c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4!==3&&v);});assert.deepEqual(errors,[]);
  await page.goto('about:blank');await output.waitForFunction(()=>WispFilmOutput.inspect().stopped);
  const report={complete:true,browser:browser.version(),requested:cycles,samples,errors,blackout:true,outputStopsAfterOwnerLeaves:true,scope:'Repeated actual v28/v35 cue changes with silent mirrored output and fixed media counts in isolated Chromium. Heap samples are observations, not a leak proof. No physical projection, human seam, phone, provider or overnight acceptance.'};
  record(report);console.log('PASS repeated showdesk playback, silent output, Blackout and owner-close cleanup.');
 }catch(error){record({complete:false,requested:cycles,samples,error:error.message});throw error;}finally{clearTimeout(watchdog);await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
