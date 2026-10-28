/** Decode a standby film without starting and immediately pausing its clock. */
export async function waitForFilmData(video,signal){
 await new Promise((resolve,reject)=>{
  let timer,settled=false;
  const cleanup=()=>{clearTimeout(timer);for(const event of ['loadeddata','canplay','canplaythrough'])video.removeEventListener(event,ready);video.removeEventListener('error',failed);signal?.removeEventListener('abort',aborted);};
  const done=(error)=>{if(settled)return;settled=true;cleanup();error?reject(error):resolve();};
  const ready=()=>{if(video.readyState>=3&&!video.seeking)done();};
  const failed=()=>done(Error('Film unavailable'));
  const aborted=()=>done(Object.assign(Error('Film preparation cancelled'),{cancelled:true}));
  if(signal?.aborted){aborted();return;}
  signal?.addEventListener('abort',aborted,{once:true});
  for(const event of ['loadeddata','canplay','canplaythrough'])video.addEventListener(event,ready);
  video.addEventListener('error',failed,{once:true});timer=setTimeout(()=>done(Error('Film did not decode standby data')),6000);
  if(video.error)failed();else ready();
 });
}

export async function waitForFilmFrame(video,signal,frameClock){
  // Canvas sources can keep decoding after WebKit omits a presentation callback
  // on resume. Accept decoded future data with an advancing clock as a fallback;
  // a pending play() promise alone is never a readiness signal.
  await new Promise((resolve,reject)=>{
   let callback,timer,paintTask,settled=false;const requestedTime=video.currentTime;
   const request=cb=>frameClock?frameClock.request(cb):requestAnimationFrame(cb),cancel=id=>frameClock?frameClock.cancel(id):cancelAnimationFrame(id);
   const aborted=()=>failed(Object.assign(Error('Film preparation cancelled'),{cancelled:true}));
   const cleanup=()=>{clearTimeout(timer);if(paintTask!==undefined)cancel(paintTask);if(callback!==undefined)video.cancelVideoFrameCallback?.(callback);video.removeEventListener('playing',presented);video.removeEventListener('error',failed);signal?.removeEventListener('abort',aborted);};
   // Leave the native presentation callback before the caller can pause or
   // unload another media pipeline. WebKit/GStreamer can hold drawing locks
   // through the callback's microtask checkpoint.
   const playing=()=>{if(settled)return;settled=true;cleanup();setTimeout(resolve,0);};
   const failed=error=>{if(settled)return;settled=true;cleanup();reject(error instanceof Error?error:Error('Film unavailable'));};
   const ready=()=>!video.paused&&!video.seeking&&video.readyState>=3&&Number.isFinite(video.currentTime)&&video.currentTime-requestedTime>=1/30;
   const presented=()=>{if(settled)return;if(ready()){playing();return;}if(video.requestVideoFrameCallback)callback=video.requestVideoFrameCallback(presented);};
   const decoded=()=>{if(settled)return;if(ready()){playing();return;}paintTask=request(decoded);};
   if(signal?.aborted){aborted();return;}signal?.addEventListener('abort',aborted,{once:true});
   timer=setTimeout(()=>failed(Error('Film did not deliver a frame')),6000);video.addEventListener('error',failed,{once:true});
   if(video.requestVideoFrameCallback)callback=video.requestVideoFrameCallback(presented);else video.addEventListener('playing',presented,{once:true});
   if(frameClock||typeof requestAnimationFrame==='function')paintTask=request(decoded);
   try{Promise.resolve(video.play()).catch(failed);}catch(error){failed(error);}
  });
 }

