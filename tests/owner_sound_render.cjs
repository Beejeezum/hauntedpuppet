// Real offline native audio samples; no hardware sound, provider or capture.
const fs=require('node:fs'),assert=require('node:assert/strict'),pw=require('playwright');
(async()=>{
 const engine=process.env.HAUNT_BROWSER||'chromium',browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setContent('<title>Owner sound offline cancellation</title>');
  const result=await page.evaluate(async source=>{
   const {OwnerSound}=await import(URL.createObjectURL(new Blob([source],{type:'text/javascript'})));
   const render=async cancel=>{
    const offline=new OfflineAudioContext(1,48000,48000),sound=new OwnerSound();
    // Offline rendering starts suspended. This adapter permits scheduling through
    // the same owner methods before rendering; all graph nodes/samples are native.
    sound.context={get currentTime(){return offline.currentTime;},get state(){return offline.state==='closed'?'closed':'running';},createGain:()=>offline.createGain(),createBufferSource:()=>offline.createBufferSource(),destination:offline.destination};
    sound.master=offline.createGain();sound.master.gain.value=.35;sound.master.connect(offline.destination);
    const buffer=offline.createBuffer(1,4800,48000),samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=.4*Math.sin(i*2*Math.PI*440/48000);sound.buffers.set('fixture',buffer);
    const voice=sound.play('fixture',{delay:.5});if(cancel)sound.cancel();const releasedBeforeRender=voice.released===true;
    const rendered=await offline.startRendering(),data=rendered.getChannelData(0);let peak=0,sum=0;for(const x of data){peak=Math.max(peak,Math.abs(x));sum+=x*x;}
    await sound.dispose();return{samples:data.length,peak,rms:Math.sqrt(sum/data.length),releasedBeforeRender,voices:sound.voices.size,retiring:sound.retiring.size};
   };
   return{baseline:await render(false),cancelled:await render(true)};
  },fs.readFileSync('source/wisp-performance-reference/ambient-show/owner-sound.mjs','utf8'));
  assert(result.baseline.peak>.1&&result.baseline.rms>.01,'Control graph must render the scheduled nonzero sound');assert.equal(result.cancelled.samples,48000);assert.equal(result.cancelled.peak,0);assert.equal(result.cancelled.rms,0);assert(result.cancelled.releasedBeforeRender);assert.equal(result.cancelled.voices+result.cancelled.retiring,0);assert.deepEqual(errors,[]);
  fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/owner-sound-offline-'+engine+'.json',JSON.stringify({passed:true,...result,scope:'Native OfflineAudioContext graph/samples through actual owner play/cancel methods with an explicit pre-render state adapter. Nonzero control versus exact-zero cancelled output. Not live hardware timing, acoustic listening, provider or physical projection acceptance.'},null,2));console.log('PASS '+engine+' native offline owner audio: scheduled control is nonzero, cancellation detaches before render and all48000output samples stay exactly silent.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
