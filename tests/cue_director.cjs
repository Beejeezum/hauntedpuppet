const assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{
 const {CueDirector}=await import(pathToFileURL(path.join(__dirname,'../source/wisp-performance-reference/ambient-show/cue-director.mjs')));
 const events=[];let level=1,pending=new Map();
 const transport={prepare:id=>new Promise(resolve=>pending.set(id,()=>resolve({id,dispose:()=>events.push('dispose:'+id)}))),fade:async n=>{level=n;events.push('fade:'+n);},activate:p=>{assert.equal(level,0,'No visible clip swap');events.push('activate:'+p.id)},blackout:()=>{level=0;events.push('blackout')}};
 const d=new CueDirector(transport);const first=d.request('a');d.request('b');pending.get('a')();await new Promise(setImmediate);pending.get('b')();await first;
 assert(!events.includes('activate:a'));assert(events.includes('dispose:a'));assert.deepEqual(events.slice(-3),['fade:0','activate:b','fade:1']);assert.equal(d.inspect().current,'b');
 const late=d.request('c');d.stop();pending.get('c')();await late;assert(!events.includes('activate:c'));assert.equal(level,0);assert.equal(d.inspect().phase,'stopped');
 const stale=d.request('old');d.stop();d.request('new');pending.get('old')();await stale;await new Promise(setImmediate);pending.get('new')();await d.running;assert.equal(d.inspect().current,'new','A new request after Stop must survive stale decode cleanup');
 transport.prepare=async()=>{throw Error('Decode failed')};await d.request('bad');assert.equal(d.inspect().phase,'unavailable');assert.equal(level,0);
 d.dispose();assert.throws(()=>d.request('a'),/disposed/);
 console.log('PASS: latest queued cue wins, swaps only at black, Stop rejects late decode, failed decode stays black, disposal prevents restart. Synthetic transport, not visual seam acceptance.');
})().catch(e=>{console.error(e);process.exitCode=1});
