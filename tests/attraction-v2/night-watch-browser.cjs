// Normal-speed full Night watch cycle: native eyes/ghost + painted spider; silent, no provider.
const assert=require('node:assert/strict'),fs=require('node:fs'),pw=require('playwright');process.env.HAUNT_TONIGHT_ROOT='.';
(async()=>{const fixture=await require('../tonight_fixture.cjs').start(),engine=process.env.HAUNT_BROWSER||'chromium',browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{}),page=await browser.newPage({viewport:{width:1100,height:900}}),errors=[],api=[];
const folder=`work/yard-operator/night-watch-${engine}`;fs.mkdirSync(folder,{recursive:true});page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/'))api.push(r.url());});
const report={engine,scope:'normal-speed silent browser cycle, not physical projection or human art acceptance',status:'running',samples:[],transitions:[],errors};const save=()=>fs.writeFileSync(folder+'/report.json',JSON.stringify(report,null,2));
try{
 if(engine==='webkit')await page.addInitScript(()=>localStorage.setItem('wisp-stagehand-rehearsal-v1',JSON.stringify({schema:1,tone:'gentle',pace:'relaxed',sequence:[]})));
 await page.goto(fixture.base+'/source/attraction-v2/console/haunt-loops.html');await page.waitForFunction(()=>window.WispAfterDark&&Object.values(WispAfterDark.inspect().available).every(Boolean));
 await page.locator('#cycle').check();await page.locator('#start').click();await page.waitForFunction(()=>WispAfterDark.inspect().nightWatch.running);
 assert(await page.locator('#cycle').isDisabled());const popupPromise=page.waitForEvent('popup');await page.locator('#projector').click();const output=await popupPromise;await output.waitForLoadState();
 await page.evaluate(()=>{const canvas=document.getElementById('stage');window.audit={last:'eyes',recent:[],transitions:[],seen:{},stop:false};function tick(){if(audit.stop)return;const s=WispAfterDark.inspect(),now=performance.now();const pixels=canvas.getContext('2d').getImageData(0,0,1280,720).data;let peak=0;for(let i=0;i<pixels.length;i+=4)peak=Math.max(peak,pixels[i],pixels[i+1],pixels[i+2]);const item={at:now,program:s.program,peak};if(audit.last!==s.program){audit.transitions.push({from:audit.last,to:s.program,prior: audit.recent.slice(),at:now,firstPeak:peak});audit.last=s.program;}audit.recent.push(item);if(audit.recent.length>8)audit.recent.shift();if(peak>50)audit.seen[s.program]=true;setTimeout(tick,150);}tick();});
 if(engine==='chromium'&&process.env.HAUNT_RECORD==='1')await page.evaluate(()=>{window.chunks=[];window.recording=new MediaRecorder(document.getElementById('stage').captureStream(30),{mimeType:'video/webm;codecs=vp9'});recording.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recording.start(1000);});
 const started=Date.now();let last='',lastSample=-1,loadingAt=null;
 while((Date.now()-started)<155000){
  await page.waitForTimeout(250);const state=await page.evaluate(()=>WispAfterDark.inspect());assert(state.running||state.loading,'Sequence stopped: '+await page.locator('#loop-status').textContent());assert(state.nightWatch.running);if(state.loading){loadingAt??=Date.now();assert(Date.now()-loadingAt<15000,'Scene preparation did not finish');report.loadingSamples=(report.loadingSamples||0)+1;assert.equal(await page.locator('#stage').evaluate(c=>Math.max(...c.getContext('2d').getImageData(640,360,1,1).data)),0);}else loadingAt=null;assert.deepEqual(errors,[]);assert.deepEqual(api,[]);
  if(state.program!==last){report.samples.push({wallMs:Date.now()-started,program:state.program,night:state.nightWatch});last=state.program;save();}
  if(state.nightWatch.emptyHold){const sec=Math.floor(state.nightWatch.elapsed);if(sec!==lastSample){lastSample=sec;const peak=await page.locator('#stage').evaluate(c=>{const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let peak=0;for(let i=0;i<a.length;i+=4)peak=Math.max(peak,a[i],a[i+1],a[i+2]);return peak;});assert.equal(peak,0,'Planned inter-scene hold contains pixels');}}
  if(state.program==='spider'&&state.spider.phase==='reach'&&!report.spiderFrame){report.spiderFrame=true;await page.screenshot({path:folder+'/spider.png'});}
  if(state.program==='apparitions'&&state.running){assert.equal(state.player.form,engine==='webkit'?'friendly':'scary');report.ghostForm=state.player.form;}
  if(state.program==='apparitions'&&state.nightWatch.elapsed>8&&!report.ghostFrame){report.ghostFrame=true;await page.screenshot({path:folder+'/ghost.png'});}
  if(state.nightWatch.changes>=3)break;
 }
 await page.waitForFunction(()=>audit.transitions.length>=3,null,{timeout:3000});
 report.elapsedSeconds=(Date.now()-started)/1000;const audit=await page.evaluate(()=>{audit.stop=true;return audit;});report.transitions=audit.transitions;
 assert.deepEqual(report.transitions.map(x=>x.to),['spider','apparitions','eyes']);assert.deepEqual(Object.keys(audit.seen).sort(),['apparitions','eyes','spider']);
 for(const tr of report.transitions){assert(tr.prior.length>=6);assert(tr.prior.every(p=>p.peak===0),'A scene changed before it finished');}
 assert(await output.evaluate(()=>WispFilmOutput.inspect().silent));assert.equal(await output.locator('audio,video').count(),0);
 // Manual takeover cancels the sequence; same-scene selection cannot revive an old advance.
 await page.locator('[data-program=eyes]').click();assert(!(await page.evaluate(()=>WispAfterDark.inspect().nightWatch.running)));assert(!(await page.locator('#cycle').isChecked()));
 await page.locator('#stop').click();await page.waitForTimeout(900);assert(!(await page.evaluate(()=>WispAfterDark.inspect().running)));assert.equal(await output.evaluate(()=>Math.max(...document.querySelector('canvas').getContext('2d').getImageData(640,360,1,1).data)),0);
 if(engine==='chromium'&&process.env.HAUNT_RECORD==='1'){const bytes=await page.evaluate(()=>new Promise(resolve=>{recording.onstop=async()=>{const blob=new Blob(chunks,{type:'video/webm'}),reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(blob);};recording.stop();}));fs.writeFileSync(folder+'/cycle.webm',Buffer.from(bytes,'base64'));}
 for(const width of [390,320]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});const violations=await page.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[]);
 report.status='passed';report.silentOutput=true;report.manualTakeover=true;report.blackout=true;report.noProviderCalls=true;report.violations=violations;save();console.log('PASS '+engine+' '+report.elapsedSeconds.toFixed(1)+'s real Night watch cycle; native endings, black holds, manual takeover and silent output.');
}catch(error){report.status='failed';report.failure=String(error);save();await page.screenshot({path:folder+'/failure.png'}).catch(()=>{});throw error;}finally{await browser.close();await fixture.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
