const assert=require('node:assert/strict');
/** Test-only monotonic observation; survives a short utterance ending before poll. */
exports.createSpeechStartProbe=({timeoutMs=30000}={})=>{
 if(!Number.isFinite(timeoutMs)||timeoutMs<1||timeoutMs>30000)throw Error('Invalid speech observation deadline');
 const events=new Map(),pending=new Map();let closed=false,failure=null;
 const validate=e=>{assert.equal(e.phase,'playing','Director must be playing at actual native audio start');assert(Number.isFinite(e.duration)&&e.duration>0&&e.duration<=45);return e;};
 return{
 record(event){try{assert(!closed);assert.equal(event.count,events.size+1,'Speech start observations must be consecutive');}catch(error){failure=error;for(const waiter of pending.values()){clearTimeout(waiter.timer);waiter.reject(error);}pending.clear();return;}const entry={count:event.count,phase:event.phase,duration:event.duration,mouthActive:!!event.mouthActive};events.set(entry.count,entry);const waiter=pending.get(entry.count);if(waiter){clearTimeout(waiter.timer);pending.delete(entry.count);waiter.resolve(entry);}},
 async waitFor(count){assert(Number.isInteger(count)&&count>=1&&count<=32);assert(!closed);if(failure)throw failure;if(events.has(count))return validate(events.get(count));assert(!pending.has(count));return validate(await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(count);reject(Error('Native speech start '+count+' was not observed within '+timeoutMs+'ms'))},timeoutMs);pending.set(count,{resolve,reject,timer});}));},
 inspect(){return{closed,failure:failure?.message||null,pending:pending.size,events:[...events.values()]};},
 dispose(){closed=true;for(const waiter of pending.values()){clearTimeout(waiter.timer);waiter.reject(Error('Speech observation closed'));}pending.clear();}
 };
};