/** Laptop-only media; sound requires an explicit operator enable. The compositor is the sole picture sent to output. */
export class FilmTransport {
 constructor(compositor,clips,{mediaHost,characterFilter,frameClock}={}){this.frameClock=frameClock;this.motionWaits=new Set();this.compositor=compositor;this.clips=clips;this.active=null;this.heldFrame=null;this.frameCanvas=null;this.videos=[document.createElement('video'),document.createElement('video')];this.disposed=false;this.prepared=null;this.preparing=null;this.prepareEpoch=0;this.soundEnabled=false;this.soundLevel=.5;this.soundSuspended=false;for(const v of this.videos){v.muted=true;v.playsInline=true;v.preload='auto';v.setAttribute('aria-hidden','true');v.className='source-preview';v.title='Laptop film source';mediaHost?.append(v);}compositor.add({id:'character',source:()=>{const raw=this.heldFrame||this.active;return characterFilter?.(raw)||raw},kind:'character'});}
 frame(video,signal){return waitForFilmFrame(video,signal,this.frameClock);}
 requestFrame(callback){return this.frameClock?this.frameClock.request(callback):requestAnimationFrame(callback);}
 cancelFrame(id){if(this.frameClock)this.frameClock.cancel(id);else cancelAnimationFrame(id);}
 setSound(enabled,level=this.soundLevel){if(typeof enabled!=='boolean'||!Number.isFinite(level)||level<0||level>1)throw Error('Invalid film sound settings');this.soundEnabled=enabled&&!this.disposed;this.soundLevel=level;this.syncSound();}
 suspendSound(suspended){this.soundSuspended=!!suspended;this.syncSound();}
 syncSound(){for(const v of this.videos){v.volume=this.soundLevel*Math.max(0,Math.min(1,this.compositor.level??1));v.muted=!this.soundEnabled||this.soundSuspended||v!==this.active||!!this.compositor.black;}}
 stageForTransition(cut){this.compositor.setLevel(cut?1:0);if(!cut)this.compositor.blackout();this.syncSound();}
 inspectSound(){return{enabled:this.soundEnabled,level:this.soundLevel,suspended:this.soundSuspended,audibleSources:this.videos.filter(v=>!v.muted&&!v.paused&&v.volume>0).length};}

 prepare(id){
  if(this.disposed)return Promise.reject(Error('Film transport disposed'));
  if(this.prepared?.id===id&&this.prepared.video!==this.active)return Promise.resolve(this.prepared);
  if(this.preparing?.id===id)return this.preparing.promise;
  this.cancelPreparation();const clip=this.clips.find(c=>c.id===id);if(!clip)return Promise.reject(Error('Unknown cue'));
  const epoch=this.prepareEpoch,abort=new AbortController(),video=this.videos.find(v=>v!==this.active);
  const job={id,abort,promise:null};this.preparing=job;
  job.promise=(async()=>{
   video._wispPrepareEpoch=epoch;video.pause();video.muted=true;video.loop=!!clip.loop;video.src=clip.src;video.load();await waitForFilmData(video,abort.signal);
   if(epoch!==this.prepareEpoch||this.disposed)throw Object.assign(Error('Film preparation cancelled'),{cancelled:true});
   const prepared={id,clip,video,signal:abort.signal,epoch,dispose:()=>{abort.abort();if(video._wispPrepareEpoch!==epoch)return;if(this.prepared===prepared)this.prepared=null;if(video!==this.active){video.pause();video.removeAttribute('src');video.load();}}};this.prepared=prepared;return prepared;
  })().finally(()=>{if(this.preparing===job)this.preparing=null;});return job.promise;
 }
 cancelPreparation(){this.prepareEpoch++;this.preparing?.abort.abort();this.preparing=null;this.prepared?.dispose();this.prepared=null;}
 preload(id){return this.prepare(id).then(()=>true).catch(()=>false);}

