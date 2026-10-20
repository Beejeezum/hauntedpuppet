/** Whole authored films only. No face overlays, interpolation or body-piece compositing. */
export class WholeFilmPlayer {
 constructor(videos,{onState=()=>{}}={}){this.videos=videos;this.onState=onState;this.epoch=0;this.active=null;this.pending=null;this.disposed=false;this.state='stopped';this.sound=false;this.handoffs=[];this.endedAt=null;this.listeners=[];for(const video of videos){video.muted=true;video.playsInline=true;video.style.opacity='0';const ended=()=>{if(video===this.active&&this.state==='speaking'){this.endedAt=performance.now();this.playIdle();}};const failed=()=>{if(video===this.active){this.stop();this.emit('unavailable');}};video.addEventListener('ended',ended);video.addEventListener('error',failed);this.listeners.push([video,'ended',ended],[video,'error',failed]);}}
 inspect(){return {state:this.state,pending:!!this.pending,epoch:this.epoch,sound:this.sound,active:this.active?.dataset.kind||null,disposed:this.disposed,handoffs:[...this.handoffs]};}
 emit(state){this.state=state;this.onState(this.inspect());}
 configure({speech,idle}){this.sources={speech,idle};this.videos.forEach((v,i)=>{v.preload='auto';v.src=i?idle:speech;v.load();});}
 setSound(enabled){this.sound=!!enabled;if(this.active)this.active.muted=!this.sound||this.state!=='speaking';}
 async switchTo(kind){if(this.disposed)return false;if(!this.sources?.[kind])throw Error('Missing film source');const ticket=++this.epoch;this.pending?.cancel();const next=this.videos.find(v=>v!==this.active)||this.videos[0];next.pause();next.muted=true;next.loop=kind==='idle';next.dataset.kind=kind;if(next.getAttribute('src')!==this.sources[kind]){next.src=this.sources[kind];next.load();}else next.currentTime=0;this.emit(kind==='speech'?'preparing-speech':'preparing-idle');let timer,callback,settled=false,resolveReady,rejectReady;
  const cleanup=()=>{clearTimeout(timer);if(callback!==undefined)next.cancelVideoFrameCallback?.(callback);next.removeEventListener('error',failed);next.removeEventListener('playing',ready);};
  const ready=()=>{if(settled)return;settled=true;cleanup();resolveReady();};
  const failed=()=>{if(settled)return;settled=true;cleanup();rejectReady(Error('Film decode unavailable'));};
  const pending={cancel:failed};this.pending=pending;
  const decoded=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;timer=setTimeout(failed,5000);next.addEventListener('error',failed,{once:true});if(next.requestVideoFrameCallback)callback=next.requestVideoFrameCallback(ready);else next.addEventListener('playing',ready,{once:true});});
  try{await Promise.all([decoded,next.play()]);}catch{pending.cancel();if(ticket===this.epoch){this.stop();this.emit('unavailable');}return false;}
  if(ticket!==this.epoch||this.disposed)return false;this.pending=null;const previous=this.active;next.style.opacity='1';this.active=next;if(previous&&previous!==next){previous.style.opacity='0';previous.pause();previous.muted=true;}if(kind==='idle'&&this.endedAt!==null){this.handoffs.push(Math.round(performance.now()-this.endedAt));if(this.handoffs.length>32)this.handoffs.shift();this.endedAt=null;}this.emit(kind==='speech'?'speaking':'idle');next.muted=!(this.sound&&kind==='speech');return true;
 }
 playSpeech(){return this.switchTo('speech');}
 playIdle(){return this.switchTo('idle');}
 stop(){++this.epoch;this.pending?.cancel();this.pending=null;this.active=null;this.endedAt=null;this.sound=false;for(const video of this.videos){video.pause();video.muted=true;video.style.opacity='0';video.removeAttribute('src');video.load();}this.emit('stopped');}
 dispose(){this.stop();this.disposed=true;for(const [video,event,listener]of this.listeners)video.removeEventListener(event,listener);this.listeners=[];}
}
