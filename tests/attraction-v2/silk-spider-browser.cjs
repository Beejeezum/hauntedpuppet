// Actual raster decode and articulated canvas rendering. Accelerated clock for boundary scans.
const assert=require('node:assert/strict'),fs=require('node:fs'),pw=require('playwright');process.env.HAUNT_TONIGHT_ROOT='.';
(async()=>{const fixture=await require('../tonight_fixture.cjs').start(),engine=process.env.HAUNT_BROWSER||'chromium',browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{}),page=await browser.newPage({viewport:{width:1280,height:950}}),errors=[],provider=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/'))provider.push(r.url());});fs.mkdirSync('work/yard-spider',{recursive:true});
 try{
  await page.goto(fixture.base+'/source/attraction-v2/console/spider-study.html');await page.waitForFunction(()=>window.WispSpiderStudy?.inspect().ready);
  const report=await page.evaluate(async()=>{
   const {SilkSpider}=await import('./silk-spider.mjs'),spider=new SilkSpider();await spider.load();spider.start(0);
   const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true}),samples=[],times=[],darkFailures=[],boundaryFailures=[];let visibleFrames=0;
   for(let t=0;t<144;t+=.2){ctx.clearRect(0,0,1280,720);const start=performance.now();spider.draw(ctx,t);times.push(performance.now()-start);const s=spider.inspect();
    if(s.phase==='empty'){const pixels=ctx.getImageData(0,0,1280,720).data;for(let i=3;i<pixels.length;i+=4)if(pixels[i]){darkFailures.push(t);break;}}
    if(s.bounds){visibleFrames++;const b=s.bounds;if(b.minX<64||b.maxX>1216||b.minY<64||b.maxY>656)boundaryFailures.push({t,b});}
    if(Math.abs(t-Math.round(t))<.00001)samples.push({t,phase:s.phase,bounds:s.bounds});
   }
   times.sort((a,b)=>a-b);spider.stop();ctx.clearRect(0,0,1280,720);spider.draw(ctx,150);const stopped=spider.inspect();spider.dispose();
   return {samples,darkFailures,boundaryFailures,visibleFrames,drawMs:{median:times[Math.floor(times.length*.5)],p95:times[Math.floor(times.length*.95)]},stopped,disposed:spider.inspect(),bitmapClosed:spider.image===null,bufferReleased:spider.rigCanvas.width===0};
  });
  assert.deepEqual(report.darkFailures,[]);assert.deepEqual(report.boundaryFailures,[]);assert(report.visibleFrames>300);assert(!report.stopped.running);assert(report.bitmapClosed&&report.bufferReleased);
  await page.locator('#time').evaluate(e=>{e.value='17.6';e.dispatchEvent(new Event('input'));});
  fs.writeFileSync(`work/yard-spider/${engine}-reach.png`,Buffer.from((await page.locator('canvas').evaluate(c=>c.toDataURL())).split(',')[1],'base64'));
  await page.locator('#play').click();await page.waitForTimeout(800);const frames=await page.evaluate(()=>WispSpiderStudy.inspect().frames);assert(frames>2);await page.locator('#stop').click();assert.equal(await page.evaluate(()=>WispSpiderStudy.inspect().running),false);
  assert.equal(await page.evaluate(()=>Math.max(...document.querySelector('canvas').getContext('2d').getImageData(640,360,1,1).data)),0);
  await page.setViewportSize({width:320,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.route('**/media/spider-rig-sheet-v1.png',r=>r.fulfill({contentType:'image/png',body:'changed image'}));await page.reload();await page.waitForFunction(()=>window.WispSpiderStudy?.inspect().error);assert(await page.locator('#play').isDisabled());assert.match(await page.locator('#status').innerText(),/artwork changed/);
  await page.unroute('**/media/spider-rig-sheet-v1.png');await page.reload();await page.waitForFunction(()=>window.WispSpiderStudy?.inspect().ready);
  const cancel=await page.evaluate(async()=>{const {SilkSpider}=await import('./silk-spider.mjs'),spider=new SilkSpider(),loading=spider.load();spider.dispose();await loading;return spider.inspect();});assert(cancel.disposed&&!cancel.ready&&!cancel.running);
  assert.deepEqual(errors,[]);assert.deepEqual(provider,[]);fs.writeFileSync(`work/yard-spider/${engine}-rig-validation.json`,JSON.stringify({engine,scope:'Actual bitmap decode/render; 144second accelerated clock/boundary scan and real RAF playback. No physical projection, audio or human animation acceptance.',errors,providerCalls:0,...report,disposedDuringLoad:cancel},null,2));console.log('PASS '+engine+' painted spider raster skinning, full boundary scan, dark relocation, stop/dispose/cancel, changed-asset rejection; median/p95 draw ms '+JSON.stringify(report.drawMs));
 }finally{await browser.close();await fixture.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
