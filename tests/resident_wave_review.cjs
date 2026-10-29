// Source-only actual playback; does not approve resident acting, joins or sound.
const assert=require('node:assert/strict'),fs=require('node:fs'),pw=require('playwright');
process.env.HAUNT_TONIGHT_ROOT='.';
const watchdog=setTimeout(()=>{console.error('Resident review playback exceeded40seconds');process.exit(1)},40000);
(async()=>{const fixture=await require('./tonight_fixture.cjs').start(),engine=process.env.HAUNT_BROWSER||'chromium',browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{});
 try{
  const page=await browser.newPage();await page.route('**/resident-wave-proof',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Private resident wave review</title>'}));await page.goto(fixture.base+'/resident-wave-proof');
  const result=await page.evaluate(async()=>{
   const video=document.createElement('video');video.muted=true;video.playsInline=true;document.body.append(video);
   const ready=new Promise((resolve,reject)=>{video.onloadeddata=resolve;video.onerror=()=>reject(Error('Resident review unavailable'));});video.src='/source/wisp-performance-reference/button-cue-batch/resident-wave-study/idle-wave-idle-review-v1.mp4';await ready;
   const canvas=document.createElement('canvas');canvas.width=68;canvas.height=44;const context=canvas.getContext('2d'),times=new Set();let lastTime=0,minimumPeak=255,callback;
   const sample=(_,meta)=>{times.add(meta.mediaTime);lastTime=meta.mediaTime;context.drawImage(video,0,0,68,44);const pixels=context.getImageData(0,0,68,44).data;let peak=0;for(let i=0;i<pixels.length;i+=4)peak=Math.max(peak,pixels[i],pixels[i+1],pixels[i+2]);minimumPeak=Math.min(minimumPeak,peak);callback=video.requestVideoFrameCallback(sample);};callback=video.requestVideoFrameCallback(sample);
   await new Promise((resolve,reject)=>{video.onended=resolve;video.onerror=()=>reject(Error('Resident review failed'));video.play().catch(reject);});video.cancelVideoFrameCallback(callback);
   const result={width:video.videoWidth,height:video.videoHeight,duration:video.duration,uniqueTimes:times.size,lastTime,minimumPeak,muted:video.muted,audioTracks:video.audioTracks?.length??null,decodedAudioBytes:video.webkitAudioDecodedByteCount??null};video.removeAttribute('src');video.load();video.remove();result.retiredVideoElements=document.querySelectorAll('video').length;return result;
  });
  assert.equal(result.width,1280);assert.equal(result.height,720);assert(Math.abs(result.duration-485/24)<.05);assert(result.uniqueTimes>=300&&result.lastTime>=20.1&&result.minimumPeak>90&&result.muted);if(result.audioTracks!==null)assert.equal(result.audioTracks,0);if(result.decodedAudioBytes!==null)assert.equal(result.decodedAudioBytes,0);assert.equal(result.retiredVideoElements,0);
  fs.mkdirSync('work/resident-wave-review',{recursive:true});fs.writeFileSync('work/resident-wave-review/playback-'+engine+'.json',JSON.stringify({passed:true,result,scope:'Complete native20second silent idle-wave-idle picture review, advancing native decoded pictures and continuously visible spirit, no baked audio where exposed, decoder retirement. No dynamic button scheduler, sound, human motion/joins, closing loop or physical projection approval.'},null,2));console.log('PASS '+engine+' complete no-fade idle-wave-idle review, advancing pictures, visible spirit throughout and silent decoder cleanup');
 }finally{await browser.close();await fixture.close();clearTimeout(watchdog);}
})().catch(error=>{console.error(error);process.exitCode=1;});
