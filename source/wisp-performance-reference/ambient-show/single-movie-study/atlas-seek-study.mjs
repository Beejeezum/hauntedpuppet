/** Source-only decoder experiment. Deliberate seeks are NOT approved animation routes. */
export class AtlasSeekStudy {
 constructor(compositor,{src,fps,frames,windows,mediaHost,frameClock,timeoutMs=6000}){
  if(!src||!Number.isFinite(fps)||fps<=0||!Number.isInteger(frames)||frames<1||!Array.isArray(windows)||!windows.length)throw Error('Invalid atlas study');
  const ids=new Set();for(const w of windows){if(typeof w.id!=='string'||ids.has(w.id)||!Number.isInteger(w.firstFrame)||!Number.isInteger(w.frameCount)||w.firstFrame<0||w.frameCount<1||w.firstFrame+w.frameCount>frames)throw Error('Invalid atlas window');ids.add(w.id);}
  Object.assign(this,{compositor,src,fps,frames,windows,frameClock,timeoutMs});this.video=document.createElement('video');this.video.muted=true;this.video.playsInline=true;this.video.preload='auto';this.video.className='decoder';this.video.setAttribute('aria-label','Single native decoder study');mediaHost.append(this.video);this.held=document.createElement('canvas');this.held.width=1280;this.held.height=720;this.phase='unloaded';this.epoch=0;this.sourceLoads=0;this.disposed=false;this.ready=false;this.current=null;this.pending=null;this.holding=false;this.soundEnabled=false;this.soundLevel=.5;this.metrics=[];
  compositor.add({id:'character',source:()=>this.holding?this.held:this.current&&!this.disposed?this.video:null,kind:'character'});
 }
 request(fn){return this.frameClock?this.frameClock.request(fn):requestAnimationFrame(fn);}
 cancel(id){if(this.frameClock)this.frameClock.cancel(id);else cancelAnimationFrame(id);}
 wait(predicate,signal,start=()=>{}){
  return new Promise((resolve,reject)=>{let frame,timer,settled=false;const events=['seeked','loadeddata','canplay','playing','timeupdate'];const cleanup=()=>{clearTimeout(timer);if(frame!==undefined)this.cancel(frame);for(const e of events)this.video.removeEventListener(e,check);this.video.removeEventListener('error',failed);signal?.removeEventListener('abort',aborted);};const finish=error=>{if(settled)return;settled=true;cleanup();error?reject(error):resolve();};const failed=e=>finish(e instanceof Error?e:Error('Atlas native media unavailable'));const aborted=()=>finish(Object.assign(Error('Atlas action cancelled'),{cancelled:true}));const check=()=>{if(!settled&&predicate())finish();};const poll=()=>{check();if(!settled)frame=this.request(poll);};if(signal?.aborted){aborted();return;}for(const e of events)this.video.addEventListener(e,check);this.video.addEventListener('error',failed);signal?.addEventListener('abort',aborted,{once:true});timer=setTimeout(()=>failed(Error('Atlas media readiness deadline')),this.timeoutMs);try{Promise.resolve(start()).catch(failed);check();if(!settled)frame=this.request(poll);}catch(error){failed(error);}});
 }
 async load(){
  if(this.disposed||this.phase!=='unloaded')throw Error('Atlas can load only once');this.phase='loading';const controller=new AbortController();this.pending=controller;const epoch=++this.epoch;
  try{this.sourceLoads++;this.video.src=this.src;this.video.load();await this.wait(()=>!this.video.paused&&this.video.readyState>=3&&this.video.currentTime>1/this.fps,controller.signal,()=>this.video.play());if(this.epoch!==epoch||this.disposed)throw Object.assign(Error('Atlas load cancelled'),{cancelled:true});this.video.pause();this.ready=true;this.phase='ready';}catch(error){if(epoch===this.epoch){this.phase='failed';this.compositor.blackout();}throw error;}
 }
 snapshot(){if(!this.current||this.video.readyState<2)return;const c=this.held.getContext('2d');c.drawImage(this.video,0,0,this.held.width,this.held.height);c.putImageData(c.getImageData(0,0,this.held.width,this.held.height),0,0);this.holding=true;}
 syncSound(){this.video.volume=this.soundLevel;this.video.muted=!this.soundEnabled||this.holding||!this.current||this.compositor.black||this.compositor.suspended||this.disposed;}
 setSound(enabled,level=this.soundLevel){if(typeof enabled!=='boolean'||!Number.isFinite(level)||level<0||level>1)throw Error('Invalid atlas sound');this.soundEnabled=enabled&&!this.disposed;this.soundLevel=level;this.syncSound();}
 async seek(id,{play=false}={}){
  const cue=this.windows.find(w=>w.id===id);if(!cue||!this.ready||this.disposed)throw Error('Atlas cue unavailable');this.pending?.abort();const controller=new AbortController(),epoch=++this.epoch;this.pending=controller;const live=()=>epoch===this.epoch&&!this.disposed,check=()=>{if(!live())throw Object.assign(Error('Atlas seek cancelled'),{cancelled:true});};const at=performance.now(),target=(cue.firstFrame+.5)/this.fps;this.snapshot();this.phase='seeking';this.video.muted=true;
  try{
   // Seek inside the exact target frame, avoiding ambiguous frame-edge rounding.
   // Leave any canvas presentation task before touching the native media clock.
   await new Promise(r=>setTimeout(r,0));check();this.video.pause();await this.wait(()=>!this.video.seeking&&this.video.readyState>=2&&Math.abs(this.video.currentTime-target)<.0001,controller.signal,()=>{if(Math.abs(this.video.currentTime-target)>.000001||this.video.seeking)this.video.currentTime=target;});check();await new Promise(r=>setTimeout(r,0));check();
   // Two output/owner pulses allow a paused seek's decoded picture to present.
   await this.waitPulses(2,controller.signal);check();this.current=cue;this.holding=false;this.phase='paused';this.compositor.setLevel(1);this.compositor.reveal();this.syncSound();this.compositor.render();const firstPictureMs=performance.now()-at;if(play)await this.play();check();const metric={cue:id,targetSeconds:target,firstPictureMs,totalReadyMs:performance.now()-at,playing:play};this.metrics.push(metric);return metric;
  }catch(error){if(live()){this.phase='failed';this.current=null;this.holding=false;this.video.muted=true;this.compositor.blackout();}throw error;}
 }
 waitPulses(count,signal){return new Promise((resolve,reject)=>{
  let frame,timer,settled=false;
  const finish=error=>{if(settled)return;settled=true;clearTimeout(timer);if(frame!==undefined)this.cancel(frame);signal?.removeEventListener('abort',abort);error?reject(error):resolve();};
  const abort=()=>finish(Object.assign(Error('Atlas paint cancelled'),{cancelled:true}));
  const next=()=>{if(settled)return;if(--count<=0)finish();else frame=this.request(next);};
  if(signal?.aborted){abort();return;}
  signal?.addEventListener('abort',abort,{once:true});
  // Both owner and output may stop producing frames. This wait must still settle.
  timer=setTimeout(()=>finish(Error('Atlas paint readiness deadline')),this.timeoutMs);
  try{frame=this.request(next);}catch(error){finish(error);}
 });}
 async play(){if(!this.current||this.disposed)throw Error('Choose an atlas cue');const epoch=this.epoch,at=this.video.currentTime;this.phase='playing';this.syncSound();await this.wait(()=>!this.video.paused&&this.video.readyState>=3&&this.video.currentTime-at>=1/this.fps,this.pending?.signal,()=>this.video.play());if(this.epoch!==epoch||this.disposed)throw Object.assign(Error('Atlas play cancelled'),{cancelled:true});}
 stop(){this.epoch++;this.pending?.abort();this.pending=null;this.soundEnabled=false;this.current=null;this.holding=false;this.phase='stopped';this.video.muted=true;this.compositor.setLevel(0);this.compositor.blackout();const epoch=this.epoch;setTimeout(()=>{if(this.epoch===epoch&&!this.disposed)this.video.pause();},0);}
 inspect(){return{phase:this.phase,current:this.current?.id||null,sourceLoads:this.sourceLoads,currentTime:this.video.currentTime,seeking:this.video.seeking,paused:this.video.paused,muted:this.video.muted,ready:this.ready,disposed:this.disposed,metrics:this.metrics.map(m=>({...m}))};}
 dispose(){if(this.disposed)return;this.stop();this.disposed=true;this.phase='closed';this.video.pause();this.video.removeAttribute('src');this.video.load();this.video.remove();this.held.width=this.held.height=1;}
}
