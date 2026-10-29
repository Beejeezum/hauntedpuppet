/** Cue preparation and planned fade-through-black; this is not an anatomical morph. */
export class CueDirector {
 constructor(transport,{fadeMs=700,blackMs=500,onState=()=>{}}={}){this.transport=transport;this.fadeMs=fadeMs;this.blackMs=blackMs;this.onState=onState;this.current=null;this.queued=null;this.phase='stopped';this.epoch=0;this.running=null;this.disposed=false;}
 inspect(){return{current:this.current,queued:this.queued,phase:this.phase,disposed:this.disposed,error:this.lastError||null};}
 emit(phase){this.phase=phase;this.onState(this.inspect());}
 request(id){if(this.disposed)throw Error('Director disposed');const superseded=this.queued&&this.queued!==id;this.queued=id;if(superseded&&this.running&&this.phase==='preparing')this.transport.cancelPreparation?.();if(!this.running||this.runningEpoch!==this.epoch){const epoch=this.epoch;let job;job=Promise.resolve().then(()=>this.pump(epoch)).finally(()=>{if(this.running!==job)return;this.running=null;this.runningEpoch=null;if(this.queued&&!this.disposed)return this.request(this.queued);});this.runningEpoch=epoch;this.running=job;}return this.running;}
 async pump(epoch){
  const live=()=>epoch===this.epoch&&!this.disposed;
  try{this.lastError=null;while(this.queued&&live()){
   let id=this.queued;this.emit('preparing');let prepared;try{prepared=await this.transport.prepare(id);}catch(error){if(error.cancelled&&live()&&this.queued&&id!==this.queued)continue;throw error;}if(!live()){prepared?.dispose?.();return;}
   if(id!==this.queued){prepared?.dispose?.();continue;}
   this.emit('exiting');if(this.transport.exit)await this.transport.exit(this.fadeMs,live,{fadeAfterFinish:true});else await this.transport.fade(0,this.fadeMs,live);if(!live()){prepared?.dispose?.();return;}
   this.emit('empty-stage');if(this.transport.hold)await this.transport.hold(this.blackMs,live);else await new Promise(resolve=>setTimeout(resolve,this.blackMs));if(!live()){prepared?.dispose?.();return;}
   // A changed destination during exit is decoded behind black, never flashed onscreen.
   while(id!==this.queued&&live()){prepared?.dispose?.();id=this.queued;prepared=await this.transport.prepare(id);}
   if(!live()){prepared?.dispose?.();return;}
   await this.transport.activate(prepared,live);if(!live()){prepared?.dispose?.();return;}this.current=id;if(this.queued===id)this.queued=null;if(this.queued)continue;this.emit('entering');await this.transport.fade(1,this.fadeMs,live);if(live())this.emit('playing');
  }}catch(error){if(live()){this.lastError=String(error.message||'Film unavailable').slice(0,160);this.stop();this.emit('unavailable');}}
 }
 stop(){this.epoch++;this.queued=null;this.current=null;this.transport.blackout();this.emit('stopped');}
 dispose(){this.stop();this.disposed=true;this.transport.dispose?.();}
}
