const assert=require('node:assert/strict'),pw=require('playwright');
const watchdog=setTimeout(()=>{console.error('Painted frame release exceeded45seconds');process.exit(1)},45000);
(async()=>{const f=await require('./tonight_fixture.cjs').start(),engine=process.env.HAUNT_BROWSER||'chromium',browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{});try{
 const p=await browser.newPage();await p.route('**/native-frame-release',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><body></body>'}));await p.goto(f.base+'/native-frame-release');
 const results=await p.evaluate(async()=>{
  navigator.mediaDevices.getUserMedia=()=>{throw Error('No capture')};
  const {PhoneNativeLipLayer}=await import('/source/wisp-art-reference/painted-speech-study/phone-native-lip-layer.mjs'),{PhonePaintedMouthLayer}=await import('/source/wisp-art-reference/painted-speech-study/phone-painted-mouth-layer.mjs');
  const video=document.createElement('video');video.muted=true;video.loop=true;video.playsInline=true;video.dataset.cue='friendly-drift';document.body.append(video);video.src='/source/wisp-performance-reference/runway-pilots/continuous-loop-study/wisp-continuous-loop-v28.mp4';
  await new Promise((resolve,reject)=>{video.onloadeddata=resolve;video.onerror=()=>reject(Error('Native film unavailable'))});await video.play();
  const context=new AudioContext();await context.resume();const gain=context.createGain();gain.gain.value=0;gain.connect(context.destination);
  const blank=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.every(v=>v===0),results=[];
  for(const Kind of [PhoneNativeLipLayer,PhonePaintedMouthLayer]){
   const layer=new Kind();await layer.load();
   const run=async()=>{
    const node=context.createBufferSource();node.buffer=context.createBuffer(1,context.sampleRate*2,context.sampleRate);node.connect(gain);layer.begin({context,source:node,startedAt:context.currentTime,duration:2,visemes:[{start:0,end:2,shape:'A'}]});node.start();const before=layer.draws;
    await new Promise((resolve,reject)=>{let count=0;const tick=()=>{layer.render(video);if(layer.draws>before+2)return resolve();if(++count>180)return reject(Error('Painted mouth did not render'));requestAnimationFrame(tick)};tick()});
    const painted=!blank(layer.canvas)&&(!layer.snapshot||!blank(layer.snapshot));layer.stop();node.stop();node.disconnect();return{painted,bodyBlank:blank(layer.canvas),snapshotBlank:!layer.snapshot||blank(layer.snapshot),cropBlank:!layer.mouth.crop||blank(layer.mouth.crop),state:layer.inspect()};
   };
   const first=await run(),second=await run();layer.dispose();results.push({kind:Kind.name,first,second,disposed:layer.inspect()});
  }
  video.pause();video.removeAttribute('src');video.load();video.remove();gain.disconnect();await context.close();return results;
 });
 for(const result of results){for(const r of [result.first,result.second]){assert(r.painted&&r.bodyBlank&&r.snapshotBlank&&r.cropBlank);assert(r.state.ready&&!r.state.active&&!r.state.watching&&!r.state.frameReady)}assert(result.second.state.draws>result.first.state.draws);assert(result.disposed.disposed&&!result.disposed.ready);console.log('PASS '+engine+' '+result.kind+' actual painted buffers empty at Stop, reusable assets render another line and disposal completes; silent synthetic voice/actual film, no provider/human/projection approval.');}
 }finally{await browser.close();await f.close();clearTimeout(watchdog)}})().catch(e=>{console.error(e);process.exitCode=1});
