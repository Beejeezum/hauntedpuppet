// Local art experiment only: substitute a body texture in an isolated browser.
// No production files, provider calls, camera or microphone are changed.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
(async()=>{
 const browser=await chromium.launch();
 const out=path.resolve(__dirname,'../../../../wisp-live-rig-proof/fog-body-study');
 fs.mkdirSync(out,{recursive:true});const results=[];
 try{
  for(const candidate of [false,true]){
   const page=await browser.newPage();const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   if(candidate)await page.route('**/wisp-performance/front-kit/body.png',route=>route.fulfill({path:path.join(__dirname,'body.png'),contentType:'image/png'}));
   await page.goto((process.env.HAUNT_TEST_BASE||'http://127.0.0.1:8812')+'/assets/wisp-performance-studio.html');
   await page.waitForFunction(()=>window.WispPerformanceStudio?.inspect().outputFrame?.ready);
   for(const t of [0,2,5]){
    await page.evaluate(t=>WispPerformanceStudio.seek(t),t);
    await page.waitForFunction(t=>Math.abs(WispPerformanceStudio.rig.lastClock-t)<1e-8,t);
    await page.locator('#stage canvas').screenshot({path:path.join(out,`${candidate?'candidate':'baseline'}-${t}.png`)});
    results.push({candidate,t,state:await page.evaluate(()=>WispPerformanceStudio.inspect())});
   }
   results.push({candidate,errors});await page.close();
  }
 }finally{await browser.close();}
 fs.writeFileSync(path.join(out,'review.json'),JSON.stringify({scope:'Front-body texture study only. Old arms/face/side views remain; screenshots must be visually judged, not production acceptance.',results},null,2));
 console.log('Saved six isolated front-body comparison frames. Inspect joins, face placement and fog material.');
})().catch(e=>{console.error(e);process.exitCode=1});
