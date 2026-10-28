const assert=require('node:assert/strict');
(async()=>{
 const {waitForFilmFrame}=await import('../source/wisp-performance-reference/ambient-show/film-transport.mjs');
 class Video extends EventTarget{
  constructor(){super();Object.assign(this,{currentTime:1,readyState:2,paused:true,seeking:false,next:0,callbacks:new Map()});}
  play(){this.paused=false;return Promise.resolve();}
  requestVideoFrameCallback(fn){const id=++this.next;this.callbacks.set(id,fn);return id;}
  cancelVideoFrameCallback(id){this.callbacks.delete(id);}
  frame(mediaTime){for(const [id,fn]of [...this.callbacks]){this.callbacks.delete(id);fn(performance.now(),{mediaTime});}}
 }
 const clock=()=>({next:0,pending:new Map(),request(fn){const id=++this.next;this.pending.set(id,fn);return id;},cancel(id){this.pending.delete(id);},pulse(){for(const [id,fn]of [...this.pending]){this.pending.delete(id);fn(performance.now());}}});
 const turn=()=>new Promise(r=>setTimeout(r,0));
 {
  const v=new Video(),c=clock(),abort=new AbortController();let resolved=false;const pending=waitForFilmFrame(v,abort.signal,c).then(()=>resolved=true);
  v.currentTime=1.2;c.pulse();await turn();assert(!resolved,'A resolved Play promise and advancing audio clock are insufficient at readyState2');
  v.frame(1);await turn();assert(!resolved,'Old picture cannot establish readiness');v.frame(8);await turn();assert(!resolved,'Unrelated future timestamp cannot establish readiness');
  v.frame(1.1);await pending;assert(resolved,'Fresh presented picture plus advancing clock establishes readiness at state2');assert.equal(v._wispFrameReadiness.path,'fresh-presented-frame');assert.equal(v._wispFrameReadiness.lastMetadataTime,1.1);assert.equal(v.callbacks.size,0);assert.equal(c.pending.size,0);
 }
 {
  const v=new Video(),c=clock();v.readyState=3;const pending=waitForFilmFrame(v,undefined,c);v.currentTime=1.1;c.pulse();await pending;assert.equal(c.pending.size,0);assert.equal(v.callbacks.size,0);
 }
 {
  const v=new Video(),c=clock(),abort=new AbortController();let resolved=false;const pending=waitForFilmFrame(v,abort.signal,c).then(()=>resolved=true,e=>e);v.currentTime=1.2;v.seeking=true;v.frame(1.1);v.seeking=false;c.pulse();await turn();assert(!resolved,'Frame received during seeking is not fresh post-seek evidence');abort.abort();assert((await pending).cancelled);assert.equal(v._wispFrameReadiness.stage,'cancelled');assert.equal(c.pending.size,0);assert.equal(v.callbacks.size,0);
 }
 {
  const v=new Video(),c=clock();let rejectPlay;v.play=()=>{v.paused=false;return new Promise((r,j)=>rejectPlay=j);};const pending=waitForFilmFrame(v,undefined,c);v.currentTime=1.2;v.frame(1.1);await pending;rejectPlay(Error('Late native Play rejection'));await turn();assert.equal(c.pending.size,0);assert.equal(v.callbacks.size,0);
 }
 console.log('PASS frame readiness: current-data pictures accepted only with fresh presentation and advancing clock; no clock-only/stale/seeking acceptance; future-data fallback, cancellation and late native promise cleanup.');
})().catch(e=>{console.error(e);process.exitCode=1});
