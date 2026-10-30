// Clock/scheduler study only. Logical test actions reuse an idle movie; no new acting is claimed.
const assert=require('node:assert/strict'),fs=require('node:fs'),pw=require('playwright');
process.env.HAUNT_TONIGHT_ROOT='.';
const watchdog=setTimeout(()=>{console.error('Resident clock study exceeded70seconds');process.exit(1);},70000);
(async()=>{
 const counts={},fixture=await require('./tonight_fixture.cjs').start({requestHandler:async(req,res,pathname)=>{
  if(!pathname.endsWith('friendly-drift.mp4'))return false;
  counts[req.url]=(counts[req.url]||0)+1;
  if(!req.url.includes('slow=1'))return false;
  await new Promise(resolve=>setTimeout(resolve,1000));res.setHeader('Content-Type','video/mp4');res.end(fs.readFileSync('source/wisp-performance-reference/ambient-show/single-movie-study/finite-cues/friendly-drift.mp4'));return true;
 }}),engine=process.env.HAUNT_BROWSER||'chromium',browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{});
 let page;try{
  page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/resident-clock-proof',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><video muted playsinline width="640" height="360"></video>'}));await page.goto(fixture.base+'/resident-clock-proof');
  await page.evaluate(async()=>{
   const {ResidentActionPlayer}=await import('/source/wisp-performance-reference/ambient-show/resident-action-player.mjs');
   const video=document.querySelector('video'),url='/source/wisp-performance-reference/ambient-show/single-movie-study/finite-cues/friendly-drift.mp4';
   const idle={id:'test-idle',url,frames:122,fps:24,status:'study',entryPort:'friendly-rest',exitPort:'friendly-rest'};
   const actions=[{...idle,id:'test-action-a',url:url+'?action=a'},{...idle,id:'test-action-b',url:url+'?action=b'},{...idle,id:'test-action-slow',url:url+'?slow=1'}];
   let defaultRejectsStudy=false,rejectedTakeBlocked=false;
   try{new ResidentActionPlayer(video,{idle,actions});}catch{defaultRejectsStudy=true;}
   try{new ResidentActionPlayer(video,{idle,actions:[{...actions[0],status:'revision-required'}],allowStudy:true});}catch{rejectedTakeBlocked=true;}
   window.__resident={video,player:new ResidentActionPlayer(video,{idle,actions,allowStudy:true}),defaultRejectsStudy,rejectedTakeBlocked,source:null,frames:0,previous:null,backwards:0,minimumPeak:255};
   const canvas=document.createElement('canvas');canvas.width=160;canvas.height=90;const ctx=canvas.getContext('2d');
   const sample=(_,meta)=>{const s=__resident;if(s.previous!==null&&meta.mediaTime<s.previous)s.backwards++;s.previous=meta.mediaTime;s.frames++;ctx.drawImage(video,0,0,160,90);const data=ctx.getImageData(0,0,160,90).data;let peak=0;for(let i=0;i<data.length;i+=4)peak=Math.max(peak,data[i],data[i+1],data[i+2]);s.minimumPeak=Math.min(s.minimumPeak,peak);s.callback=video.requestVideoFrameCallback(sample);};
   await __resident.player.start();__resident.source=video.src;__resident.callback=video.requestVideoFrameCallback(sample);
   __resident.player.request('test-action-a');__resident.player.request('test-action-b');
  });
  await page.waitForFunction(()=>__resident.player.inspect().current==='test-action-b',null,{timeout:12000});
  await page.waitForFunction(()=>__resident.video.currentTime>10.5&&__resident.player.inspect().current==='test-idle',null,{timeout:12000});
  const first=await page.evaluate(()=>({state:__resident.player.inspect(),sameSource:__resident.video.src===__resident.source,loop:__resident.video.loop,muted:__resident.video.muted,frames:__resident.frames,minimumPeak:__resident.minimumPeak,backwards:__resident.backwards,defaultRejectsStudy:__resident.defaultRejectsStudy,rejectedTakeBlocked:__resident.rejectedTakeBlocked}));
  assert(first.sameSource&&!first.loop&&first.muted&&first.minimumPeak>90&&first.frames>150&&first.backwards===0);
  assert(first.defaultRejectsStudy&&first.rejectedTakeBlocked);assert.deepEqual(first.state.timeline.windows.slice(0,3).map(w=>w.id),['test-idle','test-action-b','test-idle']);
  await page.evaluate(()=>{__resident.video.playbackRate=4;});
  await page.waitForFunction(()=>__resident.video.currentTime>70,null,{timeout:22000});
  const rolling=await page.evaluate(()=>{const s=__resident.player.inspect(),b=__resident.video.buffered;return{state:s,range:[b.start(0),b.end(b.length-1)],sameSource:__resident.video.src===__resident.source,minimumPeak:__resident.minimumPeak,backwards:__resident.backwards,frames:__resident.frames};});
  assert(rolling.minimumPeak>90&&rolling.backwards===0);assert(rolling.sameSource&&rolling.state.timeline.sourceLoads===1&&rolling.state.timeline.evictions>0);assert(rolling.state.timeline.windows.length<10);assert(rolling.range[0]>35&&rolling.range[1]-rolling.range[0]<35);assert(rolling.state.timeline.cachedBytes<=16*1024*1024);
  await page.evaluate(()=>{__resident.player.stop();__resident.video.cancelVideoFrameCallback(__resident.callback);});await page.waitForTimeout(300);
  const stopped=await page.evaluate(()=>({src:__resident.video.getAttribute('src'),paused:__resident.video.paused,state:__resident.player.inspect()}));
  assert.equal(stopped.src,null);assert(stopped.paused&&!stopped.state.running);assert.equal(stopped.state.timeline.cachedBytes,0);assert.deepEqual(stopped.state.timeline.windows,[]);
  await page.evaluate(async()=>{__resident.video.playbackRate=1;await __resident.player.start();__resident.player.request('test-action-slow');});
  await page.waitForFunction(()=>__resident.player.inspect().busy,null,{timeout:7000});
  await page.evaluate(async()=>{__resident.player.stop();await __resident.player.start();});await page.waitForTimeout(1200);
  const replacement=await page.evaluate(()=>__resident.player.inspect());assert(replacement.running&&!replacement.error);assert.deepEqual(replacement.timeline.windows.map(w=>w.id),['test-idle']);assert.equal(replacement.timeline.cacheEntries,1);
  const disposed=await page.evaluate(()=>{__resident.player.dispose();return{state:__resident.player.inspect(),src:__resident.video.getAttribute('src'),paused:__resident.video.paused};});assert(disposed.state.disposed&&!disposed.state.running&&disposed.paused&&disposed.src===null&&disposed.state.timeline.cachedBytes===0);assert.deepEqual(errors,[]);assert(!Object.keys(counts).some(url=>url.includes('action=a')));assert.equal(Object.entries(counts).find(([url])=>url.includes('action=b'))?.[1],1);assert(Object.entries(counts).filter(([url])=>url.endsWith('friendly-drift.mp4')).every(([,count])=>count<=3));
  fs.mkdirSync('work/resident-action-player',{recursive:true});fs.writeFileSync('work/resident-action-player/'+engine+'.json',JSON.stringify({first,rolling,stopped,replacement,disposed,counts,scope:'Actual muted native MSE scheduler/cache/eviction and cancellation with synthetic logical actions using the same original idle pixels. First action/return at1x, then accelerated4x through70media seconds. Not authored action quality, human joins/sound, long1x soak, phone/projector or production acceptance.'},null,2));
  console.log('PASS '+engine+' resident queue/return, one advancing source, bounded rolling buffer/cache and stale append cancellation. Synthetic action fixture, no new acting approval.');
 }catch(error){if(page){const state=await page.evaluate(()=>{const s=window.__resident,v=s?.video;return{state:s?.player.inspect(),media:v?{time:v.currentTime,paused:v.paused,seeking:v.seeking,readyState:v.readyState,error:v.error?.message||null,buffered:Array.from({length:v.buffered.length},(_,i)=>[v.buffered.start(i),v.buffered.end(i)])}:null,frames:s?.frames};}).catch(()=>({unavailable:true}));fs.mkdirSync('work/resident-action-player',{recursive:true});fs.writeFileSync('work/resident-action-player/'+engine+'-failure.json',JSON.stringify({failure:String(error),...state,counts},null,2));}throw error;}finally{await browser.close();await fixture.close();clearTimeout(watchdog);}
})().catch(error=>{console.error(error);process.exitCode=1;});
