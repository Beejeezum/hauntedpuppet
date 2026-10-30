// The decoder stays laid out beneath the opaque presentation canvas. Native
// pixels must never leak through, even when that canvas has no drawn content.
const assert=require('node:assert/strict'),fs=require('node:fs'),pw=require('playwright');
process.env.HAUNT_TONIGHT_ROOT='dist';
(async()=>{
 const fixture=await require('../tonight_fixture.cjs').start(),engine=process.env.HAUNT_BROWSER||'chromium',browser=await pw[engine].launch(),page=await browser.newPage(),errors=[];
 const folder=`work/yard-covered-source/${engine}`;fs.mkdirSync(folder,{recursive:true});const deadline=require('./browser-deadline.cjs').browserDeadline({folder,label:engine+' covered source'});
 await page.addInitScript(()=>{const request=requestAnimationFrame,cancel=cancelAnimationFrame,ids=new Set();window.requestAnimationFrame=fn=>{let id=request(t=>{ids.delete(id);fn(t);});ids.add(id);return id;};window.__freezePaint=()=>{ids.forEach(id=>cancel(id));ids.clear();window.requestAnimationFrame=()=>0;};if(navigator.mediaDevices)navigator.mediaDevices.getUserMedia=()=>{throw Error('No camera or microphone');};});
 page.on('pageerror',e=>errors.push(e.message));const rows=[];
 try{
  for(const width of [1200,390]){deadline.phase('native decode and covered-source screenshot at'+width);
   await page.setViewportSize({width,height:950});await page.goto(fixture.base+'/assets/wisp-yard/haunt-loops.html');await page.waitForFunction(()=>window.WispAfterDark);await page.locator('header').evaluate(h=>h.style.position='static');
   await page.locator('[data-program=apparitions]').click();await page.locator('#start').click();await page.waitForFunction(()=>WispAfterDark.inspect().player.time>.6);
   const state=await page.evaluate(()=>{const video=document.querySelector('#film'),canvas=document.querySelector('#stage');__freezePaint();video.pause();const raw=document.createElement('canvas');raw.width=1280;raw.height=720;const ctx=raw.getContext('2d');ctx.drawImage(video,0,0,1280,720);const p=ctx.getImageData(0,0,1280,720).data;let peak=0;for(let i=0;i<p.length;i+=4)peak=Math.max(peak,p[i],p[i+1],p[i+2]);canvas.getContext('2d').clearRect(0,0,1280,720);return{rawFramePeak:peak,muted:video.muted,sourceOpacity:getComputedStyle(video).opacity,sourceWidth:video.getBoundingClientRect().width,canvasBackground:getComputedStyle(canvas).backgroundColor,sourceBeforeCanvas:video.nextElementSibling===canvas};});
   assert(state.rawFramePeak>80,'Native source must actually contain the painted ghost');assert(state.muted);assert.equal(state.sourceOpacity,'1');assert(state.sourceWidth>200);assert(state.sourceBeforeCanvas);assert.equal(state.canvasBackground,'rgb(0, 0, 0)');
   const png=await page.locator('#stage').screenshot({path:`${folder}/covered-${width}.png`});
   const peak=await page.evaluate(async encoded=>{const image=new Image();image.src='data:image/png;base64,'+encoded;await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const x=c.getContext('2d');x.drawImage(image,0,0);const p=x.getImageData(12,12,c.width-24,c.height-24).data;let peak=0;for(let i=0;i<p.length;i+=4)peak=Math.max(peak,p[i],p[i+1],p[i+2]);return peak;},png.toString('base64'));
   assert.equal(peak,0,'A transparent canvas must still cover the retained native frame');rows.push({width,...state,coveredInteriorPeak:peak});
   await page.locator('#stop').click();assert(!(await page.evaluate(()=>WispAfterDark.inspect())).running);
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(folder+'/report.json',JSON.stringify({engine,rows,errors,scope:'Native decoded painted frame retained behind a cleared opaque canvas; actual browser screenshots with the sticky operator header moved out of the capture. No physical projection.'},null,2));console.log('PASS '+engine+' native source stays covered at desktop/mobile sizes and Blackout works.');
 }catch(error){fs.writeFileSync(folder+'/failure.json',JSON.stringify({error:String(error),rows,errors},null,2));throw error;}finally{deadline.phase('closing browser and fixture');await browser.close();await fixture.close();deadline.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
