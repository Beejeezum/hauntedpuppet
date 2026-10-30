// Private candidate injection: never grants catalog approval or changes public cue files.
const assert=require('node:assert/strict'),fs=require('node:fs'),pw=require('playwright');
process.env.HAUNT_TONIGHT_ROOT='.';
const engine=process.env.HAUNT_BROWSER||'chromium',record=process.env.HAUNT_RECORD_LETTERING==='1';
assert(!record||engine==='chromium','Review recording uses Chromium; both engines test playback');
const watchdog=setTimeout(()=>{console.error('Lettering handoff exceeded60seconds');process.exit(1)},60000);
(async()=>{
 let page;const fixture=await require('./tonight_fixture.cjs').start(),browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{});
 try{
  page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const bank=JSON.parse(fs.readFileSync('source/wisp-performance-reference/ambient-show/rehearsal-cues.json'));
  const published=JSON.parse(fs.readFileSync('scripts/public-showdesk.json')).files;for(const clip of bank.clips){const file=published.find(item=>item.destination===clip.src.replace('./',''));assert(file,'Private fixture needs actual source for '+clip.id);clip.src='/'+file.source;}
  bank.clips.push({id:'fog-lettering',title:'Smoke lettering · private review',form:'atmosphere',src:'/source/wisp-performance-reference/button-cue-batch/fog-lettering-runtime-candidate-v1.mp4',loop:false,exitPolicy:'finish',seconds:11});
  await page.route('**/rehearsal-cues.json',r=>r.fulfill({json:bank}));
  await page.goto(fixture.base+'/source/wisp-performance-reference/ambient-show/showdesk.html?rehearsal=expanded');await page.waitForFunction(()=>window.WispDesk);
  await page.getByRole('button',{name:'Record cue order',exact:true}).click();
  for(const id of ['fog-lettering','friendly-wave'])await page.locator('#cues [data-cue="'+id+'"]').click();
  await page.evaluate(record=>{
   window.__letteringFinished=[];window.__arrivalTrace=[];window.__arrivalBlacks=[];window.__arrivalLast='';window.__arrivalStarted=performance.now();
   const canvas=document.getElementById('stage');window.__arrivalTimer=setInterval(()=>{
    const s=WispDesk.inspect(),v=[...document.querySelectorAll('#mediaSources video')].find(v=>v.dataset.cue===s.director.current),key=s.director.current+':'+s.director.phase;
    if(v?.dataset.cue==='fog-lettering'&&v.currentTime>=10.95)__letteringFinished.push(v.currentTime);if(key!==__arrivalLast){__arrivalLast=key;__arrivalTrace.push({id:s.director.current,phase:s.director.phase,level:s.composition.level,wall:performance.now(),mediaTime:v?.currentTime??null});}
    if(s.director.phase==='empty-stage'&&s.composition.level===0){const a=canvas.getContext('2d').getImageData(0,0,1280,720).data;let max=0;for(let i=0;i<a.length;i+=4)max=Math.max(max,a[i],a[i+1],a[i+2]);__arrivalBlacks.push(max);}
   },40);
   if(record){const stream=canvas.captureStream(24),recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:10000000}),chunks=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};window.__arrivalRecorder={stream,recorder,chunks};recorder.start(100);}
  },record);
  await page.getByRole('button',{name:'▶ Play draft',exact:true}).click();
  await page.waitForFunction(()=>WispDesk.inspect().director.current==='fog-lettering'&&WispDesk.inspect().director.phase==='playing');
  await page.waitForFunction(()=>WispDesk.inspect().director.current==='friendly-wave'&&WispDesk.inspect().director.phase==='playing',null,{timeout:20000});
  await page.waitForFunction(()=>WispDesk.inspect().director.current==='fog-lettering'&&WispDesk.inspect().director.phase==='playing',null,{timeout:20000});await page.waitForTimeout(500);
  const result=await page.evaluate(async()=>{
   clearInterval(__arrivalTimer);let base64=null;
   if(window.__arrivalRecorder){const r=__arrivalRecorder;await new Promise(resolve=>{r.recorder.onstop=resolve;r.recorder.stop();});for(const t of r.stream.getTracks())t.stop();const a=new Uint8Array(await new Blob(r.chunks).arrayBuffer());let binary='';for(let i=0;i<a.length;i+=8192)binary+=String.fromCharCode(...a.subarray(i,i+8192));base64=btoa(binary);}
   return{finished:__letteringFinished,trace:__arrivalTrace,emptyPixels:__arrivalBlacks,recordStartWall:__arrivalStarted,muted:WispDesk.inspect().media.every(v=>v.muted),base64};
  });
  assert.deepEqual(result.trace.filter(x=>x.phase==='playing').map(x=>x.id),['fog-lettering','friendly-wave','fog-lettering']);assert(result.finished.length>0,'Lettering must reach its complete native ending');
  assert(result.emptyPixels.length>=10&&result.emptyPixels.every(x=>x===0),'Actual composed black handle must be empty');
  result.holds=[];for(let i=0;i<result.trace.length;i++){const row=result.trace[i];if(row.phase!=='empty-stage'||!row.id)continue;const entering=result.trace.slice(i+1).find(x=>x.phase==='entering');if(entering)result.holds.push({from:row.id,to:entering.id,milliseconds:entering.wall-row.wall});}assert.equal(result.holds.length,2);assert(result.holds.every(h=>h.milliseconds>=450),'Both joins need at least500ms planned black hold, within40ms sampling resolution');
  assert(result.muted);assert.deepEqual(errors,[]);
  await page.getByRole('button',{name:'■ Blackout',exact:true}).click();assert(await page.evaluate(()=>WispDesk.inspect().composition.black&&WispDesk.inspect().media.every(v=>v.paused&&v.muted)));
  await page.evaluate(()=>dispatchEvent(new Event('pagehide')));assert.equal(await page.locator('video').count(),0);
  fs.mkdirSync('work/fog-lettering-candidate-v1',{recursive:true});if(result.base64)fs.writeFileSync('work/fog-lettering-candidate-v1/playlist-handoff-browser-v1.webm',Buffer.from(result.base64,'base64'));delete result.base64;
  fs.writeFileSync('work/fog-lettering-candidate-v1/handoff-'+engine+'.json',JSON.stringify({passed:true,result,scope:'Private candidate injection into actual desk/playlist. Complete native lettering-to-wave-to-lettering with actual composed black samples, real-time playback, default silence and cleanup. Optional generated-canvas recording only; no microphone, provider, human art/sound acceptance or physical projection. No public candidate admission.'},null,2));
  console.log('PASS '+engine+' private full lettering-to-wave-to-lettering playlist, actual black pixels, planned hold, no extra replay, silence and cleanup');
 }catch(error){if(page){fs.mkdirSync('work/fog-lettering-candidate-v1',{recursive:true});const state=await page.evaluate(()=>({state:window.WispDesk?.inspect(),trace:window.__arrivalTrace,status:document.getElementById('status')?.textContent})).catch(()=>({unavailable:true}));fs.writeFileSync('work/fog-lettering-candidate-v1/handoff-'+engine+'-failure.json',JSON.stringify({error:String(error),...state},null,2));}throw error;}finally{await browser.close();await fixture.close();clearTimeout(watchdog);}
})().catch(error=>{console.error(error);process.exitCode=1;});
