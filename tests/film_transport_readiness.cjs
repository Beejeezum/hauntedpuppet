const assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{
 const {FilmTransport}=await import(pathToFileURL(path.join(__dirname,'../source/wisp-performance-reference/ambient-show/film-transport.mjs')));
 class Media extends EventTarget {
  constructor(mode){super();this.mode=mode;this.cancelled=0;this.activeListeners=new Set();}
  get listeners(){return this.activeListeners.size;}
  addEventListener(...args){this.activeListeners.add(args[1]);return super.addEventListener(...args);}
  removeEventListener(...args){this.activeListeners.delete(args[1]);return super.removeEventListener(...args);}
  requestVideoFrameCallback(callback){this.frame=callback;return 7;}
  cancelVideoFrameCallback(id){assert.equal(id,7);this.cancelled++;}
  play(){if(this.mode==='reject')return Promise.reject(Error('Playback denied'));if(this.mode==='frame')queueMicrotask(()=>this.frame());return new Promise(()=>{});}
 }
 const delivered=new Media('frame');let deadline;
 try{await Promise.race([FilmTransport.prototype.frame(delivered),new Promise((_,reject)=>{deadline=setTimeout(()=>reject(Error('Delivered frame waited for pending play promise')),500);})]);}finally{clearTimeout(deadline);}
 assert.equal(delivered.cancelled,1);assert.equal(delivered.listeners,0);
 const denied=new Media('reject');await assert.rejects(()=>FilmTransport.prototype.frame(denied),/Playback denied/);assert.equal(denied.cancelled,1);assert.equal(denied.listeners,0);
 const stalled=new Media('stalled');await assert.rejects(()=>FilmTransport.prototype.frame(stalled),/did not deliver a frame/);assert.equal(stalled.cancelled,1);assert.equal(stalled.listeners,0);
 console.log('PASS delivered frames do not await a pending play promise; rejection and real six-second no-frame timeout retain cleanup. Synthetic media readiness only.');
})().catch(error=>{console.error(error);process.exitCode=1;});
