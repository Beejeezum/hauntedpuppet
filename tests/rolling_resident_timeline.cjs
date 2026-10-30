// Simulated SourceBuffer/control clock. Not a native multi-hour soak.
const assert=require('node:assert/strict');
(async()=>{
 const {FiniteCueStudy}=await import('../source/wisp-performance-reference/ambient-show/single-movie-study/finite-cues/finite-player.mjs');
 const priorLocation=global.location,priorFetch=global.fetch;let fetches=0;
 global.location=new URL('http://fixture/');global.fetch=async()=>{fetches++;return{ok:true,arrayBuffer:async()=>new Uint8Array([1,2,3,4]).buffer};};
 class Buffer extends EventTarget{
  constructor(){super();this.start=0;this.end=0;const owner=this;this.buffered={get length(){return owner.end>owner.start?1:0;},start(){return owner.start;},end(){return owner.end;}};}
  appendBuffer(){this.end=this.appendWindowEnd;queueMicrotask(()=>this.dispatchEvent(new Event('updateend')));}
  remove(_,end){this.start=end;queueMicrotask(()=>this.dispatchEvent(new Event('updateend')));}
 }
 try{
  const video={currentTime:0,pause(){this.paused=true;}},player=new FiniteCueStudy(video,{retentionSeconds:20,cacheBudgetBytes:4});
  player.controller=new AbortController();player.media={duration:Infinity};player.buffer=new Buffer();player.ready=true;
  const cue={id:'logical-idle',url:'/fixture.mp4',frames:122,fps:24};
  for(let i=0;i<1000;i++){
   await player.append([cue]);video.currentTime=player.duration-.1;
   assert(player.windows.length<8);assert(player.buffer.end-player.buffer.start<26);assert(player.cachedBytes<=4);
  }
  assert.equal(player.frames,122000);assert(player.duration>3600&&player.evictions>990);assert.equal(fetches,1,'Repeated chunks reuse bounded byte cache');
  await player.append([{...cue,id:'other',url:'/other.mp4'}]);assert.equal(player.cache.size,1);assert.equal(player.cachedBytes,4);assert.equal(fetches,2);
  video.currentTime=player.duration-.1;await player.append([cue]);assert.equal(fetches,3,'Evicted cached asset is fetched again');
  const duration=player.duration;player.stop();assert.equal(player.cache.size,0);assert.equal(player.cachedBytes,0);assert.deepEqual(player.windows,[]);assert(video.paused);
  assert.throws(()=>new FiniteCueStudy(video,{retentionSeconds:1}),/retention/);assert.throws(()=>new FiniteCueStudy(video,{cacheBudgetBytes:Infinity}),/budget/);
  console.log('PASS1000 simulated rolling appends beyond1hour with bounded retained windows/range/cache, cache eviction/refetch and Stop cleanup. Not a real-time/native endurance claim. Duration '+duration);
 }finally{global.location=priorLocation;global.fetch=priorFetch;}
})().catch(error=>{console.error(error);process.exitCode=1;});
