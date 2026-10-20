/** Laptop-only muted media. The compositor is the sole picture sent to output. */
export class FilmTransport {
 constructor(compositor,clips){this.compositor=compositor;this.clips=clips;this.active=null;this.videos=[document.createElement('video'),document.createElement('video')];this.disposed=false;for(const v of this.videos){v.muted=true;v.playsInline=true;v.preload='auto';}compositor.add({id:'character',source:()=>this.active,kind:'character'});}
 async frame(video){
  let callback,timer,playing,failed;
  const ready=new Promise((resolve,reject)=>{const cleanup=()=>{clearTimeout(timer);if(callback!==undefined)video.cancelVideoFrameCallback?.(callback);video.removeEventListener('playing',playing);video.removeEventListener('error',failed);};playing=()=>{cleanup();resolve();};failed=()=>{cleanup();reject(Error('Film unavailable'));};timer=setTimeout(failed,6000);video.addEventListener('error',failed,{once:true});if(video.requestVideoFrameCallback)callback=video.requestVideoFrameCallback(playing);else video.addEventListener('playing',playing,{once:true});});
  try{await Promise.all([ready,video.play()]);}catch(error){failed();throw error;}
 }
 async prepare(id){const clip=this.clips.find(c=>c.id===id);if(!clip)throw Error('Unknown cue');const video=this.videos.find(v=>v!==this.active);video.pause();video.muted=true;video.loop=!!clip.loop;video.src=clip.src;video.load();await this.frame(video);video.pause();return{id,clip,video,dispose:()=>{if(video!==this.active){video.pause();video.removeAttribute('src');video.load();}}};}
 async activate(prepared,live){const previous=this.active;await this.frame(prepared.video);if(!live())return;this.active=prepared.video;this.active.dataset.cue=prepared.id;this.compositor.reveal();if(previous&&previous!==this.active){previous.pause();previous.removeAttribute('src');previous.load();}}
 fade(target,ms,live){const start=this.compositor.level,at=performance.now();return new Promise(resolve=>{const tick=now=>{if(!live()){resolve();return;}const t=Math.min(1,(now-at)/Math.max(1,ms)),ease=t*t*(3-2*t);this.compositor.setLevel(start+(target-start)*ease);if(t<1)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});}
 hold(ms,live){const at=performance.now();return new Promise(resolve=>{const tick=now=>{if(!live()||now-at>=ms)resolve();else requestAnimationFrame(tick);};requestAnimationFrame(tick);});}
 blackout(){this.active=null;this.compositor.setLevel(0);this.compositor.blackout();for(const v of this.videos){v.pause();v.muted=true;}}
 dispose(){this.blackout();this.disposed=true;for(const v of this.videos){v.removeAttribute('src');v.load();}}
}
