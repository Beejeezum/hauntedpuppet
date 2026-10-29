/** Original study-film ambience around phone speech. Does not grant cue/loop approval. */
export class DirectorAmbientProgram {
 constructor(transport,clips,{onState=()=>{}}={}){
  if(!transport||!Array.isArray(clips)||!['friendly','scary'].every(character=>clips.some(c=>c.character===character)))throw Error('Missing ambient character films');
  Object.assign(this,{transport,clips,onState});this.mode='friendly';this.seconds=15;this.character='friendly';this.visibleSeconds=0;this.suspended=true;this.disposed=false;this.epoch=0;this.running=null;this.nextCharacter=null;this.lastVideo=null;this.lastTime=0;
 }
 inspect(){return{mode:this.mode,seconds:this.seconds,character:this.character,visibleSeconds:this.visibleSeconds,suspended:this.suspended,transitioning:!!this.running,disposed:this.disposed,error:this.error||null};}
 emit(){try{this.onState(this.inspect());}catch{/* UI cannot own playback. */}}
 configure({mode=this.mode,seconds=this.seconds}={}){
  if(this.disposed||!['friendly','scary','alternate','mostly-scary'].includes(mode)||!Number.isInteger(seconds)||seconds<5||seconds>120)throw Error('Choose a between-lines mode and 5–120 seconds');
  if(mode!==this.mode){this.nextCharacter=['scary','mostly-scary'].includes(mode)?'scary':'friendly';this.visibleSeconds=0;}this.mode=mode;this.seconds=seconds;this.emit();
 }
 suspend(){this.epoch++;this.suspended=true;this.running=null;this.lastVideo=null;this.transport.cancelPreparation();this.emit();}
 stop(){this.suspend();this.transport.blackout();}
 resume({live=()=>true}={}){
  if(this.disposed||!live())return Promise.resolve();this.suspend();this.suspended=false;this.error=null;this.emit();const character=this.nextCharacter||this.character;this.nextCharacter=null;return this.show(character,live);
 }
 show(character,parentLive=()=>true){
  const epoch=this.epoch,live=()=>!this.disposed&&!this.suspended&&this.epoch===epoch&&parentLive(),clip=this.clips.find(c=>c.character===character);
  const video=this.transport.active;
  if(clip.loop&&video?.dataset.cue===clip.id&&video.loop&&!video.paused&&!this.transport.compositor.black){if(character!==this.character)this.visibleSeconds=0;this.character=character;this.lastVideo=video;this.lastTime=video.currentTime;this.emit();return Promise.resolve();}
  let job;job=Promise.resolve().then(async()=>{let prepared;try{
   if(!live())return;prepared=await this.transport.prepare(clip.id);if(!live())return;
   if(this.transport.active){await this.transport.exit(0,live,{keepPicture:true});if(!live())return;await this.transport.fade(0,550,live);if(!live())return;}
   this.transport.stageForTransition(false);await this.transport.hold(500,live);if(!live())return;
   await this.transport.activate(prepared,live);if(!live())return;await this.transport.fade(1,550,live);if(!live())return;
   if(character!==this.character)this.visibleSeconds=0;this.character=character;this.lastVideo=this.transport.active;this.lastTime=this.lastVideo?.currentTime||0;
  }catch(error){if(!live())return;this.error=error.message;this.suspended=true;this.transport.blackout();throw error;
  }finally{prepared?.dispose?.();if(this.running===job){this.running=null;this.emit();}}});this.running=job;return job;
 }
 tick(){
  if(this.disposed||this.suspended||this.running)return;if(this.nextCharacter){const next=this.nextCharacter;this.nextCharacter=null;this.show(next).catch(()=>{});return;}const video=this.transport.active,clip=this.clips.find(c=>c.character===this.character);
  if(!video||video.dataset.cue!==clip.id||video.paused&&!video.ended||this.transport.compositor.black)return;
  if(video!==this.lastVideo){this.lastVideo=video;this.lastTime=video.currentTime;}else{let delta=video.currentTime-this.lastTime;if(delta<0&&video.loop&&Number.isFinite(video.duration))delta+=video.duration;if(delta>0)this.visibleSeconds+=Math.min(delta,.25);this.lastTime=video.currentTime;}
  const limit=this.seconds*(this.mode==='mostly-scary'?(this.character==='scary'?3:.5):1),due=this.visibleSeconds>=limit,closing=!video.loop&&(video.ended||Number.isFinite(video.duration)&&video.currentTime>=video.duration-.65);
  if(!due&&!closing)return;let next=this.character;if(due&&['alternate','mostly-scary'].includes(this.mode))next=this.character==='friendly'?'scary':'friendly';
  if(next===this.character&&video.loop){if(due)this.visibleSeconds=0;return;}
  this.show(next).catch(()=>{/* Error remains visible and stage stays black. */});
 }
 dispose(){if(this.disposed)return;this.suspend();this.disposed=true;}
}
