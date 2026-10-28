const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {OwnerSound}=await import('../source/wisp-performance-reference/ambient-show/owner-sound.mjs'),original=global.AudioContext,hadAudioContext=Object.hasOwn(global,'AudioContext');
 class Node{
  constructor(context){this.context=context;this.connected=false;this.gain={value:1,cancelScheduledValues(){},setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;}};context.nodes.push(this);}
  connect(){this.connected=true;}disconnect(){this.connected=false;}
  start(at){this.startAt=at;if(this.context.throwStart)throw Error('Start failure');}
  stop(at){this.stopAt=at;if(this.context.syncEnded)this.onended?.();}
 }
 class Context{
  constructor(){this.currentTime=0;this.state='running';this.nodes=[];this.destination={};}
  createGain(){return new Node(this);}createBufferSource(){return new Node(this);}
  async resume(){}async close(){this.state='closed';}
 }
 global.AudioContext=Context;
 try{
  const sound=new OwnerSound();await sound.enable();sound.buffers.set('fixture',{duration:1,numberOfChannels:1});
  const future=sound.play('fixture',{delay:5});sound.cancel();
  assert.equal(future.source.stopAt,0);assert.equal(future.level.gain.value,0);assert(!future.source.connected&&!future.level.connected);assert.equal(sound.voices.size,0);assert.equal(sound.retiring.size,0);assert(future.released,'Future graph releases without a native ended event');
  sound.context.currentTime=1;const playing=sound.play('fixture');sound.cancel();assert.equal(sound.retiring.size,1);assert.equal(sound.voices.size,0);const fadeTimer=playing.cleanupTimer;sound.cancel();assert.equal(playing.cleanupTimer,fadeTimer,'Repeated cancellation preserves the brief click-free fade');await new Promise(r=>setTimeout(r,70));
  assert.equal(sound.context.currentTime,1,'Audio clock deliberately stays frozen');assert(!playing.source.connected&&!playing.level.connected);assert.equal(sound.retiring.size,0);assert.equal(playing.cleanupTimer,null);
  const disposing=sound.play('fixture');sound.cancel();const context=sound.context;await sound.dispose();assert.equal(sound.retiring.size,0);assert.equal(disposing.cleanupTimer,null);assert(context.nodes.every(n=>!n.connected));assert.equal(context.state,'closed');
  const sync=new OwnerSound();await sync.enable();sync.buffers.set('fixture',{});sync.context.currentTime=1;sync.context.syncEnded=true;sync.play('fixture');sync.cancel();assert.equal(sync.retiring.size,0,'Synchronous ended cleanup cannot be re-added to retirement');await sync.dispose();
  const failed=new OwnerSound();await failed.enable();failed.buffers.set('fixture',{});failed.context.throwStart=true;assert.throws(()=>failed.play('fixture'),/Start failure/);assert.equal(failed.voices.size,0);assert(failed.context.nodes.slice(1).every(n=>!n.connected));await failed.dispose();
  fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/owner-sound-cancel.json',JSON.stringify({passed:true,futureStopAtZero:true,futureGraphDetachedSynchronously:true,frozenAudioClockCleanup:true,repeatedCancelRetainsFade:true,disposeClearsTimersAndMaster:true,synchronousEndedAndStartFailureCleanup:true,scope:'Synthetic audio graph with a frozen clock and normal Node timers. Does not establish hidden-browser/OS-sleep timer bounds, native audio samples or acoustic acceptance.'},null,2));console.log('PASS owner sound future Stop detaches immediately, frozen-clock fades have bounded cleanup, disposal releases timers/master, late/synchronous completion and start failures cannot retain voices. Synthetic audio graph only.');
 }finally{if(hadAudioContext)global.AudioContext=original;else delete global.AudioContext;}
})().catch(e=>{console.error(e);process.exitCode=1});