 async exit(ms,live,{keepPicture=false}={}){
  const video=this.active,clip=this.clips.find(c=>c.id===video?.dataset.cue);
  if(!video&&keepPicture&&this.heldFrame)return;
  if(!video||clip?.exitPolicy!=='finish'){if(keepPicture&&video)throw Error('Reviewed cut requires a complete-performance exit');return this.fade(0,ms,live);}
  // Finish this loop iteration naturally before an approved route leaves it.
  video.loop=false;
  await new Promise((resolve,reject)=>{
   let frame,timer,settled=false;
   const cleanup=()=>{if(frame!==undefined)this.cancelFrame(frame);clearTimeout(timer);video.removeEventListener('ended',complete);video.removeEventListener('error',failed);if(this.finishWait===cancel)this.finishWait=null;};
   const finish=(error)=>{if(settled)return;settled=true;cleanup();error?reject(error):resolve();};
   const complete=()=>finish(),cancel=()=>finish(),failed=()=>finish(Error('Film exit unavailable'));
   const tick=()=>{if(!live()||this.disposed||this.active!==video){cancel();return;}if(video.ended){complete();return;}frame=this.requestFrame(tick);};
   this.finishWait=cancel;video.addEventListener('ended',complete);video.addEventListener('error',failed);const remaining=Number.isFinite(video.duration)?Math.max(0,video.duration-video.currentTime):0;timer=setTimeout(()=>failed(),(remaining+6)*1000);tick();
  });
  if(live()&&this.active===video&&!keepPicture){this.compositor.setLevel(0);this.compositor.blackout();this.syncSound();}
 }
 holdPicture(video){
  if(video.readyState<2||!video.videoWidth||!video.videoHeight)return false;
  this.frameCanvas||=document.createElement('canvas');const canvas=this.frameCanvas;
  if(canvas.width!==video.videoWidth||canvas.height!==video.videoHeight){canvas.width=video.videoWidth;canvas.height=video.videoHeight;}
  const ctx=canvas.getContext('2d');ctx.drawImage(video,0,0);
  // Materialize independent pixels before releasing the decoder. A deferred
  // video-backed canvas draw can otherwise retain its native presentation buffer.
  ctx.putImageData(ctx.getImageData(0,0,canvas.width,canvas.height),0,0);
  this.heldFrame=canvas;return true;
 }
 async activate(prepared,live){
  if(!live())return;
  const cancelled=()=>Object.assign(Error('Film activation cancelled'),{cancelled:true});
  // A disposed preparation may refer to a video element since reused by a new
  // cue. Reject it before it can release the current picture or play that cue.
  const ownsPreparation=()=>!this.disposed&&!prepared.signal?.aborted&&prepared.epoch===this.prepareEpoch&&prepared.video._wispPrepareEpoch===prepared.epoch;
  if(!ownsPreparation())throw cancelled();
  const previous=this.active;
  if(previous&&previous!==prepared.video){
   // Hold the exact outgoing picture while releasing its clock. Starting the
   // next GStreamer pipeline first can block native pause/load on Linux.
   this.holdPicture(previous);this.active=null;previous.muted=true;
   // Exit the current paint/animation task before asking the native pipeline
   // to pause. Stop may cancel or reassign this handle during the fence.
   await new Promise(resolve=>setTimeout(resolve,0));
   if(!live())return;if(!ownsPreparation())throw cancelled();
   previous.pause();previous.removeAttribute('src');previous.load();this.syncSound();
  }
  await this.frame(prepared.video,prepared.signal);if(!live())return;if(!ownsPreparation())throw cancelled();
  this.active=prepared.video;this.heldFrame=null;if(this.prepared===prepared)this.prepared=null;
  this.active.dataset.cue=prepared.id;this.compositor.reveal();this.syncSound();
 }
 animate(ms,live,apply=()=>{}){const at=performance.now();return new Promise(resolve=>{let frame,settled=false;const finish=()=>{if(settled)return;settled=true;if(frame!==undefined)this.cancelFrame(frame);this.motionWaits.delete(finish);resolve();};const tick=now=>{if(!live()||this.disposed){finish();return;}const t=Math.min(1,(now-at)/Math.max(1,ms));apply(t);if(t<1)frame=this.requestFrame(tick);else finish();};if(this.disposed){resolve();return;}this.motionWaits.add(finish);frame=this.requestFrame(tick);});}
 fade(target,ms,live){const start=this.compositor.level;return this.animate(ms,live,t=>{const ease=t*t*(3-2*t);this.compositor.setLevel(start+(target-start)*ease);this.syncSound();});}
 hold(ms,live){return this.animate(ms,live);}

 blackout(){this.finishWait?.();for(const finish of [...this.motionWaits])finish();this.soundEnabled=false;this.cancelPreparation();this.active=null;this.heldFrame=null;if(this.frameCanvas){this.frameCanvas.width=0;this.frameCanvas.height=0;}this.compositor.setLevel(0);this.compositor.blackout();for(const v of this.videos){v.pause();v.muted=true;}}
 dispose(){this.blackout();this.frameCanvas=null;this.disposed=true;for(const v of this.videos){v.removeAttribute('src');v.load();v.remove();}}
}
