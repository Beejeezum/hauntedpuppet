const assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{
 const {CueDirector}=await import(pathToFileURL(path.join(__dirname,'../source/wisp-performance-reference/ambient-show/cue-director.mjs')));
 const events=[];let level=1,pending=new Map();
 const transport={prepare:id=>new Promise(resolve=>pending.set(id,()=>resolve({id,dispose:()=>events.push('dispose:'+id)}))),fade:async n=>{level=n;events.push('fade:'+n);},hold:async ms=>{assert(ms>=500);events.push('hold:black');},activate:p=>{assert.equal(level,0,'No visible clip swap');events.push('activate:'+p.id)},blackout:()=>{level=0;events.push('blackout')}};
 const d=new CueDirector(transport);const first=d.request('a');await new Promise(setImmediate);d.request('b');pending.get('a')();await new Promise(setImmediate);pending.get('b')();await first;
 assert(!events.includes('activate:a'));assert(events.includes('dispose:a'));assert.deepEqual(events.slice(-4),['fade:0','hold:black','activate:b','fade:1']);assert.equal(d.inspect().current,'b');
 const late=d.request('c');await new Promise(setImmediate);d.stop();pending.get('c')();await late;assert(!events.includes('activate:c'));assert.equal(level,0);assert.equal(d.inspect().phase,'stopped');
 const stale=d.request('old');await new Promise(setImmediate);d.stop();const fresh=d.request('new');await new Promise(setImmediate);assert(pending.has('new'),'A new request after Stop must begin without waiting for stale decoding');pending.get('new')();await fresh;pending.get('old')();await stale;assert.equal(d.inspect().current,'new','A new request after Stop must survive stale decode cleanup');
 transport.prepare=async()=>{throw Error('Decode failed')};await d.request('bad');assert.equal(d.inspect().phase,'unavailable');assert.equal(level,0);
 let rejectPending;const cancelEvents=[];const cancellable={...transport,prepare:id=>id==='slow'?new Promise((_,reject)=>{rejectPending=reject;}):Promise.resolve({id}),cancelPreparation:()=>{cancelEvents.push('cancel');rejectPending(Object.assign(Error('cancelled'),{cancelled:true}));}};const fast=new CueDirector(cancellable);const slow=fast.request('slow');await new Promise(setImmediate);fast.request('ready');await slow;assert.equal(fast.inspect().current,'ready');assert.equal(fast.inspect().phase,'playing');assert.deepEqual(cancelEvents,['cancel']);fast.dispose();
 d.dispose();assert.throws(()=>d.request('a'),/disposed/);
 console.log('PASS: latest queued cue wins, swaps only at black, Stop rejects late decode, failed decode stays black, disposal prevents restart. Synthetic transport, not visual seam acceptance.');
})().catch(e=>{console.error(e);process.exitCode=1});
