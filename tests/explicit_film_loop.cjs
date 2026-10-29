const assert=require('node:assert/strict');
(async()=>{
 const {ExplicitFilmLoop}=await import('../source/wisp-performance-reference/ambient-show/explicit-film-loop.mjs');
 class Video extends EventTarget{
  constructor(){super();this.paused=false;this.calls=0;this.currentTime=5;this.mode='ready';}
  pause(){this.paused=true;}
  play(){this.calls++;if(this.mode==='throw')throw Error('Play failed');this.paused=false;if(this.mode==='pending')return new Promise((resolve,reject)=>{this.resolve=resolve;this.reject=reject;});return Promise.resolve();}
 }
 const tick=()=>new Promise(resolve=>setTimeout(resolve,10)),errors=[],loop=new ExplicitFilmLoop({onError:e=>errors.push(e.message)}),video=new Video();
 loop.start(video);video.dispatchEvent(new Event('ended'));loop.stop();await tick();assert.equal(video.calls,0);assert(video.paused);assert(!loop.inspect().timer);
 loop.start(video);video.dispatchEvent(new Event('ended'));await tick();assert.equal(video.calls,1);assert.equal(loop.inspect().restarts,1);assert.equal(video.currentTime,0);
 loop.finishCurrent();video.dispatchEvent(new Event('ended'));await tick();assert.equal(video.calls,1);assert(!video.paused,'Finish current detaches replay without interrupting the picture');
 video.mode='pending';loop.start(video);video.dispatchEvent(new Event('ended'));await tick();assert.equal(loop.inspect().pending,1);video.dispatchEvent(new Event('ended'));await tick();assert.equal(video.calls,2,'Duplicate end cannot start parallel replay');loop.stop();video.reject(Error('Late cancelled rejection'));await tick();assert.equal(loop.inspect().pending,0);assert(video.paused);assert.deepEqual(errors,[]);
 video.mode='throw';loop.start(video);video.dispatchEvent(new Event('ended'));await tick();assert.deepEqual(errors,['Play failed']);assert.equal(loop.inspect().pending,0);
 loop.dispose();video.dispatchEvent(new Event('ended'));await tick();assert(!loop.inspect().active&&!loop.inspect().timer&&loop.inspect().disposed);assert.throws(()=>loop.start(video),/disposed/);
 console.log('PASS synthetic replay timer cancellation, finish-current, duplicate ends, pending-play cancellation/rejection, synchronous failure and disposal');
})().catch(error=>{console.error(error);process.exitCode=1;});
