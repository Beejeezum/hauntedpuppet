// Local art experiment only: substitute a body texture in an isolated browser.
// No production files, provider calls, camera or microphone are changed.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
const withArm=process.argv.includes('--arm');
(async()=>{
 const browser=await chromium.launch();
 const out=path.resolve(__dirname,'../../../../wisp-live-rig-proof/'+(withArm?'fog-arm-study':'fog-body-study'));
 fs.mkdirSync(out,{recursive:true});const results=[];
 try{
  for(const candidate of [false,true]){
   const context=await browser.newContext({viewport:{width:1280,height:900},...(candidate&&process.argv.includes('--video')?{recordVideo:{dir:out,size:{width:1280,height:900}}}:{})});
   const page=await context.newPage();const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   if(candidate)await page.route('**/wisp-performance/front-kit/body.png',route=>route.fulfill({path:path.join(__dirname,'body.png'),contentType:'image/png'}));
   if(candidate&&withArm){
    await page.route('**/wisp-performance/front-kit/arm-left.png',route=>route.fulfill({path:path.join(__dirname,'arm-left-v2.png'),contentType:'image/png'}));
    // Register the new texture to the old rig's source coordinate system in the
    // browser. Original generated PNG stays unchanged. This is a coarse study;
    // matching alpha envelopes does not prove digit landmarks are registered.
    await page.route('**/wisp-performance/front-rig.js',route=>{
     let code=fs.readFileSync(path.resolve(__dirname,'../../../assets/wisp-performance/front-rig.js'),'utf8');
     const old='await im.decode();return im;';
     if(!code.includes(old))throw Error('Painting loader changed; review injection needs updating');
     code=code.replace(old,`await im.decode();if(url.endsWith('/arm-left.png')){const c=document.createElement('canvas');c.width=1206;c.height=1305;const ctx=c.getContext('2d');const sx=1060/942,sy=820/834;ctx.setTransform(sx,0,0,sy,96-181*sx,257-275*sy);ctx.drawImage(im,0,0);return c;}return im;`);
     return route.fulfill({body:code,contentType:'text/javascript'});
    });
   }
   await page.goto((process.env.HAUNT_TEST_BASE||'http://127.0.0.1:8812')+'/assets/wisp-performance-studio.html');
   await page.waitForFunction(()=>window.WispPerformanceStudio?.inspect().outputFrame?.ready);
   for(const t of [0,2,5]){
    await page.evaluate(t=>WispPerformanceStudio.seek(t),t);
    await page.waitForFunction(t=>Math.abs(WispPerformanceStudio.rig.lastClock-t)<1e-8,t);
    await page.locator('#stage canvas').screenshot({path:path.join(out,`${candidate?'candidate':'baseline'}-${t}.png`)});
    results.push({candidate,t,state:await page.evaluate(()=>WispPerformanceStudio.inspect())});
   }
   if(candidate&&process.argv.includes('--video')){
    await page.click('#reel');await page.waitForTimeout(8000);
    await page.click('#stop');
   }
   results.push({candidate,errors});const video=page.video();await context.close();
   if(video)await video.saveAs(path.join(out,'candidate-motion.webm'));
  }
 }finally{await browser.close();}
 fs.writeFileSync(path.join(out,'review.json'),JSON.stringify({scope:'Front-body texture study only. Old arms/face/side views remain; screenshots must be visually judged, not production acceptance.',results},null,2));
 console.log('Saved six isolated front-body comparison frames. Inspect joins, face placement and fog material.');
})().catch(e=>{console.error(e);process.exitCode=1});
