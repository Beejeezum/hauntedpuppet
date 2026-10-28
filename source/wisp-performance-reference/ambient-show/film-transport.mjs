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

export async function waitForFilmFrame(video,signal){
  // Canvas sources can keep decoding after WebKit omits a presentation callback
  // on resume. Accept decoded future data with an advancing clock as a fallback;
  // a pending play() promise alone is never a readiness signal.
  await new Promise((resolve,reject)=>{
   let callback,timer,paintTask,settled=false;const requestedTime=video.currentTime;
   const aborted=()=>failed(Object.assign(Error('Film preparation cancelled'),{cancelled:true}));
   const cleanup=()=>{clearTimeout(timer);if(paintTask!==undefined)cancelAnimationFrame(paintTask);if(callback!==undefined)video.cancelVideoFrameCallback?.(callback);video.removeEventListener('playing',playing);video.removeEventListener('error',failed);signal?.removeEventListener('abort',aborted);};
   const playing=()=>{if(settled)return;settled=true;cleanup();resolve();};
   const failed=error=>{if(settled)return;settled=true;cleanup();reject(error instanceof Error?error:Error('Film unavailable'));};
   const decoded=()=>{if(settled)return;if(!video.paused&&!video.seeking&&video.readyState>=3&&Math.abs(video.currentTime-requestedTime)>=1/30){playing();return;}paintTask=requestAnimationFrame(decoded);};
   if(signal?.aborted){aborted();return;}signal?.addEventListener('abort',aborted,{once:true});
   timer=setTimeout(()=>failed(Error('Film did not deliver a frame')),6000);video.addEventListener('error',failed,{once:true});
   if(video.requestVideoFrameCallback)callback=video.requestVideoFrameCallback(playing);else video.addEventListener('playing',playing,{once:true});
   if(typeof requestAnimationFrame==='function')paintTask=requestAnimationFrame(decoded);
   try{Promise.resolve(video.play()).catch(failed);}catch(error){failed(error);}
  });
 }

/** Laptop-only media; sound requires an explicit operator enable. The compositor is the sole picture sent to output. */
export class FilmTransport {
 constructor(compositor,clips,{mediaHost}={}){this.compositor=compositor;this.clips=clips;this.active=null;this.videos=[document.createElement('video'),document.createElement('video')];this.disposed=false;this.prepared=null;this.preparing=null;this.prepareEpoch=0;this.soundEnabled=false;this.soundLevel=.5;this.soundSuspended=false;for(const v of this.videos){v.muted=true;v.playsInline=true;v.preload='auto';v.setAttribute('aria-hidden','true');v.className='source-preview';v.title='Laptop film source';mediaHost?.append(v);}compositor.add({id:'character',source:()=>this.active,kind:'character'});}
 frame(video,signal){return waitForFilmFrame(video,signal);}
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
   const prepared={id,clip,video,dispose:()=>{if(video._wispPrepareEpoch!==epoch)return;if(this.prepared===prepared)this.prepared=null;if(video!==this.active){video.pause();video.removeAttribute('src');video.load();}}};this.prepared=prepared;return prepared;
  })().finally(()=>{if(this.preparing===job)this.preparing=null;});return job.promise;
 }
 cancelPreparation(){this.prepareEpoch++;this.preparing?.abort.abort();this.preparing=null;this.prepared?.dispose();this.prepared=null;}
 preload(id){return this.prepare(id).then(()=>true).catch(()=>false);}

 async exit(ms,live,{keepPicture=false}={}){
  const video=this.active,clip=this.clips.find(c=>c.id===video?.dataset.cue);
  if(!video||clip?.exitPolicy!=='finish'){if(keepPicture&&video)throw Error('Reviewed cut requires a complete-performance exit');return this.fade(0,ms,live);}
  // Finish this loop iteration naturally before an approved route leaves it.
  video.loop=false;
  await new Promise((resolve,reject)=>{
   let frame,timer,settled=false;
   const cleanup=()=>{if(frame!==undefined)cancelAnimationFrame(frame);clearTimeout(timer);video.removeEventListener('ended',complete);video.removeEventListener('error',failed);if(this.finishWait===cancel)this.finishWait=null;};
   const finish=(error)=>{if(settled)return;settled=true;cleanup();error?reject(error):resolve();};
   const complete=()=>finish(),cancel=()=>finish(),failed=()=>finish(Error('Film exit unavailable'));
   const tick=()=>{if(!live()||this.disposed||this.active!==video){cancel();return;}if(video.ended){complete();return;}frame=requestAnimationFrame(tick);};
   this.finishWait=cancel;video.addEventListener('ended',complete);video.addEventListener('error',failed);const remaining=Number.isFinite(video.duration)?Math.max(0,video.duration-video.currentTime):0;timer=setTimeout(()=>failed(),(remaining+6)*1000);tick();
  });
  if(live()&&this.active===video&&!keepPicture){this.compositor.setLevel(0);this.compositor.blackout();this.syncSound();}
 }
 async activate(prepared,live){const previous=this.active;await this.frame(prepared.video);if(!live())return;this.active=prepared.video;if(this.prepared===prepared)this.prepared=null;this.active.dataset.cue=prepared.id;this.compositor.reveal();this.syncSound();if(previous&&previous!==this.active){previous.pause();previous.removeAttribute('src');previous.load();}}
 fade(target,ms,live){const start=this.compositor.level,at=performance.now();return new Promise(resolve=>{const tick=now=>{if(!live()){resolve();return;}const t=Math.min(1,(now-at)/Math.max(1,ms)),ease=t*t*(3-2*t);this.compositor.setLevel(start+(target-start)*ease);this.syncSound();if(t<1)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});}
 hold(ms,live){const at=performance.now();return new Promise(resolve=>{const tick=now=>{if(!live()||now-at>=ms)resolve();else requestAnimationFrame(tick);};requestAnimationFrame(tick);});}
 blackout(){this.finishWait?.();this.soundEnabled=false;this.cancelPreparation();this.active=null;this.compositor.setLevel(0);this.compositor.blackout();for(const v of this.videos){v.pause();v.muted=true;}}
 dispose(){this.blackout();this.disposed=true;for(const v of this.videos){v.removeAttribute('src');v.load();v.remove();}}
}
