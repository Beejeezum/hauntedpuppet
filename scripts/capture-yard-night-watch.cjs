// Explicit browser performance capture. No microphone, providers or generation.
// The hardware bus is silent; the real composed canvas and effect bus are recorded.
if(process.env.HAUNT_CAPTURE_NIGHT_WATCH!=='1')throw Error('Set HAUNT_CAPTURE_NIGHT_WATCH=1 to record one complete cycle.');
const fs=require('node:fs'),assert=require('node:assert/strict'),pw=require('playwright');
process.env.HAUNT_TONIGHT_ROOT='.';
(async()=>{
 const fixture=await require('../tests/tonight_fixture.cjs').start(),browser=await pw.chromium.launch({args:['--mute-audio']}),page=await browser.newPage({viewport:{width:1280,height:900}}),folder='work/yard-night-movie',errors=[],api=[];
 fs.mkdirSync(folder,{recursive:true});
 await page.addInitScript(()=>{
  const Native=window.AudioContext;window.__contexts=[];
  window.AudioContext=class extends Native{constructor(...args){super(...args);this.__bus=this.createGain();this.__silent=this.createGain();this.__silent.gain.value=0;this.__bus.connect(this.__silent);this.__silent.connect(super.destination);this.__record=this.createMediaStreamDestination();this.__bus.connect(this.__record);window.__contexts.push(this);}get destination(){return this.__bus||super.destination;}};
  if(navigator.mediaDevices)navigator.mediaDevices.getUserMedia=()=>{throw Error('No microphone or webcam in movie capture');};
 });
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/api/'))api.push(new URL(r.url()).pathname);});
 try{
  await page.goto(fixture.base+'/source/attraction-v2/console/haunt-loops.html');await page.waitForFunction(()=>window.WispAfterDark);await page.locator('#cycle').check();await page.locator('#sound').click();await page.waitForFunction(()=>WispAfterDark.inspect().sound.enabled);
  assert(!(await page.evaluate(()=>WispAfterDark.inspect().running)));assert.equal(await page.evaluate(()=>WispAfterDark.inspect().sound.active),0);
  const popup=page.waitForEvent('popup');await page.locator('#projector').click();const output=await popup;await output.waitForFunction(()=>window.WispFilmOutput);assert(await output.evaluate(()=>WispFilmOutput.inspect().silent));
  await page.evaluate(()=>{
   const c=document.querySelector('#stage'),x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,c.width,c.height);
   const stream=c.captureStream(30);stream.addTrack(__contexts[0].__record.stream.getAudioTracks()[0]);window.__captureStream=stream;window.__chunks=[];window.__samples=[];window.__captureStart=performance.now();
   window.__movie=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9,opus',audioBitsPerSecond:128000});__movie.ondataavailable=e=>{if(e.data.size)__chunks.push(e.data);};__movie.start(250);stream.getVideoTracks()[0].requestFrame();
   window.__captureTimer=setInterval(()=>{const s=WispAfterDark.inspect();__samples.push({t:(performance.now()-__captureStart)/1000,program:s.program,elapsed:s.nightWatch.elapsed,hold:s.nightWatch.emptyHold,running:s.running,activeAudio:s.sound.active,played:s.sound.played,recovering:s.recovering});},100);
  });
  await page.waitForTimeout(1000);await page.locator('#start').click();await output.bringToFront();
  await page.waitForFunction(()=>{const s=WispAfterDark.inspect();return s.running&&!s.loading&&s.program==='apparitions'&&s.nightWatch.elapsed>=46&&s.nightWatch.emptyHold;},null,{timeout:150000});
  // End inside the existing final dark hold. The one-second lead completes the loop pause.
  await page.waitForTimeout(4000);const last=await page.evaluate(()=>WispAfterDark.inspect());assert(last.program==='apparitions'&&last.nightWatch.emptyHold);assert(last.sound.played>=9);assert(!last.recovering);
  await page.locator('#stop').click();await page.waitForTimeout(200);
  const result=await page.evaluate(()=>new Promise(resolve=>{clearInterval(__captureTimer);__movie.onstop=async()=>{const blob=new Blob(__chunks,{type:'video/webm'}),reader=new FileReader();reader.onload=()=>{__captureStream.getTracks().forEach(t=>t.stop());resolve({data:reader.result.split(',')[1],samples:__samples,wallSeconds:(performance.now()-__captureStart)/1000});};reader.readAsDataURL(blob);};__movie.stop();}));
  assert.deepEqual(errors,[]);assert.deepEqual(api,[]);assert(result.samples.some(s=>s.program==='eyes'&&s.running));assert(result.samples.some(s=>s.program==='spider'&&s.running));assert(result.samples.some(s=>s.program==='apparitions'&&s.running));
  fs.writeFileSync(folder+'/night-watch-native.webm',Buffer.from(result.data,'base64'));delete result.data;fs.writeFileSync(folder+'/capture.json',JSON.stringify({scope:'Current native browser stage and real dry effects, hardware muted. No physical projector, voices, microphone or generated assets.',fps:30,width:1280,height:720,errors,api,...result},null,2));console.log('Captured one complete Night watch cycle with embedded effects and planned black boundaries.');
 }catch(error){fs.writeFileSync(folder+'/capture-failure.json',JSON.stringify({error:String(error),state:await page.evaluate(()=>window.WispAfterDark?.inspect()).catch(()=>null)},null,2));throw error;}finally{await browser.close();await fixture.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
