const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const events={
 spider:[[4,'drift',.55],[15.8,'wake',.45],[20.1,'drift',.6]],
 apparitions:[[.7,'wake',.6],[7,'drift',.45],[14,'drift',.4],[21,'vapor',.7],[35,'wake',.6],[42,'drift',.45]],
 nightGhost:[[.7,'wake',.6],[10,'drift',.45],[20,'drift',.4],[30,'drift',.4],[38,'vapor',.7]]
};

/** Score reads the visible scene clock. Missed beats are skipped, never queued. */
export class AfterDarkSoundScore {
 constructor(){this.reset();}
 reset(){this.last=null;this.key=null;this.eyePlays=[];}
 tick({program,elapsed,night=false,eyes=[]}){
  const period=program==='spider'?36:program==='apparitions'&&!night?56:Infinity;
  const cycle=Math.floor(elapsed/period)||0,t=elapsed%period,key=`${program}:${night}:${cycle}`;
  if(this.last===null||this.key!==key||t<this.last){this.key=key;this.last=t;this.eyePlays=eyes.map(s=>s.plays);return [];}
  const from=this.last;this.last=t;const result=[];
  if(program==='eyes')for(const [i,s] of eyes.entries()){
   if(s.plays!==this.eyePlays[i]&&s.active){this.eyePlays[i]=s.plays;if(s.plays%2&&s.time<.3)result.push({cue:'wake',gain:.35,pan:clamp((s.x-640)/800,-.35,.35)});}
  }
  else for(const [at,cue,gain] of events[program==='apparitions'&&night?'nightGhost':program]||[]){if(from<at&&t>=at&&t-at<.25)result.push({cue,gain,pan:0});}
  return result;
 }
}

/** Explicit laptop gesture unlocks one small shared audio palette. Remotes never mount it. */
export class AfterDarkSound {
 constructor({onChange=()=>{}}={}){this.onChange=onChange;this.score=new AfterDarkSoundScore();this.sources=new Set();this.enabled=false;this.loading=false;this.disposed=false;this.epoch=0;this.volume=.5;this.played=0;this.error=null;}
 emit(){this.onChange(this.inspect());}
 async enable(){
  if(this.disposed||this.loading)return false;const own=++this.epoch;this.loading=true;this.error=null;this.emit();
  try{
   // Create/resume synchronously from the button gesture, before fetching artwork.
   if(!this.context){this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=0;this.master.connect(this.context.destination);}
   await this.context.resume();if(own!==this.epoch||this.disposed)return false;
   if(this.context.state!=='running')throw Error('Sound is paused by the browser. Tap Effects again.');
   if(!this.buffer){
    const controller=this.controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
    try{
     const meta=await fetch('./media/dry-air-palette.json',{signal:controller.signal});if(!meta.ok)throw Error('Dry effects are unavailable. The picture can keep playing.');
     const manifest=await meta.json();
     if(manifest.schema!==1||manifest.url!=='./media/dry-air-palette.mp4'||!Number.isInteger(manifest.bytes)||manifest.bytes>200000||!/^[a-f0-9]{64}$/.test(manifest.sha256))throw Error('Sound package is invalid.');
     const response=await fetch(manifest.url,{signal:controller.signal});if(!response.ok)throw Error('Dry effects could not load.');const bytes=await response.arrayBuffer();
     const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
     if(bytes.byteLength!==manifest.bytes||hash!==manifest.sha256)throw Error('Dry effects changed. Refresh before playing sound.');
     const buffer=await this.context.decodeAudioData(bytes);
     if(controller.signal.aborted)throw new DOMException('Effects load cancelled','AbortError');
     if(buffer.duration>5||buffer.numberOfChannels!==2)throw Error('Sound package is outside its limits.');
     for(const id of ['wake','drift','vapor']){const cue=manifest.cues?.[id];if(!cue||!Number.isFinite(cue.offset)||!Number.isFinite(cue.duration)||cue.offset<0||cue.duration<=0||cue.duration>1.5||cue.offset+cue.duration>buffer.duration)throw Error('Sound cue is invalid.');}
     if(own!==this.epoch||this.disposed)return false;this.buffer=buffer;this.cues=manifest.cues;
    }finally{clearTimeout(timer);if(this.controller===controller)this.controller=null;}
   }
   if(own!==this.epoch||this.disposed)return false;this.score.reset();this.enabled=true;this.loading=false;this.emit();return true;
  }catch(error){if(own===this.epoch&&!this.disposed){this.clear({disable:true});this.error=error.name==='AbortError'?'Effects took too long to load. The picture can keep playing.':error.message;this.emit();}return false;}
 }
 setVolume(value){if(Number.isFinite(value))this.volume=clamp(value,0,.8);}
 tick(state,opacity=1){
  if(!this.enabled||this.disposed)return;
  if(this.context.state!=='running'){this.clear({disable:true});this.error='Sound paused. Tap Effects to resume.';this.emit();return;}
  this.master.gain.setTargetAtTime(this.volume*clamp(opacity),this.context.currentTime,.025);
  for(const event of this.score.tick(state))this.play(event);
 }
 play({cue,gain=1,pan=0}){
  if(!this.enabled||!this.buffer||this.sources.size>=3)return;
  const spec=this.cues[cue];if(!spec)return;
  const source=this.context.createBufferSource(),level=this.context.createGain(),position=this.context.createStereoPanner();
  source.buffer=this.buffer;level.gain.value=clamp(gain);position.pan.value=clamp(pan,-.5,.5);source.connect(level).connect(position).connect(this.master);
  const node={source,level,position};this.sources.add(node);
  source.onended=()=>{source.disconnect();level.disconnect();position.disconnect();this.sources.delete(node);};
  source.start(this.context.currentTime+.015,spec.offset,spec.duration);this.played++;
 }
 clear({disable=false}={}){
  this.score.reset();if(this.master){this.master.gain.cancelScheduledValues(this.context.currentTime);this.master.gain.value=0;}
  for(const node of this.sources){node.source.onended=null;try{node.source.stop();}catch{}node.source.disconnect();node.level.disconnect();node.position.disconnect();}this.sources.clear();
  if(disable){this.epoch++;this.controller?.abort();this.enabled=this.loading=false;void this.context?.suspend().catch(()=>{});this.emit();}
 }
 dispose(){this.disposed=true;this.clear({disable:true});this.buffer=null;void this.context?.close().catch(()=>{});}
 inspect(){return{enabled:this.enabled,loading:this.loading,error:this.error,volume:this.volume,active:this.sources.size,played:this.played,decoded:!!this.buffer,context:this.context?.state||'none',disposed:this.disposed};}
}
