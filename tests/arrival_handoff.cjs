// Private candidate injection: never grants catalog approval or changes public cue files.
const assert=require('node:assert/strict'),fs=require('node:fs'),pw=require('playwright');
process.env.HAUNT_TONIGHT_ROOT='.';
const engine=process.env.HAUNT_BROWSER||'chromium',record=process.env.HAUNT_RECORD_ARRIVAL==='1';
assert(!record||engine==='chromium','Review recording uses Chromium; both engines test playback');
const watchdog=setTimeout(()=>{console.error('Arrival handoff exceeded40seconds');process.exit(1)},40000);
(async()=>{
 const fixture=await require('./tonight_fixture.cjs').start(),browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const bank=JSON.parse(fs.readFileSync('source/wisp-performance-reference/ambient-show/rehearsal-cues.json'));
  bank.clips.push({id:'friendly-reform',title:'Friendly arrival · private review',form:'friendly',src:'/source/wisp-performance-reference/button-cue-batch/friendly-reform-runtime-candidate-v1.mp4',loop:false,exitPolicy:'finish',seconds:6});
  await page.route('**/rehearsal-cues.json',r=>r.fulfill({json:bank}));
  await page.goto(fixture.base+'/source/wisp-performance-reference/ambient-show/showdesk.html?rehearsal=expanded');await page.waitForFunction(()=>window.WispDesk);
  await page.getByRole('button',{name:'Record cue order',exact:true}).click();
  for(const id of ['friendly-reform','cute'])await page.locator('#cues [data-cue="'+id+'"]').click();
  await page.evaluate(record=>{
   window.__arrivalTrace=[];window.__arrivalBlacks=[];window.__arrivalLast='';window.__arrivalStarted=performance.now();
   const canvas=document.getElementById('stage');window.__arrivalTimer=setInterval(()=>{
    const s=WispDesk.inspect(),v=[...document.querySelectorAll('#mediaSources video')].find(v=>v.dataset.cue===s.director.current),key=s.director.current+':'+s.director.phase;
    if(key!==__arrivalLast){__arrivalLast=key;__arrivalTrace.push({id:s.director.current,phase:s.director.phase,level:s.composition.level,wall:performance.now(),mediaTime:v?.currentTime??null});}
    if(s.director.phase==='empty-stage'&&s.composition.level===0){const a=canvas.getContext('2d').getImageData(0,0,1280,720).data;let max=0;for(let i=0;i<a.length;i+=4)max=Math.max(max,a[i],a[i+1],a[i+2]);__arrivalBlacks.push(max);}
   },40);
   if(record){const stream=canvas.captureStream(24),recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:10000000}),chunks=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};window.__arrivalRecorder={stream,recorder,chunks};recorder.start(100);}
  },record);
  await page.getByRole('button',{name:'▶ Play draft',exact:true}).click();
  await page.waitForFunction(()=>WispDesk.inspect().director.current==='friendly-reform'&&WispDesk.inspect().director.phase==='playing');
  await page.waitForFunction(()=>WispDesk.inspect().director.current==='cute'&&WispDesk.inspect().director.phase==='playing',null,{timeout:18000});
  await page.waitForTimeout(1800);
  const result=await page.evaluate(async()=>{
   clearInterval(__arrivalTimer);let base64=null;
   if(window.__arrivalRecorder){const r=__arrivalRecorder;await new Promise(resolve=>{r.recorder.onstop=resolve;r.recorder.stop();});for(const t of r.stream.getTracks())t.stop();const a=new Uint8Array(await new Blob(r.chunks).arrayBuffer());let binary='';for(let i=0;i<a.length;i+=8192)binary+=String.fromCharCode(...a.subarray(i,i+8192));base64=btoa(binary);}
   return{trace:__arrivalTrace,emptyPixels:__arrivalBlacks,recordStartWall:__arrivalStarted,muted:WispDesk.inspect().media.every(v=>v.muted),base64};
  });
  assert.deepEqual(result.trace.filter(x=>x.phase==='playing').map(x=>x.id),['friendly-reform','cute']);
  assert(result.emptyPixels.length>=10&&result.emptyPixels.every(x=>x===0),'Actual composed black handle must be empty');
  const exit=result.trace.findIndex(x=>x.id==='friendly-reform'&&x.phase==='empty-stage');assert(exit>0);const entering=result.trace.slice(exit).find(x=>x.phase==='entering');assert(entering.wall-result.trace[exit].wall>=450,'At least500ms planned black hold, within40ms sampling resolution');
  assert(result.muted);assert.deepEqual(errors,[]);
  await page.getByRole('button',{name:'■ Blackout',exact:true}).click();assert(await page.evaluate(()=>WispDesk.inspect().composition.black&&WispDesk.inspect().media.every(v=>v.paused&&v.muted)));
  await page.evaluate(()=>dispatchEvent(new Event('pagehide')));assert.equal(await page.locator('video').count(),0);
  fs.mkdirSync('work/friendly-reform',{recursive:true});if(result.base64)fs.writeFileSync('work/friendly-reform/arrival-handoff-browser-v1.webm',Buffer.from(result.base64,'base64'));delete result.base64;
  fs.writeFileSync('work/friendly-reform/handoff-'+engine+'.json',JSON.stringify({passed:true,result,scope:'Private candidate injection into actual desk/playlist. Complete native arrival-to-idle with actual composed black samples, real-time playback, default silence and cleanup. Optional generated-canvas recording only; no microphone, provider, human art/sound acceptance or physical projection. No public candidate admission.'},null,2));
  console.log('PASS '+engine+' private full arrival-to-idle playlist, actual black pixels, planned hold, no extra replay, silence and cleanup');
 }finally{await browser.close();await fixture.close();clearTimeout(watchdog);}
})().catch(error=>{console.error(error);process.exitCode=1;});
