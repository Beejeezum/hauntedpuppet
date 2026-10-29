/** Executes only routes emitted by the approval compiler; it never invents a seam. */
export class CatalogCueDirector {
 constructor(transport,library,{fadeMs=700,blackMs=500,onState=()=>{}}={}){
  if(library?.schema!==1||!Array.isArray(library.clips)||!Array.isArray(library.routes))throw Error('Invalid playback catalog');
  if(!Number.isFinite(fadeMs)||fadeMs<0||!Number.isFinite(blackMs)||blackMs<0)throw Error('Invalid transition timing');
  this.transport=transport;this.clips=new Map(library.clips.map(c=>[c.id,c]));this.routes=new Map();
  if(this.clips.size!==library.clips.length)throw Error('Duplicate catalog cue');
  for(const route of library.routes){const key=route.from+'>'+route.to;if(!this.clips.has(route.from)||!this.clips.has(route.to)||this.routes.has(key)||!['empty-stage','reviewed-cut','authored-bridge'].includes(route.kind))throw Error('Invalid catalog route');this.routes.set(key,route);}
  this.fadeMs=fadeMs;this.blackMs=Math.max(500,blackMs);this.onState=onState;this.current=null;this.queued=null;this.phase='stopped';this.epoch=0;this.running=null;this.disposed=false;
 }
 inspect(){return{current:this.current,queued:this.queued,phase:this.phase,disposed:this.disposed,error:this.lastError||null};}
 emit(phase){this.phase=phase;this.onState(this.inspect());}
 resolve(from,target){
  if(!this.clips.has(target))throw Error('Unknown approved cue');
  if(!from)return{id:target,seam:{kind:'empty-stage',minimumBlackMs:500}};
  const route=this.routes.get(from+'>'+target);if(!route)throw Error('No approved transition: '+from+' → '+target);
  if(route.kind!=='authored-bridge')return{id:target,seam:route};
  const sequence=route.sequence||[route.bridge];
  if(!Array.isArray(sequence)||!sequence.length||sequence[0]!==route.bridge||new Set(sequence).size!==sequence.length||sequence.some(id=>id===from||id===target))throw Error('Invalid authored bridge');
  const path=[from,...sequence,target];
  for(const id of sequence){const clip=this.clips.get(id);if(!clip||clip.manualOnly||!(clip.form==='transition'||clip.bridgeEligible))throw Error('Invalid authored bridge');}
  for(let i=0;i<path.length-1;i++){const edge=this.routes.get(path[i]+'>'+path[i+1]);if(!edge||!['empty-stage','reviewed-cut'].includes(edge.kind))throw Error('Invalid authored bridge');}
  return{id:route.bridge,seam:this.routes.get(from+'>'+route.bridge)};
 }
 request(id){
  if(this.disposed)throw Error('Director disposed');this.resolve(this.current,id);this.lastError=null;
  const superseded=this.queued&&this.queued!==id;this.queued=id;
  if(superseded&&this.running&&this.phase==='preparing')this.transport.cancelPreparation?.();
  if(!this.running||this.runningEpoch!==this.epoch){
   const epoch=this.epoch;let job;
   // Assign ownership before callbacks can request another cue synchronously.
   job=Promise.resolve().then(()=>this.pump(epoch)).finally(()=>{
    if(this.running!==job)return;
    this.running=null;this.runningEpoch=null;
    // Adopt requests queued at the completion boundary before acknowledging.
    if(this.queued&&!this.disposed)return this.request(this.queued);
   });
   this.runningEpoch=epoch;this.running=job;
  }
  return this.running;
 }
 async pump(epoch){
  const live=()=>epoch===this.epoch&&!this.disposed;
  try{while(this.queued&&live()){
   let target=this.queued,step=this.resolve(this.current,target),prepared;
   this.emit('preparing');
   try{prepared=await this.transport.prepare(step.id);}catch(error){if(error.cancelled&&live()&&this.queued!==target)continue;throw error;}
   if(!live()){prepared?.dispose?.();return;}if(this.queued!==target){prepared?.dispose?.();continue;}
   this.emit('exiting');await this.transport.exit(this.fadeMs,live,{keepPicture:step.seam.kind==='reviewed-cut'});
   if(!live()){prepared?.dispose?.();return;}
   // The outgoing performance is complete. Replan a changed request from that
   // exact held endpoint, rather than flashing the stale prepared destination.
   while(this.queued!==target&&live()){
    prepared?.dispose?.();target=this.queued;step=this.resolve(this.current,target);
    prepared=await this.transport.prepare(step.id);
   }
   if(!live()){prepared?.dispose?.();return;}
   const cut=step.seam.kind==='reviewed-cut';
   if(!cut){this.transport.stageForTransition?.(false);this.emit('empty-stage');await this.transport.hold(Math.max(this.blackMs,step.seam.minimumBlackMs||0),live);}
   if(!live()){prepared?.dispose?.();return;}
   // A destination changed during the black hold must be planned again.
   if(this.queued!==target){prepared?.dispose?.();continue;}
   if(cut)this.transport.stageForTransition?.(true);
   await this.transport.activate(prepared,()=>live()&&this.queued===target);if(!live()){prepared?.dispose?.();return;}if(this.queued!==target){prepared?.dispose?.();continue;}
   this.current=step.id;if(this.queued===step.id)this.queued=null;
   if(this.queued){this.emit('bridging');if(!cut)await this.transport.fade(1,this.fadeMs,live);if(!live())return;continue;}
   this.emit('entering');if(!cut)await this.transport.fade(1,this.fadeMs,live);if(live())this.emit('playing');
  }}catch(error){if(live()){this.lastError=error.message;this.stop();this.emit('unavailable');}}
 }
 stop(){this.epoch++;this.queued=null;this.current=null;this.transport.blackout();this.emit('stopped');}
 dispose(){this.stop();this.disposed=true;this.transport.dispose?.();}
}
