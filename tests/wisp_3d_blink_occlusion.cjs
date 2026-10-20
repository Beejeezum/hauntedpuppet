const {liveWorkspaceUrl}=require('./live-url.cjs');
// Real skinned/morphed geometry rays: a blink must hide pupil AND catchlights.
const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch();
 try {
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(liveWorkspaceUrl((process.env.HAUNT_TEST_BASE||'http://127.0.0.1:8770')+'/assets/wisp-3d-studio.html'));
  await page.waitForFunction(()=>window.Wisp3DStudio?.inspect().frames>2);
  const samples=await page.evaluate(async()=>{
   const {Vector3,Raycaster,Box3}=await import('/assets/vendor/three/three.module.js');
   const r=Wisp3DStudio.rig,results=[];
   const base={clock:1,dt:1/60,freeze:true,state:'idle',motion:{float:0},performer:{eyeLookX:0,eyeLookY:0,headYaw:0,headPitch:0,headRoll:0,jawOpen:0,browUpLeft:0,browUpRight:0,browDown:0}};
   const rayTo=(name)=>{
    const mesh=r.model.getObjectByName(name),target=new Box3().setFromObject(mesh,true).getCenter(new Vector3());
    const origin=r.camera.getWorldPosition(new Vector3());
    const ray=new Raycaster(origin,target.clone().sub(origin).normalize());
    // Intersect actual deformed triangles, not screen pixels or morph weights.
    return ray.intersectObject(r.model,true).filter(h=>h.object.visible&&h.object.material.opacity>.99).slice(0,5).map(h=>({name:h.object.name,distance:+h.distance.toFixed(6)}));
   };
   for(const blend of [0,.5,1])for(const closed of ['L','R']){
    r.render({...base,performer:{...base.performer,eyeBlinkLeft:closed==='L'?1:0,eyeBlinkRight:closed==='R'?1:0}},blend);
    r.model.updateMatrixWorld(true);r.model.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.update();o.computeBoundingSphere();o.computeBoundingBox();}});
    const open=closed==='L'?'R':'L';
    for(const feature of ['Pupil','Catchlight','CatchlightSmall'])results.push({blend,closed,feature,closedHits:rayTo(feature+'_'+closed),openHits:rayTo(feature+'_'+open)});
   }
   return results;
  });
  const failures=samples.filter(s=>s.closedHits[0]?.name!=='UpperLid_'+s.closed||!/^(Pupil|Iris|Catchlight)/.test(s.openHits[0]?.name||''));
  if(failures.length)console.error('Blink occlusion failures',JSON.stringify(failures,null,2));
  assert.equal(failures.length,0,'Actual closed lid must occlude pupil and both catchlights; opposite eye must remain visibly open');
  assert.deepEqual(errors,[]);
  console.log('PASS actual skinned raycast eyelid occlusion: cute, half-morph and evil; independent left/right blink; pupil and two catchlights',{samples:samples.length,forms:3,eyes:2,features:3});
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
