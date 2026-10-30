// Source-only whole-film playback, hardware muted. Not human sound/visual acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs'),pw=require('playwright');
process.env.HAUNT_TONIGHT_ROOT='.';
const watchdog=setTimeout(()=>{console.error('Fog lettering playback exceeded30seconds');process.exit(1);},30000);
(async()=>{
 const fixture=await require('./tonight_fixture.cjs').start(),engine=process.env.HAUNT_BROWSER||'chromium';
 const browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/fog-lettering-proof',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Private fog lettering review</title>'}));
  await page.goto(fixture.base+'/fog-lettering-proof');
  const result=await page.evaluate(async()=>{
   const video=document.createElement('video');video.muted=true;video.playsInline=true;document.body.append(video);
   const ready=new Promise((resolve,reject)=>{video.onloadeddata=resolve;video.onerror=()=>reject(Error('Film unavailable'));});
   video.src='/source/wisp-performance-reference/button-cue-batch/fog-lettering-runtime-candidate-v1.mp4';await ready;
   const canvas=document.createElement('canvas');canvas.width=160;canvas.height=90;
   const context=canvas.getContext('2d'),times=new Set();let lastTime=0,peak=0,headPeak=0,tailPeak=0,callback;
   const sample=(_,meta)=>{
    times.add(meta.mediaTime);lastTime=meta.mediaTime;context.drawImage(video,0,0,160,90);
    const pixels=context.getImageData(0,0,160,90).data;let current=0;
    for(let i=0;i<pixels.length;i+=4)current=Math.max(current,pixels[i],pixels[i+1],pixels[i+2]);
    peak=Math.max(peak,current);if(meta.mediaTime<.45)headPeak=Math.max(headPeak,current);
    if(meta.mediaTime>10.6)tailPeak=Math.max(tailPeak,current);
    callback=video.requestVideoFrameCallback(sample);
   };
   callback=video.requestVideoFrameCallback(sample);
   await new Promise((resolve,reject)=>{video.onended=resolve;video.onerror=()=>reject(Error('Film failed'));video.play().catch(reject);});
   video.cancelVideoFrameCallback(callback);
   const result={width:video.videoWidth,height:video.videoHeight,duration:video.duration,uniqueTimes:times.size,lastTime,peak,headPeak,tailPeak,muted:video.muted,audioTracks:video.audioTracks?.length??null};
   video.pause();video.removeAttribute('src');video.load();video.remove();result.remainingVideos=document.querySelectorAll('video').length;return result;
  });
  assert.equal(result.width,1280);assert.equal(result.height,720);assert(Math.abs(result.duration-265/24)<.05);
  assert(result.uniqueTimes>=200&&result.lastTime>=10.95&&result.peak>100);
  assert.equal(result.headPeak,0);assert.equal(result.tailPeak,0);assert(result.muted);
  if(result.audioTracks!==null)assert.equal(result.audioTracks,1);
  assert.equal(result.remainingVideos,0);assert.deepEqual(errors,[]);
  fs.mkdirSync('work/fog-lettering-candidate-v1',{recursive:true});
  fs.writeFileSync('work/fog-lettering-candidate-v1/playback-'+engine+'.json',JSON.stringify({passed:true,result,scope:'Complete11second native embedded-audio movie played muted; advancing pictures, visible center effect, black handles, retirement. Not acoustic listening, accepted typography/smoke, arbitrary cue joins or physical projection.'},null,2));
  console.log('PASS '+engine+' complete fog-lettering film, advancing pictures, black handles and silent decoder cleanup');
 }finally{await browser.close();await fixture.close();clearTimeout(watchdog);}
})().catch(error=>{console.error(error);process.exitCode=1;});
