/** Laptop-only effect playback. Nothing is created or audible until explicit enable. */
export class OwnerSound {
 constructor(){this.context=null;this.master=null;this.buffers=new Map();this.voices=new Set();this.epoch=0;this.disposed=false;this.level=.35;}
 inspect(){return{enabled:!!this.context&&!this.disposed,contextState:this.context?.state||'not-created',voices:this.voices.size,buffers:this.buffers.size,level:this.level,disposed:this.disposed};}
 async enable(){
  if(this.disposed)throw Error('Sound disposed');
  if(!this.context){this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=this.level;this.master.connect(this.context.destination);}
  const context=this.context;await context.resume();if(this.disposed||context!==this.context)throw Error('Sound enable cancelled');
 }
 setLevel(value){if(!Number.isFinite(value)||value<0||value>1)throw Error('Invalid effect level');this.level=value;if(this.master)this.master.gain.setTargetAtTime(value,this.context.currentTime,.01);}
 async prepare(id,bytes){
  if(!this.context||this.disposed)throw Error('Enable laptop sound first');
  if(typeof id!=='string'||!id||id.length>64||!(bytes instanceof ArrayBuffer)||bytes.byteLength>20000000)throw Error('Invalid effect audio');
  const epoch=this.epoch,context=this.context,buffer=await context.decodeAudioData(bytes.slice(0));
  if(this.disposed||epoch!==this.epoch||context!==this.context)return false;
  if(buffer.duration>30||buffer.numberOfChannels>2)throw Error('Use a mono or stereo effect up to 30 seconds');
  this.buffers.set(id,buffer);return true;
 }
 play(id,{delay=0,gain=1}={}){
  if(!this.context||this.disposed||this.context.state!=='running')throw Error('Laptop sound is not enabled');
  if(!Number.isFinite(delay)||delay<0||delay>30||!Number.isFinite(gain)||gain<0||gain>1)throw Error('Invalid effect timing or gain');
  const buffer=this.buffers.get(id);if(!buffer)throw Error('Effect audio unavailable');
  const source=this.context.createBufferSource(),level=this.context.createGain();source.buffer=buffer;level.gain.value=gain;source.connect(level);level.connect(this.master);
  const voice={source,level,at:this.context.currentTime+delay};this.voices.add(voice);
  source.onended=()=>{this.voices.delete(voice);source.disconnect();level.disconnect();};source.start(voice.at);return voice;
 }
 cancel(){
  this.epoch++;if(!this.context)return;const now=this.context.currentTime;
  for(const voice of this.voices){voice.level.gain.cancelScheduledValues(now);voice.level.gain.setValueAtTime(voice.at>now?0:voice.level.gain.value,now);voice.level.gain.linearRampToValueAtTime(0,now+.012);try{voice.source.stop(now+.015);}catch{} }
  this.voices.clear();
 }
 async dispose(){if(this.disposed)return;this.cancel();this.disposed=true;this.buffers.clear();const context=this.context;this.context=null;this.master=null;if(context&&context.state!=='closed')await context.close();}
}
