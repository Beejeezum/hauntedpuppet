const {liveWorkspaceUrl}=require('../tests/live-url.cjs');
const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=process.env.HAUNT_TEST_BASE||'http://127.0.0.1:8780',duration=Number(process.env.HAUNT_SOAK_SECONDS||2100)*1000;
(async()=>{
 const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[],providerRequests=[];
 context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));page.on('pageerror',e=>errors.push(e.message));
 context.on('request',r=>{if(/\/api\/(performance|realtime\/session|reply|transcribe)/.test(r.url()))providerRequests.push(r.url().replace(/\?.*/,''));});
 await page.goto(liveWorkspaceUrl(base));await page.waitForFunction(()=>HauntWisp?.inspect().ready&&HauntProjection&&HauntRoutines);
 await page.click('.desk-shortcuts a[href="#projectionSetup"]');await page.click('[data-surface="window"]');
 const output=await context.newPage();await output.goto(liveWorkspaceUrl(base+'/?projector=1'));await output.waitForFunction(()=>HauntWisp?.inspect().ready&&HauntProjection.inspect().settings.scene==='window');
 const report={startedAt:new Date().toISOString(),durationTargetSeconds:duration/1000,scope:'Headless browser with local recorded cue audio; no genuine provider/physical venue claims',samples:[],errors,providerRequests,actions:0,blackouts:0,interruptions:0};
 const out=path.resolve(__dirname,'../../wisp-upgrade-proof');fs.mkdirSync(out,{recursive:true});
 const save=()=>fs.writeFileSync(path.join(out,'projection-soak-progress.json'),JSON.stringify(report,null,2));
 const start=Date.now();let n=0;
 while(Date.now()-start<duration){
  const gesture=['wave','shy','laugh','surprise'][n%4];await page.evaluate(async g=>{await HauntShow.remoteCommand('gesture',g);await HauntShow.remoteCommand('gaze',['left','center','right','audience'][Math.floor(performance.now()/1000)%4])},gesture);report.actions++;
  if(n%4===0){await page.click('#test');await page.waitForFunction(()=>HauntWisp.inspect().state==='speaking');await page.waitForTimeout(750);await page.click('#stop');report.interruptions++;}
  if(n%5===0){await page.click('#blackout');await page.waitForTimeout(150);for(const p of [page,output]){const sum=await p.locator(p===page?'#preview':'#projection').evaluate(c=>{const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let sum=0;for(let i=0;i<data.length;i+=4)sum+=data[i]+data[i+1]+data[i+2];return sum});assert.equal(sum,0,'Emergency black must include scenery');}report.blackouts++;await page.click('[data-cue="appear"]');}
  const sample=await page.evaluate(()=>({wisp:HauntWisp.inspect(),projection:HauntProjection.inspect(),native:HauntRealtime.inspect(),heap:performance.memory?.usedJSHeapSize||null}));
  assert(sample.wisp.ready&&sample.wisp.bounds.inside);assert.equal(sample.projection.error,null);assert.equal(sample.native.micTracks,0);assert.equal(sample.native.ready,false);
  report.samples.push({elapsedSeconds:Math.round((Date.now()-start)/1000),fps:Math.round(sample.wisp.fps),heap:sample.heap,gpuFrames:sample.projection.frames,state:sample.wisp.performanceState,painting:sample.wisp.expression});
  assert.equal((await output.evaluate(()=>HauntWisp.inspect())).audioState,'not-created');assert.deepEqual(errors,[]);assert.deepEqual(providerRequests,[]);save();n++;
  await page.waitForTimeout(Math.min(30000,Math.max(0,duration-(Date.now()-start))));
 }
 await page.click('#stop');await page.screenshot({path:path.join(out,'projection-soak-final.png')});await output.screenshot({path:path.join(out,'projector-soak-final.png')});
 await page.close();await output.waitForTimeout(2900);const black=await output.locator('#projection').evaluate(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let s=0;for(let i=0;i<d.length;i+=4)s+=d[i]+d[i+1]+d[i+2];return s});assert.equal(black,0,'Lost desk must blank scenery too');
 report.completedAt=new Date().toISOString();report.elapsedSeconds=Math.round((Date.now()-start)/1000);report.controllerLossBlanks=true;report.passed=true;save();fs.writeFileSync(path.join(out,'projection-soak-results.json'),JSON.stringify(report,null,2));
 await browser.close();console.log('PASS projection soak',report.elapsedSeconds,'seconds;',report.actions,'actions;',report.blackouts,'blackouts;',report.interruptions,'interrupted recorded performances; silent projector, no provider requests.');
})().catch(e=>{console.error(e);process.exit(1)});
