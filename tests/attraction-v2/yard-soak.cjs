// Normal-speed native playback, no provider/microphone/physical projection.
const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');process.env.HAUNT_TONIGHT_ROOT='.';
const seconds=Math.max(60,Math.min(43200,Number(process.env.HAUNT_SOAK_SECONDS)||7200)),label=process.env.HAUNT_SOAK_LABEL||'two-hour',directory=`work/yard-operator/soak-${label.replace(/[^a-z0-9-]/gi,'')}`;
(async()=>{fs.mkdirSync(directory,{recursive:true});const fixture=await require('../tonight_fixture.cjs').start(),browser=await chromium.launch({args:['--mute-audio']}),page=await browser.newPage({viewport:{width:1100,height:850}}),errors=[],provider=[];
 const report={startedAt:new Date().toISOString(),requestedSeconds:seconds,status:'running',scope:'normal-speed local browser rendering; no physical projection or voice calls',samples:[],errors};
 const save=()=>fs.writeFileSync(`${directory}/report.json`,JSON.stringify(report,null,2));page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/performance'))provider.push(r.url());});save();
 try{
  await page.goto(fixture.base+'/source/attraction-v2/console/index.html');await page.locator('#start').click();await page.waitForFunction(()=>WispYardScene.inspect().playback?.running);
  await page.locator('#auto').click();await page.locator('#connection').click();const pp=page.waitForEvent('popup');await page.getByRole('button',{name:'Open projector',exact:true}).click();const popup=await pp;await popup.waitForLoadState();await page.getByRole('button',{name:'Close output',exact:true}).click();
  await page.evaluate(()=>{const v=document.getElementById('film');window.soakFrames={count:0,lastTime:-1,backwards:0,minimumPeak:255};const c=document.createElement('canvas');c.width=160;c.height=90;const ctx=c.getContext('2d');const cb=(_,m)=>{const s=soakFrames;s.count++;if(m.mediaTime<s.lastTime)s.backwards++;s.lastTime=m.mediaTime;if(s.count%12===0){ctx.drawImage(v,0,0,160,90);let peak=0;const a=ctx.getImageData(0,0,160,90).data;for(let i=0;i<a.length;i+=4)peak=Math.max(peak,a[i],a[i+1],a[i+2]);s.minimumPeak=Math.min(s.minimumPeak,peak);}v.requestVideoFrameCallback(cb);};v.requestVideoFrameCallback(cb);});
  const started=Date.now();let phase=-1,action=-1,phaseStart=0,previousTime=-1;
  while((Date.now()-started)/1000<seconds){
   const elapsed=(Date.now()-started)/1000,p=Math.min(2,Math.floor(elapsed/(seconds/3)));
   if(p!==phase){phase=p;phaseStart=elapsed;await page.locator(`[data-tone=${['gentle','haunted','mischief'][phase]}]`).click();}
   const act=Math.floor(elapsed/90);if(act!==action){action=act;if(phase===0)await page.locator('[data-moment=welcome]').click();else await page.locator('[data-action=fog]').click();}
   await page.waitForTimeout(Math.min(15000,Math.max(1000,(seconds-elapsed)*1000)));
   const sample=await page.evaluate(()=>{const v=document.getElementById('film'),ranges=[];for(let i=0;i<v.buffered.length;i++)ranges.push([v.buffered.start(i),v.buffered.end(i)]);const s=WispYardScene.inspect();return{state:s.playback,sceneFrames:s.frames,eyes:s.eyes,vapor:s.vapor,frameAudit:{...soakFrames},memory:performance.memory?.usedJSHeapSize||null,ranges,quality:v.getVideoPlaybackQuality?.(),muted:v.muted};});
   sample.elapsedSeconds=(Date.now()-started)/1000;sample.phase=['friendly','scary','mixed'][phase];sample.output=await popup.evaluate(()=>WispFilmOutput.inspect());
   assert(sample.state.running&&!sample.state.error);assert(sample.state.time>previousTime);previousTime=sample.state.time;assert(sample.frameAudit.backwards===0&&sample.frameAudit.minimumPeak>80);assert(sample.output.silent&&!sample.output.stale);assert(sample.muted);assert.deepEqual(errors,[]);assert.deepEqual(provider,[]);
   if(sample.elapsedSeconds-phaseStart>30&&phase<2)assert.equal(sample.state.form,sample.phase);
   const span=sample.ranges.reduce((n,[a,b])=>n+b-a,0);assert(span<100,'Unbounded decoder buffer');report.samples.push(sample);save();
  }
  await page.locator('#stop').click();await page.waitForTimeout(200);assert(!(await page.evaluate(()=>WispYardScene.inspect().playback.running)));assert.equal(await popup.evaluate(()=>Math.max(...document.querySelector('canvas').getContext('2d').getImageData(640,360,1,1).data)),0);
  report.status='passed';report.finishedAt=new Date().toISOString();report.elapsedSeconds=(Date.now()-started)/1000;report.providerCalls=provider.length;save();console.log('PASS '+report.elapsedSeconds.toFixed(1)+'s normal-speed native yard playback and silent projector.');
 }catch(e){report.status='failed';report.failure=String(e);report.finishedAt=new Date().toISOString();save();await page.screenshot({path:`${directory}/failure.png`}).catch(()=>{});throw e;}
 finally{await browser.close();await fixture.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
