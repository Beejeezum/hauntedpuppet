const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const source=fs.readFileSync(path.join(__dirname,'../assets/show-routines.js'),'utf8');
 const {RoutineRunner}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const seen=[],runner=new RoutineRunner(async(c,v)=>seen.push([c,v]));
 await runner.run({id:'test',title:'test',steps:[['gaze','left'],['wait',5],['gesture','wave']]});assert.deepEqual(seen,[['gaze','left'],['gesture','wave']]);assert.equal(runner.inspect().running,false);
 seen.length=0;const pending=runner.run({id:'cancel',title:'cancel',steps:[['gaze','right'],['wait',10000],['cue','hello']]});await new Promise(r=>setTimeout(r,10));runner.stop();await pending;assert.deepEqual(seen,[['gaze','right']]);assert.equal(runner.inspect().running,false);
 let resolve;const late=new RoutineRunner(()=>new Promise(r=>resolve=r));const first=late.run({id:'first',title:'first',steps:[['cue','hello'],['gesture','wave']]});late.stop();resolve();await first;assert.equal(late.inspect().running,false);
 const errors=[],failed=new RoutineRunner(async()=>{throw Error('Voice unavailable')},x=>errors.push(x));await failed.run({id:'fail',title:'fail',steps:[['cue','hello']]});assert(errors.some(x=>x.includes('Voice unavailable')));assert.equal(failed.inspect().running,false);
 console.log('PASS authored sequencing, cancellable waits, late completion rejection and honest cue failure.');
})().catch(e=>{console.error(e);process.exit(1)});
