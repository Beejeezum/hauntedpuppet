/** Laptop-only coordinator. Adapters own authored film, speech and ambient transport. */
export class PhonePerformanceDirector {
 constructor({animations,prepareSpeech,prepareFilm,enter,play,returnAmbient,stop,onState=()=>{},capacity=4}){
  if(!Array.isArray(animations)||!animations.length||!Number.isInteger(capacity)||capacity<1||capacity>8)throw Error('Invalid director configuration');
  Object.assign(this,{animations,prepareSpeech,prepareFilm,enter,play,returnAmbient,stopOutput:stop,onState,capacity});
  this.queue=[];this.epoch=0;this.active=null;this.disposed=false;this.phase='idle';
 }
 inspect(){return{phase:this.phase,queued:this.queue.length,character:this.active?.value.character||null,animation:this.active?.value.animation||null,disposed:this.disposed};}
 emit(phase){this.phase=phase;try{this.onState(this.inspect());}catch{/* Status UI cannot own playback. */}}
 request(value){
  const clip=this.animations.find(c=>c.id===value?.animation&&c.character===value?.character);
  if(this.disposed)return Promise.reject(Error('Director closed'));
  if(!clip||!value||Object.keys(value).sort().join(',')!=='animation,character,mode,text'||typeof value.text!=='string'||![...value.text].length||[...value.text].length>400||!value.text.trim()||/[\u0000-\u0008\u000b-\u001f]/.test(value.text)||!['exact','prompt'].includes(value.mode))return Promise.reject(Error('Choose an available character animation and a message up to 400 characters'));
  if(this.queue.length>=this.capacity)return Promise.reject(Error('Performance queue is full'));
  const promise=new Promise((resolve,reject)=>this.queue.push({value:{...value},clip,resolve,reject}));
  this.pump();return promise;
 }
 async pump(){
  if(this.active||this.disposed||!this.queue.length)return;
  const job=this.queue.shift(),epoch=this.epoch,controller=new AbortController();this.active=job;job.controller=controller;
  const live=()=>!this.disposed&&epoch===this.epoch&&this.active===job;
  const cancelled=()=>Object.assign(Error('Performance cancelled'),{cancelled:true});
  const check=()=>{if(!live())throw cancelled();};
  const resources=[];
  // Even an adapter that ignores AbortSignal must release a late resource.
  const acquire=async task=>{const resource=await task();if(!live()){resource?.dispose?.();throw cancelled();}resources.push(resource);return resource;};
  const context={signal:controller.signal,live};
  try{
   this.emit('preparing');
   const speech=await acquire(()=>this.prepareSpeech(job.value,context));check();
   const film=await acquire(()=>this.prepareFilm(job.clip,context));check();
   this.emit('transitioning');await this.enter(film,context);check();
   this.emit('playing');await this.play({speech,film,value:job.value},context);check();
   this.emit('returning');await this.returnAmbient(context);check();job.resolve({status:'applied'});
  }catch(error){
   if(live()){
    // Failure closes sound/picture before attempting a planned ambient return.
    this.stopOutput();this.emit('failed');
    try{await this.returnAmbient(context);}catch{/* Remain stopped if ambient is unavailable. */}
   }
   job.reject(live()?error:cancelled());
  }finally{
   for(const resource of resources.reverse())try{resource?.dispose?.();}catch{/* Release remaining resources. */}
   if(this.active===job){this.active=null;if(!this.disposed)this.emit(this.queue.length?'queued':'idle');this.pump();}
  }
 }
 stop(){
  this.epoch++;const error=Object.assign(Error('Performance cancelled'),{cancelled:true});
  for(const job of this.queue.splice(0))job.reject(error);
  const active=this.active;this.active=null;active?.controller.abort();active?.reject(error);
  this.stopOutput();this.emit('stopped');
 }
 dispose(){if(this.disposed)return;this.stop();this.disposed=true;this.emit('closed');}
}
