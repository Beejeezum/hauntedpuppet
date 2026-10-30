import {FiniteCueStudy} from './single-movie-study/finite-cues/finite-player.mjs';

/** Private resident-clock prototype; no public/default app binding.
 * Each queued action is appended between full idle iterations, followed by idle.
 * One native source, no seeks/HTML looping/fades, bounded retained media/cache.
 * Source descriptors and reviewed joins must come from the real delivery gate.
 */
export class ResidentActionPlayer {
 constructor(video,{idle,actions=[],joins=[],allowStudy=false,onState=()=>{}}){
  const validate=cue=>{
   if(!cue||typeof cue.id!=='string'||!Number.isInteger(cue.frames)||cue.fps!==24||cue.frames<1||cue.frames>360)throw Error('Invalid resident segment');
   if(cue.status!=='approved'&&!(allowStudy&&cue.status==='study'))throw Error('Unapproved resident segment');
   if(cue.status==='approved'&&(!cue.residentReviewEvidence||!/^[a-f0-9]{64}$/.test(cue.sha256||'')))throw Error('Missing resident motion review or media hash');
  };
  validate(idle);if(idle.entryPort!==idle.exitPort||!['friendly-rest','scary-rest'].includes(idle.entryPort))throw Error('Resident idle ports required');
  if(idle.status==='approved'&&!idle.loopReviewEvidence)throw Error('Missing living loop review');
  for(const action of actions){validate(action);if(action.entryPort!==idle.exitPort||action.exitPort!==idle.entryPort)throw Error('Action must return to this idle');}
  const requireJoin=(from,to)=>{
   if(allowStudy&&(from.status==='study'||to.status==='study'))return;
   if(!joins.some(join=>join.status==='approved'&&join.from===from.id&&join.to===to.id&&join.fromSha256===from.sha256&&join.toSha256===to.sha256&&typeof join.reviewEvidence==='string'&&join.reviewEvidence.trim()))throw Error('Missing exact-media resident join: '+from.id+' -> '+to.id);
  };
  requireJoin(idle,idle);for(const action of actions){requireJoin(idle,action);requireJoin(action,idle);}
  if(new Set([idle.id,...actions.map(a=>a.id)]).size!==actions.length+1)throw Error('Duplicate resident segment');
  this.video=video;video.muted=true;video.playsInline=true;video.loop=false;
  this.idle=idle;this.actions=new Map(actions.map(a=>[a.id,a]));this.onState=onState;
  this.timeline=new FiniteCueStudy(video,{retentionSeconds:20,cacheBudgetBytes:16*1024*1024});
  this.epoch=0;this.running=false;this.busy=false;this.pending=null;this.timer=null;this.disposed=false;this.error=null;this.commits=0;
 }
 emit(){this.onState(this.inspect());}
 async start(){
  if(this.disposed)throw Error('Resident player disposed');this.stop();this.error=null;this.running=true;const epoch=this.epoch;
  try{
   await this.timeline.prepare([this.idle],{open:true});if(epoch!==this.epoch)return false;
   await this.timeline.play();if(epoch!==this.epoch)return false;
   this.timer=setInterval(()=>this.pump(),150);this.emit();return true;
  }catch(error){if(epoch!==this.epoch)return false;this.stop();this.error=error.message;this.emit();throw error;}
 }
 request(id){
  if(this.disposed||!this.running)throw Error('Start the resident character first');
  if(!this.actions.has(id))throw Error('Resident action unavailable');
  this.pending=id;this.emit();return{queued:id,policy:'Next available idle boundary; latest uncommitted request wins'};
 }
 async pump(){
  if(this.disposed||!this.running||this.busy||this.timeline.duration-this.video.currentTime>2)return;
  const epoch=this.epoch,id=this.pending;this.pending=null;this.busy=true;
  try{
   await this.timeline.append(id?[this.actions.get(id),this.idle]:[this.idle]);
   if(epoch===this.epoch){this.commits++;this.emit();}
  }catch(error){if(epoch===this.epoch){this.stop();this.error=error.message;this.emit();}}
  finally{if(epoch===this.epoch)this.busy=false;}
 }
 inspect(){
  const timeline=this.timeline.snapshot(),time=this.video.currentTime;
  return{running:this.running,disposed:this.disposed,error:this.error,pending:this.pending,busy:this.busy,commits:this.commits,
   current:timeline.windows.find(w=>time>=w.start&&time<w.end)?.id??null,time,timeline};
 }
 stop(){this.epoch++;clearInterval(this.timer);this.timer=null;this.running=false;this.pending=null;this.busy=false;this.timeline.stop();this.emit();}
 dispose(){if(this.disposed)return;this.stop();this.disposed=true;this.timeline.dispose();}
}
