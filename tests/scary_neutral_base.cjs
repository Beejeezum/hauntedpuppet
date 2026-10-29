// Source-only actual playback; does not approve the new speaking character.
const assert=require('node:assert/strict'),fs=require('node:fs'),pw=require('playwright');
process.env.HAUNT_TONIGHT_ROOT='.';
const watchdog=setTimeout(()=>{console.error('Neutral-base playback exceeded25seconds');process.exit(1)},25000);
(async()=>{const fixture=await require('./tonight_fixture.cjs').start(),engine=process.env.HAUNT_BROWSER||'chromium',browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{});
 try{
  const page=await browser.newPage();await page.route('**/neutral-base-proof',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Private neutral motion base</title>'}));await page.goto(fixture.base+'/neutral-base-proof');
  const result=await page.evaluate(async()=>{
   const video=document.createElement('video');video.muted=true;video.playsInline=true;document.body.append(video);
   const ready=new Promise((resolve,reject)=>{video.onloadeddata=resolve;video.onerror=()=>reject(Error('Neutral base unavailable'));});video.src='/source/wisp-art-reference/scary-speaking-study/neutral-motion-base-study/scary-neutral-body-base-v1.mp4';await ready;
   const canvas=document.createElement('canvas');canvas.width=68;canvas.height=44;const context=canvas.getContext('2d'),times=new Set();let lastTime=0,minimumPeak=255,callback;
   const sample=(_,meta)=>{times.add(meta.mediaTime);lastTime=meta.mediaTime;context.drawImage(video,0,0,68,44);const pixels=context.getImageData(0,0,68,44).data;let peak=0;for(let i=0;i<pixels.length;i+=4)peak=Math.max(peak,pixels[i],pixels[i+1],pixels[i+2]);minimumPeak=Math.min(minimumPeak,peak);callback=video.requestVideoFrameCallback(sample);};callback=video.requestVideoFrameCallback(sample);
   await new Promise((resolve,reject)=>{video.onended=resolve;video.onerror=()=>reject(Error('Neutral motion failed'));video.play().catch(reject);});video.cancelVideoFrameCallback(callback);
   const result={width:video.videoWidth,height:video.videoHeight,duration:video.duration,uniqueTimes:times.size,lastTime,minimumPeak,muted:video.muted,audioTracks:video.audioTracks?.length??null,decodedAudioBytes:video.webkitAudioDecodedByteCount??null};video.removeAttribute('src');video.load();video.remove();result.retiredVideoElements=document.querySelectorAll('video').length;return result;
  });
  assert.equal(result.width,1088);assert.equal(result.height,704);assert(Math.abs(result.duration-193/24)<.05);assert(result.uniqueTimes>=100&&result.lastTime>=7.95&&result.minimumPeak>90&&result.muted);if(result.audioTracks!==null)assert.equal(result.audioTracks,0);if(result.decodedAudioBytes!==null)assert.equal(result.decodedAudioBytes,0);assert.equal(result.retiredVideoElements,0);
  fs.mkdirSync('work/scary-neutral-reuse',{recursive:true});fs.writeFileSync('work/scary-neutral-reuse/playback-'+engine+'.json',JSON.stringify({passed:true,result,scope:'Complete native8second silent source-only body base, actual advancing decoded pictures and visible spirit, no baked audio tracks where exposed, decoder retirement. No mouth rendering, human character/voice/loop or physical projection approval.'},null,2));console.log('PASS '+engine+' full silent neutral body, native advancing pictures, visible spirit and decoder cleanup');
 }finally{await browser.close();await fixture.close();clearTimeout(watchdog);}
})().catch(error=>{console.error(error);process.exitCode=1;});
