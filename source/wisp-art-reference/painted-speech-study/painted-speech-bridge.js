/** Consumes authoritative app puppetParams, not raw provider events.
 * Owns no connection, audio, microphone or credential. Retains 64 stopped IDs;
 * the app remains responsible for rejecting older provider responses.
 */
export class PaintedSpeechBridge {
 constructor(cues){this.cues=cues;this.id=null;this.token=null;this.lastAt=-Infinity;this.retired=new Set();this.disposed=false;}
 retire(){if(this.id){this.retired.add(this.id);while(this.retired.size>64)this.retired.delete(this.retired.values().next().value);}this.id=null;this.token=null;this.lastAt=-Infinity;this.cues.stop();}
 update(params={},dt=0){if(this.disposed)return 0;const id=typeof params.id==='string'&&params.id.length<=256?params.id:null;if(params.state!=='speaking'||(Number.isFinite(params.visible)&&params.visible<=.001)||!id){if(this.id)this.retire();return this.cues.tick(dt);}if(this.retired.has(id))return this.cues.tick(dt);if(this.id!==id){if(this.id)this.retire();this.id=id;this.lastAt=-Infinity;this.token=this.cues.begin({source:params.syncMode==='synthetic-rehearsal'?'synthetic-rehearsal':'acoustic-estimate'});}if(Number.isFinite(params.at)&&params.at+.03<this.lastAt)return this.cues.tick(dt);if(Number.isFinite(params.at))this.lastAt=params.at;const weights=params.weights&&typeof params.weights==='object'?params.weights:null;if(weights)this.cues.cue(this.token,{weights});else this.cues.cue(this.token,{jaw:params.jaw});return this.cues.tick(dt);}
 stop(){if(!this.disposed)this.retire();}
 inspect(){return {id:this.id,retiredCount:this.retired.size,disposed:this.disposed,cues:this.cues.inspect()};}
 dispose(){if(this.disposed)return;this.retire();this.disposed=true;this.cues.dispose();}
}
