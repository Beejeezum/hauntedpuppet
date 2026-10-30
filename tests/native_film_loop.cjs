// Same painted native film, default versus explicit replay. Hardware muted.
const assert=require('node:assert/strict'),fs=require('node:fs'),pw=require('playwright');
process.env.HAUNT_TONIGHT_ROOT='.';
const explicit=process.env.HAUNT_EXPLICIT_LOOP==='1',engine=process.env.HAUNT_BROWSER||'chromium';
const watchdog=setTimeout(()=>{console.error('Native film loop audit exceeded40seconds');process.exit(1);},40000);
(async()=>{
 const fixture=await require('./tonight_fixture.cjs').start(),browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{});
 try{
  const page=await browser.newPage();await page.route('**/loop-proof',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><canvas width="1280" height="720"></canvas>'}));await page.goto(fixture.base+'/loop-proof');
  const result=await page.evaluate(async explicit=>{
   const {ExplicitFilmLoop}=await import('/source/wisp-performance-reference/ambient-show/explicit-film-loop.mjs');
   const video=document.createElement('video');video.muted=true;video.playsInline=true;document.body.append(video);
   const events=[];for(const name of ['playing','ended','seeking','seeked','waiting','stalled','error'])video.addEventListener(name,()=>{events.push({event:name,media:video.currentTime,wall:performance.now()});if(events.length>120)events.shift();});const errors=[],controller=new ExplicitFilmLoop({onError:e=>errors.push(e.message)}),trace=[],canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
   const loaded=new Promise((resolve,reject)=>{video.onloadeddata=resolve;video.onerror=reject;});video.src='/source/wisp-performance-reference/runway-pilots/continuous-loop-study/wisp-continuous-loop-v28.mp4';await loaded;
   video.loop=!explicit;if(explicit)controller.start(video);
   let wraps=0,previousMedia=null,previousWall=null,maxGap=0,callbacks=0,callback,complete;
   let finishTimer;const finished=new Promise(resolve=>{complete=resolve;finishTimer=setTimeout(()=>resolve('timeout'),24000);});
   const sample=(wall,metadata)=>{
    const media=metadata.mediaTime;callbacks++;ctx.drawImage(video,0,0,1280,720);
    if(previousMedia!==null&&media<previousMedia-.5){wraps++;trace.push({wrap:wraps,media,wall,gap:wall-previousWall});}
    if(previousWall!==null)maxGap=Math.max(maxGap,wall-previousWall);previousWall=wall;previousMedia=media;
    if(wraps>=3&&media>.5){complete();return;}callback=video.requestVideoFrameCallback(sample);
   };
   callback=video.requestVideoFrameCallback(sample);await video.play();const outcome=await finished;clearTimeout(finishTimer);video.cancelVideoFrameCallback(callback);const nativeState={time:video.currentTime,paused:video.paused,seeking:video.seeking,readyState:video.readyState,loop:video.loop};
   const before=controller.inspect();controller.stop();video.pause();const stoppedTime=video.currentTime;
   video.dispatchEvent(new Event('ended'));await new Promise(r=>setTimeout(r,100));
   const stopped={paused:video.paused,time:video.currentTime,controller:controller.inspect()};controller.dispose();video.removeAttribute('src');video.load();video.remove();
   return{timedOut:outcome==='timeout',nativeState,events,explicit,wraps,callbacks,maxGap,trace,before,stopped,stoppedTime,disposed:controller.inspect(),errors,remainingVideos:document.querySelectorAll('video').length};
  },explicit);
  fs.mkdirSync('work/native-film-loop',{recursive:true});fs.writeFileSync('work/native-film-loop/'+engine+(explicit?'-explicit':'-native')+'.json',JSON.stringify(result,null,2));
  assert(!result.timedOut,'Native clock must survive three complete loop wraps');assert.equal(result.wraps,3);assert(result.callbacks>=200);assert(result.stopped.paused);assert.equal(result.stopped.time,result.stoppedTime);assert.equal(result.stopped.controller.active,false);assert(!result.stopped.controller.timer);assert.equal(result.disposed.pending,0);assert(result.disposed.disposed);assert.equal(result.remainingVideos,0);assert.deepEqual(result.errors,[]);
  console.log('PASS '+engine+' '+(explicit?'explicit':'native')+'3 native loop wraps and cancellation; measured maximum frame gap '+result.maxGap+'ms. No seam/art/physical acceptance.');
 }finally{await browser.close();await fixture.close();clearTimeout(watchdog);}
})().catch(error=>{console.error(error);process.exitCode=1;});
