const {liveWorkspaceUrl}=require('./live-url.cjs');
const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch(),context=await browser.newContext(),desk=await context.newPage(),projector=await context.newPage(),errors=[],providerRequests=[],base=process.env.HAUNT_TEST_BASE||'http://127.0.0.1:8770';
 for(const page of [desk,projector]){page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST'&&/realtime|performance|conversation|session/.test(new URL(r.url()).pathname))providerRequests.push(new URL(r.url()).pathname);});}
 await desk.goto(liveWorkspaceUrl(base));await desk.waitForFunction(()=>window.HauntWisp?.inspect().ready&&window.HauntForms);await projector.goto(liveWorkspaceUrl(base+'/?projector=1'));await projector.waitForFunction(()=>window.HauntWisp?.inspect().ready);
 const kinds=['wave','shy','laugh','surprise','dance','twirl','bounce','peekaboo','celebrate','orbit','enter','exit'];
 for(const kind of kinds){
  await desk.evaluate(k=>HauntForms.perform(k),kind);await desk.waitForFunction(k=>HauntWisp.inspect().choreography.kind===k,kind);await projector.waitForFunction(k=>HauntWisp.inspect().choreography.kind===k,kind);
  assert((await desk.evaluate(()=>HauntWisp.inspect())).bounds.inside);const output=await projector.evaluate(()=>HauntWisp.inspect());assert(output.bounds.inside);assert.equal(output.audioState,'not-created');await desk.waitForTimeout(180);
 }
 await desk.evaluate(()=>HauntForms.perform('dance'));await desk.waitForTimeout(3300);assert.equal((await desk.evaluate(()=>HauntWisp.inspect())).choreography.kind,'dance','Long routines must survive the old 2.3 second reaction limit');assert.equal((await projector.evaluate(()=>HauntWisp.inspect())).choreography.kind,'dance');
 await desk.click('#stop');await desk.waitForFunction(()=>!HauntWisp.inspect().choreography.active);await projector.waitForFunction(()=>!HauntWisp.inspect().choreography.active);
 assert.equal(await desk.evaluate(()=>{try{HauntForms.perform('toString');return false}catch{return true}}),true,'Inherited object properties are not puppet actions');assert.deepEqual(errors,[]);assert.deepEqual(providerRequests,[]);
 await browser.close();console.log('PASS actual operator/projector choreography: 12 mirrored moves, rapid handoff, full-length dance, Stop cancellation, no clipping/page errors/provider requests, silent projector.');
})().catch(e=>{console.error(e);process.exit(1)});
