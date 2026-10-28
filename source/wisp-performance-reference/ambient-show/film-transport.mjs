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

/** Laptop-only muted media. The compositor is the sole picture sent to output. */
export class FilmTransport {
 constructor(compositor,clips,{mediaHost}={}){this.compositor=compositor;this.clips=clips;this.active=null;this.videos=[document.createElement('video'),document.createElement('video')];this.disposed=false;this.prepared=null;this.preparing=null;this.prepareEpoch=0;for(const v of this.videos){v.muted=true;v.playsInline=true;v.preload='auto';v.setAttribute('aria-hidden','true');v.className='source-preview';v.title='Muted film preview';mediaHost?.append(v);}compositor.add({id:'character',source:()=>this.active,kind:'character'});}
 frame(video,signal){return waitForFilmFrame(video,signal);}
 prepare(id){
  if(this.disposed)return Promise.reject(Error('Film transport disposed'));
  if(this.prepared?.id===id&&this.prepared.video!==this.active)return Promise.resolve(this.prepared);
  if(this.preparing?.id===id)return this.preparing.promise;
  this.cancelPreparation();const clip=this.clips.find(c=>c.id===id);if(!clip)return Promise.reject(Error('Unknown cue'));
  const epoch=this.prepareEpoch,abort=new AbortController(),video=this.videos.find(v=>v!==this.active);
  const job={id,abort,promise:null};this.preparing=job;
  job.promise=(async()=>{
   video.pause();video.muted=true;video.loop=!!clip.loop;video.src=clip.src;video.load();await this.frame(video,abort.signal);
   if(epoch!==this.prepareEpoch||this.disposed)throw Object.assign(Error('Film preparation cancelled'),{cancelled:true});
   video.pause();const prepared={id,clip,video,dispose:()=>{if(this.prepared===prepared)this.prepared=null;if(video!==this.active){video.pause();video.removeAttribute('src');video.load();}}};this.prepared=prepared;return prepared;
  })().finally(()=>{if(this.preparing===job)this.preparing=null;});return job.promise;
 }
 cancelPreparation(){this.prepareEpoch++;this.preparing?.abort.abort();this.preparing=null;this.prepared?.dispose();this.prepared=null;}
 preload(id){return this.prepare(id).then(()=>true).catch(()=>false);}

 async activate(prepared,live){const previous=this.active;await this.frame(prepared.video);if(!live())return;this.active=prepared.video;if(this.prepared===prepared)this.prepared=null;this.active.dataset.cue=prepared.id;this.compositor.reveal();if(previous&&previous!==this.active){previous.pause();previous.removeAttribute('src');previous.load();}}
 fade(target,ms,live){const start=this.compositor.level,at=performance.now();return new Promise(resolve=>{const tick=now=>{if(!live()){resolve();return;}const t=Math.min(1,(now-at)/Math.max(1,ms)),ease=t*t*(3-2*t);this.compositor.setLevel(start+(target-start)*ease);if(t<1)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});}
 hold(ms,live){const at=performance.now();return new Promise(resolve=>{const tick=now=>{if(!live()||now-at>=ms)resolve();else requestAnimationFrame(tick);};requestAnimationFrame(tick);});}
 blackout(){this.cancelPreparation();this.active=null;this.compositor.setLevel(0);this.compositor.blackout();for(const v of this.videos){v.pause();v.muted=true;}}
 dispose(){this.blackout();this.disposed=true;for(const v of this.videos){v.removeAttribute('src');v.load();v.remove();}}
}
