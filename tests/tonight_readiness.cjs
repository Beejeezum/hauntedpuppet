const assert=require('node:assert/strict'),fs=require('node:fs');
const pw=require(process.env.HAUNT_PLAYWRIGHT||'playwright'),engine=process.env.HAUNT_BROWSER==='webkit'?pw.webkit:pw.chromium;
const evidenceName=(process.env.HAUNT_READINESS_LABEL||process.env.HAUNT_BROWSER||'chromium').replace(/[^a-z0-9-]/gi,'');
(async()=>{
 const fixture=await require('./tonight_fixture.cjs').start(),browser=await engine.launch(process.env.HAUNT_BROWSER==='webkit'?{}:{args:['--mute-audio']});
 let page;try{
  page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:()=>{throw Error('Unexpected capture');}}});
   const play=HTMLMediaElement.prototype.play,frame=HTMLVideoElement.prototype.requestVideoFrameCallback;
   window.__heldFrames=[];window.__holdFrames=false;window.__mediaTrace=[];
   const seeking=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'seeking').get;
   Object.defineProperty(HTMLVideoElement.prototype,'seeking',{configurable:true,get(){return this.id==='picture'&&window.__holdFrames||seeking.call(this);}});
   const trace=(type,movie,extra={})=>{window.__mediaTrace.push({type,at:performance.now(),time:movie.currentTime,paused:movie.paused,ready:movie.readyState,...extra});if(window.__mediaTrace.length>80)window.__mediaTrace.shift();};
   for(const type of ['play','playing','pause','ended','error','seeked'])document.addEventListener(type,event=>{if(event.target.id==='picture')trace(type,event.target);},true);
   HTMLMediaElement.prototype.play=function(...args){const result=play.apply(this,args);if(this.id!=='picture')return result;trace('play-request',this);return new Promise((_,reject)=>result.then(()=>trace('native-play-resolved',this),error=>{trace('native-play-rejected',this,{error:error.message});reject(error);}));};
   HTMLVideoElement.prototype.requestVideoFrameCallback=function(callback){return frame.call(this,(...args)=>{trace('frame',this,{mediaTime:args[1]?.mediaTime});if(window.__holdFrames)window.__heldFrames.push(()=>callback(...args));else callback(...args);});};
  });
  await page.route('**/show.json',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({chapters:[{title:'First configured chapter',startSeconds:0,endSeconds:.25},{title:'Second configured chapter',startSeconds:.25,endSeconds:60}]})}));
  await page.goto(fixture.base+fixture.prefix+'index.html');await page.waitForFunction(()=>window.TonightDemo);
  await page.locator('#level').fill('0');await page.locator('#sound').check();
  await page.locator('#play').click();await page.waitForFunction(()=>TonightDemo.inspect().time>.2&&!TonightDemo.inspect().starting);
  assert(await page.locator('#pause').isEnabled(),'Delivered frames must release starting controls even while play promise remains pending');
  for(let cycle=0;cycle<6;cycle++){
   await page.locator('#pause').click();const paused=await page.evaluate(()=>TonightDemo.inspect());assert(paused.black&&paused.paused);
   await page.locator('#pause').click();await page.waitForFunction(at=>{const state=TonightDemo.inspect();if(document.querySelector('#status').textContent.includes('Film unavailable'))throw Error('Resume failed before delivering a frame');return !state.starting&&!state.paused&&state.time>at;},paused.time);
  }
  await page.waitForFunction(()=>document.querySelector('#chapter').textContent==='2 · Second configured chapter');
  await page.locator('#repeat').check();await page.evaluate(()=>{window.__endCount=0;const movie=document.querySelector('#picture');movie.addEventListener('ended',()=>window.__endCount++,{once:true});movie.currentTime=movie.duration-.2;});
  await page.waitForFunction(()=>window.__endCount===1&&!TonightDemo.inspect().starting&&TonightDemo.inspect().time>.25&&TonightDemo.inspect().time<2);
  assert(await page.locator('#pause').isEnabled());await page.waitForFunction(()=>!TonightDemo.inspect().audioPaused&&Math.abs(TonightDemo.inspect().audioTime-TonightDemo.inspect().time)<.25);await page.locator('#repeat').uncheck();
  await page.locator('#stop').click();await page.evaluate(()=>window.__holdFrames=true);await page.locator('#play').click();await page.waitForFunction(()=>window.__heldFrames.length>0);assert((await page.evaluate(()=>TonightDemo.inspect())).starting,'Held frame and decoder-seek readiness must still be pending before Stop');
  await page.locator('#stop').click();await page.evaluate(()=>{window.__holdFrames=false;for(const callback of window.__heldFrames.splice(0))callback();});
  await page.waitForTimeout(100);const state=await page.evaluate(()=>TonightDemo.inspect());assert(state.black&&!state.starting&&state.audioPaused);assert(await page.evaluate(()=>{const c=document.querySelector('#stage');return !c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4!==3&&v);}));
  assert.deepEqual(errors,[]);fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/tonight-readiness-'+evidenceName+'.json',JSON.stringify({passed:true,pendingPlayPromise:true,deliveredFramesEnableControls:true,pauseResumeCycles:6,lateFrameCannotUndoStop:true,repeatRestartsAtNativeEnd:true,zeroLevelSoundResynchronizes:true,cueSheetControlsChapterLabels:true,capture:false,scope:'Real muted video playback with intentionally pending play promises and a delayed frame callback; no physical projection or audio acceptance'},null,2));
  console.log('PASS Tonight delivered-frame readiness, Pause/Resume, native-end repeat with zero-level sound, cue-sheet chapter labels and Stop rejecting a late first frame.');
 }catch(error){if(page){const diagnostic=await page.evaluate(()=>({state:window.TonightDemo?.inspect(),status:document.querySelector('#status')?.textContent,video:{paused:document.querySelector('#picture')?.paused,ready:document.querySelector('#picture')?.readyState,seeking:document.querySelector('#picture')?.seeking},trace:window.__mediaTrace}));fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/tonight-readiness-'+evidenceName+'-failure.json',JSON.stringify(diagnostic,null,2));console.error(JSON.stringify(diagnostic));}throw error;}finally{await browser.close();await fixture.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
