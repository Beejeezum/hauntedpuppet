const assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{
 const {FilmTransport,waitForFilmFrame,waitForFilmData}=await import(pathToFileURL(path.join(__dirname,'../source/wisp-performance-reference/ambient-show/film-transport.mjs')));
 class Media extends EventTarget {
  constructor(mode){super();this.mode=mode;this.playCount=0;this.readyState=0;this.cancelled=0;this.activeListeners=new Set();}
  get listeners(){return this.activeListeners.size;}
  addEventListener(...args){this.activeListeners.add(args[1]);return super.addEventListener(...args);}
  removeEventListener(...args){this.activeListeners.delete(args[1]);return super.removeEventListener(...args);}
  requestVideoFrameCallback(callback){this.frame=callback;return 7;}
  cancelVideoFrameCallback(id){assert.equal(id,7);this.cancelled++;}
  play(){this.playCount++;if(this.mode==='reject')return Promise.reject(Error('Playback denied'));if(this.mode==='frame')queueMicrotask(()=>this.frame());return new Promise(()=>{});}
 }
 const standby=new Media('frame');let decodedData=false;const standbyData=waitForFilmData(standby).then(()=>decodedData=true);standby.readyState=2;standby.dispatchEvent(new Event('loadeddata'));await Promise.resolve();assert.equal(decodedData,false,'A metadata/first-data event without future decoded data is insufficient');standby.readyState=3;standby.dispatchEvent(new Event('canplay'));await standbyData;assert.equal(standby.playCount,0,'Standby readiness cannot autoplay or pause a newly started clock');assert.equal(standby.listeners,0);
 const standbyAbort=new AbortController(),cold=new Media('stalled'),coldWait=waitForFilmData(cold,standbyAbort.signal);standbyAbort.abort();await assert.rejects(coldWait,/cancelled/);assert.equal(cold.listeners,0);
 const delivered=new Media('frame');let deadline;
 try{await Promise.race([FilmTransport.prototype.frame(delivered),new Promise((_,reject)=>{deadline=setTimeout(()=>reject(Error('Delivered frame waited for pending play promise')),500);})]);}finally{clearTimeout(deadline);}
 assert.equal(delivered.cancelled,1);assert.equal(delivered.listeners,0);
 const callbackFence=new Media('frame');callbackFence.play=function(){this.playCount++;queueMicrotask(()=>{this.frame();queueMicrotask(()=>this.presentationReturned=true)});return new Promise(()=>{});};await waitForFilmFrame(callbackFence);assert.equal(callbackFence.presentationReturned,true,'Media lifecycle mutations must happen after native presentation callback microtasks return');
 const decoded=new Media('stalled');Object.assign(decoded,{currentTime:0,readyState:4,paused:false,seeking:false});let pendingPaint=0;
 const oldRAF=globalThis.requestAnimationFrame,oldCancel=globalThis.cancelAnimationFrame;
 globalThis.requestAnimationFrame=callback=>{pendingPaint++;return setTimeout(()=>{pendingPaint--;decoded.currentTime+=.05;callback();},1);};globalThis.cancelAnimationFrame=id=>{clearTimeout(id);};
 try{await FilmTransport.prototype.frame(decoded);assert.equal(decoded.cancelled,1);assert.equal(decoded.listeners,0);assert.equal(pendingPaint,0);}finally{if(oldRAF)globalThis.requestAnimationFrame=oldRAF;else delete globalThis.requestAnimationFrame;if(oldCancel)globalThis.cancelAnimationFrame=oldCancel;else delete globalThis.cancelAnimationFrame;}
 const denied=new Media('reject');await assert.rejects(()=>FilmTransport.prototype.frame(denied),/Playback denied/);assert.equal(denied.cancelled,1);assert.equal(denied.listeners,0);
 const cancelled=new Media('stalled'),abort=new AbortController(),waiting=waitForFilmFrame(cancelled,abort.signal);abort.abort();await assert.rejects(waiting,/cancelled/);assert.equal(cancelled.cancelled,1);assert.equal(cancelled.listeners,0);
 const oldDocument=globalThis.document;globalThis.document={createElement:()=>{const v=new Media('frame');Object.assign(v,{loadCount:0,dataset:{},pause(){this.paused=true;},load(){this.loadCount++;this.readyState=this.mode==='stalled'?0:4;queueMicrotask(()=>this.dispatchEvent(new Event('canplay')));},setAttribute(){},removeAttribute(){},remove(){}});return v;}};
 try{const transport=new FilmTransport({add(){},setLevel(){},blackout(){},reveal(){}},[{id:'a',src:'a.mp4'},{id:'b',src:'b.mp4'}]);
  const stale=await transport.prepare('a');transport.blackout();const replacement=await transport.prepare('b');const replacementLoads=replacement.video.loadCount;stale.dispose();assert.equal(replacement.video.loadCount,replacementLoads,'An old prepared handle cannot clear a newly assigned video');assert.equal(replacement.video.src,'b.mp4');transport.cancelPreparation();
  assert.equal(await transport.preload('a'),true);const warmed=transport.prepared,count=warmed.video.loadCount;assert.equal(warmed.video.playCount,0,'Preloading a real transport does not invoke play');assert.equal(await transport.prepare('a'),warmed);assert.equal(warmed.video.loadCount,count,'A ready preload must not reload its film');
  await transport.activate(warmed,()=>true);assert.equal(transport.prepared,null);assert.equal(transport.active,warmed.video);
  const other=transport.videos.find(v=>v!==transport.active);other.mode='stalled';const pending=transport.preload('b');transport.blackout();assert.equal(await pending,false);assert.equal(transport.preparing,null);assert.equal(transport.prepared,null);assert(transport.videos.every(v=>v.paused&&v.muted));transport.dispose();await assert.rejects(transport.prepare('a'),/disposed/);
 }finally{globalThis.document=oldDocument;}
 const noData=new Media('stalled');await assert.rejects(()=>waitForFilmData(noData),/did not decode standby data/);assert.equal(noData.listeners,0);assert.equal(noData.playCount,0);
 const stalled=new Media('stalled');await assert.rejects(()=>FilmTransport.prototype.frame(stalled),/did not deliver a frame/);assert.equal(stalled.cancelled,1);assert.equal(stalled.listeners,0);
 console.log('PASS decoded standby data requires no playback; active frame delivery does not await a pending play promise; cancellation, rejection and real six-second readiness deadlines retain cleanup. Synthetic media readiness only.');
})().catch(error=>{console.error(error);process.exitCode=1;});
