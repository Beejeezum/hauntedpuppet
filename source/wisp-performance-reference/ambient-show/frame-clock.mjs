/** One callback queue; the owner or its silent foreground output can advance it. */
export class StageFrameClock {
 constructor({request=callback=>requestAnimationFrame(callback),cancel=id=>cancelAnimationFrame(id),now=()=>performance.now(),onError=error=>queueMicrotask(()=>{throw error})}={}){Object.assign(this,{nativeRequest:request,nativeCancel:cancel,now,onError});this.pending=new Map();this.nextId=1;this.nativeId=null;this.pulsing=false;this.disposed=false;}
 schedule(){if(!this.disposed&&!this.pulsing&&this.nativeId===null&&this.pending.size)this.nativeId=this.nativeRequest(()=>{this.nativeId=null;this.pulse()});}
 request(callback){if(this.disposed||typeof callback!=='function')throw Error('Frame clock unavailable');const id=this.nextId++;this.pending.set(id,callback);this.schedule();return id;}
 cancel(id){this.pending.delete(id);if(!this.pending.size&&this.nativeId!==null){this.nativeCancel(this.nativeId);this.nativeId=null;}}
 pulse(){if(this.disposed||this.pulsing)return;if(this.nativeId!==null){this.nativeCancel(this.nativeId);this.nativeId=null;}this.pulsing=true;const ids=[...this.pending.keys()],at=this.now();try{for(const id of ids){const callback=this.pending.get(id);this.pending.delete(id);if(callback)try{callback(at)}catch(error){this.onError(error)}}}finally{this.pulsing=false;this.schedule();}}
 inspect(){return{pending:this.pending.size,disposed:this.disposed};}
 dispose(){if(this.disposed)return;this.disposed=true;this.pending.clear();if(this.nativeId!==null)this.nativeCancel(this.nativeId);this.nativeId=null;}
}
