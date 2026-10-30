// Normal-speed unattended programs. Silent native media + painted rig; no provider/hardware claim.
const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');process.env.HAUNT_TONIGHT_ROOT='.';
const seconds=Math.max(60,Math.min(7200,Number(process.env.HAUNT_SOAK_SECONDS)||1800)),folder='work/yard-operator/after-dark-soak';
(async()=>{fs.mkdirSync(folder,{recursive:true});const fixture=await require('../tonight_fixture.cjs').start(),browser=await chromium.launch({args:['--mute-audio']}),page=await browser.newPage({viewport:{width:1100,height:900}}),errors=[],requests=[];
 const report={startedAt:new Date().toISOString(),requestedSeconds:seconds,status:'running',scope:'normal-speed silent browser, three independent programs; no actual phone/projection/voice test',samples:[],errors};const save=()=>fs.writeFileSync(folder+'/report.json',JSON.stringify(report,null,2));
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/'))requests.push(r.url());});save();
 try{
  await page.goto(fixture.base+'/source/attraction-v2/console/haunt-loops.html');await page.waitForFunction(()=>window.WispAfterDark&&Object.values(WispAfterDark.inspect().available).every(Boolean));
  await page.locator('[data-program=spider]').click();await page.locator('#start').click();const pp=page.waitForEvent('popup');await page.locator('#projector').click();const output=await pp;await output.waitForLoadState();
  const started=Date.now();let lastProgram='spider',frames=0;
  while((Date.now()-started)/1000<seconds){
   const elapsed=(Date.now()-started)/1000,program=['spider','eyes','apparitions'][Math.floor(elapsed/120)%3];
   if(program!==lastProgram){await page.locator(`[data-program=${program}]`).click();lastProgram=program;}
   await page.waitForTimeout(Math.min(15000,Math.max(1000,(seconds-elapsed)*1000)));
   const sample=await page.evaluate(()=>{const s=WispAfterDark.inspect();return{running:s.running,program:s.program,sceneFrames:s.scene.frames,sceneError:s.scene.error,spider:{phase:s.spider.phase,frames:s.spider.frames,bounds:s.spider.bounds,running:s.spider.running},eyes:s.eyes.slots.map(x=>({plays:x.plays,active:x.active,muted:x.muted})),ghost:{running:s.player?.running,error:s.player?.error,time:s.player?.time,cacheEntries:s.player?.timeline?.cacheEntries},videoCount:document.querySelectorAll('video').length,allMediaMuted:[...document.querySelectorAll('video,audio')].every(x=>x.muted)};});
   sample.elapsedSeconds=(Date.now()-started)/1000;sample.output=await output.evaluate(()=>WispFilmOutput.inspect());
   assert(sample.running&&!sample.sceneError);assert.equal(sample.program,program);assert(sample.sceneFrames>frames);frames=sample.sceneFrames;assert(sample.output.silent&&!sample.output.stale);assert(sample.allMediaMuted&&sample.videoCount===4);
   if(program==='spider'){assert(sample.spider.running&&!sample.ghost.running);if(sample.spider.bounds){const b=sample.spider.bounds;assert(b.minX>=64&&b.maxX<=1216&&b.minY>=64&&b.maxY<=656);}}
   else assert(!sample.spider.running);
   if(program==='apparitions')assert(sample.ghost.running&&!sample.ghost.error);else assert(!sample.ghost.running);
   assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);report.samples.push(sample);save();
  }
  await page.locator('#stop').click();assert(!(await page.evaluate(()=>WispAfterDark.inspect().running)));assert.equal(await output.evaluate(()=>Math.max(...document.querySelector('canvas').getContext('2d').getImageData(640,360,1,1).data)),0);
  report.status='passed';report.finishedAt=new Date().toISOString();report.elapsedSeconds=(Date.now()-started)/1000;save();console.log('PASS '+report.elapsedSeconds.toFixed(1)+'s normal-speed three-program After dark soak and silent shared projector.');
 }catch(error){report.status='failed';report.failure=String(error);report.finishedAt=new Date().toISOString();save();await page.screenshot({path:folder+'/failure.png'}).catch(()=>{});throw error;}
 finally{await browser.close();await fixture.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
