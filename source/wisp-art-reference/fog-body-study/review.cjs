// Local art experiment only: substitute a body texture in an isolated browser.
// No production files, provider calls, camera or microphone are changed.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
const withVolume=process.argv.includes('--volume');
const withPolar=process.argv.includes('--polar');
const withBilateral=process.argv.includes('--bilateral');
const smallerHands=process.argv.includes('--smaller-hands');
const withCorrective=process.argv.includes('--corrective')||withBilateral;
const withJoints=process.argv.includes('--joints')||withPolar||withCorrective;
const withArm=process.argv.includes('--arm')||withVolume||withJoints;
const landmarks=JSON.parse(fs.readFileSync(path.join(__dirname,'arm-left-rig.json'),'utf8'));
(async()=>{
 const browser=await chromium.launch();
 const out=path.resolve(__dirname,'../../../../wisp-live-rig-proof/'+(withBilateral?(smallerHands?'fog-bilateral-proportion-study':'fog-bilateral-study'):withCorrective?'fog-arm-corrective-study':withPolar?'fog-arm-polar-study':withJoints?'fog-arm-joint-study':withVolume?'fog-arm-volume-study':withArm?'fog-arm-study':'fog-body-study'));
 fs.mkdirSync(out,{recursive:true});const results=[];
 try{
  for(const candidate of [false,true]){
   const raised=withCorrective&&(candidate||withBilateral);
   const binding=raised?JSON.parse(fs.readFileSync(path.join(__dirname,'arm-left-raised-rig.json'),'utf8')):landmarks;
   const mirror=p=>[binding.sourceSize[0]-p[0],p[1]];
   const rightBinding={...binding.arm,pivot:mirror(binding.arm.pivot),attach:[640,870],rotation:-binding.arm.rotation,joints:binding.arm.joints.map(mirror)};
   const rightDigits=binding.digits.map(d=>({...d,root:mirror(d.root),tip:mirror(d.tip)}));
   const context=await browser.newContext({viewport:{width:1280,height:900},...(candidate&&process.argv.includes('--video')?{recordVideo:{dir:out,size:{width:1280,height:900}}}:{})});
   const page=await context.newPage();const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   if(candidate||withVolume||withJoints)await page.route('**/wisp-performance/front-kit/body.png',route=>route.fulfill({path:path.join(__dirname,'body.png'),contentType:'image/png'}));
   if((candidate||withVolume||withJoints)&&withArm){
    await page.route('**/wisp-performance/front-kit/arm-left.png',route=>route.fulfill({path:path.join(__dirname,raised?'arm-left-raised-v1.png':'arm-left-v2.png'),contentType:'image/png'}));
    if(candidate&&withBilateral)await page.route('**/wisp-performance/front-kit/arm-right.png',route=>route.fulfill({path:path.join(__dirname,'arm-left-raised-v1.png'),contentType:'image/png'}));
    // Register the new texture to the old rig's source coordinate system in the
    // browser. Original generated PNG stays unchanged. This is a coarse study;
    // matching alpha envelopes does not prove digit landmarks are registered.
    await page.route('**/wisp-performance/front-rig.js',route=>{
     let code=fs.readFileSync(path.resolve(__dirname,'../../../assets/wisp-performance/front-rig.js'),'utf8');
     const old='await im.decode();return im;';
     if(!code.includes(old))throw Error('Painting loader changed; review injection needs updating');
     if((candidate||withPolar||withCorrective)&&withJoints){
      if(!code.includes('function registered('))throw Error('Registration hook changed');
      code=code.replace('function registered(',`Object.assign(ARMS.left,${JSON.stringify(binding.arm)});\nfunction registered(`);
     }else code=code.replace(old,`await im.decode();if(url.endsWith('/arm-left.png')){const c=document.createElement('canvas');c.width=1206;c.height=1305;const ctx=c.getContext('2d');const sx=1060/942,sy=820/834;ctx.setTransform(sx,0,0,sy,96-181*sx,257-275*sy);ctx.drawImage(im,0,0);return c;}return im;`);
     if(candidate&&withBilateral){
      code=code.replace('function registered(',`Object.assign(ARMS.right,${JSON.stringify(rightBinding)});\nfunction registered(`);
      // A native texture reflection reuses the same unchanged painting. Each
      // side retains separate skeleton, digit phases and acting controls.
      code=code.replace(old,`await im.decode();if(url.endsWith('/arm-right.png')){const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.translate(c.width,0);ctx.scale(-1,1);ctx.drawImage(im,0,0);return c;}return im;`);
     }
     if(candidate&&smallerHands){
      if(!code.includes('handScale=(1.2+evil*.35)'))throw Error('Hand scale hook changed');
      code=code.replace('handScale=(1.2+evil*.35)','handScale=(.95+evil*.35)');
     }
     if(candidate&&withPolar){
      if(!code.includes(',skinArmPoint}'))throw Error('Skinning import changed');
      code=code.replace(',skinArmPoint}',',skinArmPoint as priorSkinArmPoint}');
      code=`import {skinArmPointPolar as skinArmPoint} from '/source/wisp-art-reference/fog-body-study/rotation-skinning.js';\n`+code;
     }
     return route.fulfill({body:code,contentType:'text/javascript'});
    });
   }
   if((candidate||withPolar||withCorrective)&&withJoints)await page.route('**/wisp-performance/digit-skin.js',route=>{
    let code=fs.readFileSync(path.resolve(__dirname,'../../../assets/wisp-performance/digit-skin.js'),'utf8');
    if(!code.includes('export function bindDigits'))throw Error('Digit binding hook changed');
    code=code.replace('export function bindDigits',`DIGITS.left=${JSON.stringify(binding.digits)};\nexport function bindDigits`);
    if(candidate&&withBilateral)code=code.replace('export function bindDigits',`DIGITS.right=${JSON.stringify(rightDigits)};\nexport function bindDigits`);
    return route.fulfill({body:code,contentType:'text/javascript'});
   });
   if(candidate&&withVolume)await page.route('**/wisp-performance/limb-solver.js',route=>{
    let code=fs.readFileSync(path.resolve(__dirname,'../../../assets/wisp-performance/limb-solver.js'),'utf8');
    const old='preserveVolume?1/Math.sqrt(Math.max(.5,scale)):scale';
    if(!code.includes(old))throw Error('Bone width calculation changed');
    // Cartoon silhouette study: retain thickness while stretching. This is not
    // mass conservation and is intentionally not a production solver change.
    code=code.replace(old,'preserveVolume?Math.max(1.15,1/Math.sqrt(Math.max(.5,scale))):scale');
    return route.fulfill({body:code,contentType:'text/javascript'});
   });
   await page.goto((process.env.HAUNT_TEST_BASE||'http://127.0.0.1:8812')+'/assets/wisp-performance-studio.html');
   await page.waitForFunction(()=>window.WispPerformanceStudio?.inspect().outputFrame?.ready);
   for(const t of [0,2,5]){
    await page.evaluate(t=>WispPerformanceStudio.seek(t),t);
    await page.waitForFunction(t=>Math.abs(WispPerformanceStudio.rig.lastClock-t)<1e-8,t);
    await page.locator('#stage canvas').screenshot({path:path.join(out,`${candidate?'candidate':'baseline'}-${t}.png`)});
    const pixels=await page.evaluate(()=>{
     const c=document.querySelector('#stage canvas'),w=c.width,h=c.height,d=c.getContext('2d').getImageData(0,0,w,h).data;
     let minX=w,minY=h,maxX=-1,maxY=-1,visible=0;
     for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const k=(y*w+x)*4;if(d[k+3]<2||Math.max(d[k],d[k+1],d[k+2])<=8)continue;
      visible++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
     }
     const margins=visible?[minX/w,minY/h,(w-maxX-1)/w,(h-maxY-1)/h]:null;
     return{size:[w,h],visible,bounds:visible?[minX,minY,maxX+1,maxY+1]:null,margins,inside15Percent:!!margins&&Math.min(...margins)>=.15};
    });
    results.push({candidate,t,pixels,state:await page.evaluate(()=>WispPerformanceStudio.inspect())});
   }
   if(candidate&&process.argv.includes('--video')){
    await page.click('#reel');await page.waitForTimeout(8000);
    await page.click('#stop');
   }
   results.push({candidate,errors});const video=page.video();await context.close();
   if(video)await video.saveAs(path.join(out,'candidate-motion.webm'));
  }
 }finally{await browser.close();}
 fs.writeFileSync(path.join(out,'review.json'),JSON.stringify({scope:'Local front-view art/rig study only. Old face, turn views and evil artwork remain; no production or physical-projection acceptance.',withBilateral,smallerHands,withCorrective,withJoints,withPolar,withVolume,results},null,2));
 console.log('Saved six isolated front-body comparison frames. Inspect joins, face placement and fog material.');
})().catch(e=>{console.error(e);process.exitCode=1});
