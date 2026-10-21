export async function waitForFilmFrame(video){
  // Canvas sources can keep decoding after WebKit omits a presentation callback
  // on resume. Accept decoded future data with an advancing clock as a fallback;
  // a pending play() promise alone is never a readiness signal.
  await new Promise((resolve,reject)=>{
   let callback,timer,paintTask,settled=false;const requestedTime=video.currentTime;
   const cleanup=()=>{clearTimeout(timer);if(paintTask!==undefined)cancelAnimationFrame(paintTask);if(callback!==undefined)video.cancelVideoFrameCallback?.(callback);video.removeEventListener('playing',playing);video.removeEventListener('error',failed);};
   const playing=()=>{if(settled)return;settled=true;cleanup();resolve();};
   const failed=error=>{if(settled)return;settled=true;cleanup();reject(error instanceof Error?error:Error('Film unavailable'));};
   const decoded=()=>{if(settled)return;if(!video.paused&&!video.seeking&&video.readyState>=3&&Math.abs(video.currentTime-requestedTime)>=1/30){playing();return;}paintTask=requestAnimationFrame(decoded);};
   timer=setTimeout(()=>failed(Error('Film did not deliver a frame')),6000);video.addEventListener('error',failed,{once:true});
   if(video.requestVideoFrameCallback)callback=video.requestVideoFrameCallback(playing);else video.addEventListener('playing',playing,{once:true});
   if(typeof requestAnimationFrame==='function')paintTask=requestAnimationFrame(decoded);
   try{Promise.resolve(video.play()).catch(failed);}catch(error){failed(error);}
  });
 }

/** Laptop-only muted media. The compositor is the sole picture sent to output. */
export class FilmTransport {
 constructor(compositor,clips,{mediaHost}={}){this.compositor=compositor;this.clips=clips;this.active=null;this.videos=[document.createElement('video'),document.createElement('video')];this.disposed=false;for(const v of this.videos){v.muted=true;v.playsInline=true;v.preload='auto';v.setAttribute('aria-hidden','true');v.className='source-preview';v.title='Muted film preview';mediaHost?.append(v);}compositor.add({id:'character',source:()=>this.active,kind:'character'});}
 frame(video){return waitForFilmFrame(video);}
 async prepare(id){const clip=this.clips.find(c=>c.id===id);if(!clip)throw Error('Unknown cue');const video=this.videos.find(v=>v!==this.active);video.pause();video.muted=true;video.loop=!!clip.loop;video.src=clip.src;video.load();await this.frame(video);video.pause();return{id,clip,video,dispose:()=>{if(video!==this.active){video.pause();video.removeAttribute('src');video.load();}}};}
 async activate(prepared,live){const previous=this.active;await this.frame(prepared.video);if(!live())return;this.active=prepared.video;this.active.dataset.cue=prepared.id;this.compositor.reveal();if(previous&&previous!==this.active){previous.pause();previous.removeAttribute('src');previous.load();}}
 fade(target,ms,live){const start=this.compositor.level,at=performance.now();return new Promise(resolve=>{const tick=now=>{if(!live()){resolve();return;}const t=Math.min(1,(now-at)/Math.max(1,ms)),ease=t*t*(3-2*t);this.compositor.setLevel(start+(target-start)*ease);if(t<1)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});}
 hold(ms,live){const at=performance.now();return new Promise(resolve=>{const tick=now=>{if(!live()||now-at>=ms)resolve();else requestAnimationFrame(tick);};requestAnimationFrame(tick);});}
 blackout(){this.active=null;this.compositor.setLevel(0);this.compositor.blackout();for(const v of this.videos){v.pause();v.muted=true;}}
 dispose(){this.blackout();this.disposed=true;for(const v of this.videos){v.removeAttribute('src');v.load();v.remove();}}
}
