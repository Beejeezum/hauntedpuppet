const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch();
 try {
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.HAUNT_TEST_BASE||'http://127.0.0.1:8770')+'/assets/wisp-3d-studio.html');
  await page.waitForFunction(()=>window.Wisp3DStudio?.inspect().frames>2);
  const result=await page.evaluate(async()=>{
   const {Vector3}=await import('/assets/vendor/three/three.module.js');
   const {SpiritAtmosphere}=await import('/assets/spirit-atmosphere.js');
   const rig=Wisp3DStudio.rig,ids=['Tail_Tip','Forearm_L','Forearm_R','Crest_2'];
   let maxError=0,finite=true,minDepth=0,maxYaw=0;
   const snapshots=[];
   for(const sample of [{yaw:0},{yaw:1.2},{action:{kind:'wave',at:1.2}},{action:{kind:'dance',at:2.5}},{action:{kind:'exit',at:2.3}}]){
    for(let frame=0;frame<24;frame++) rig.render({clock:10+snapshots.length+frame/60,dt:1/60,freeze:!sample.action,state:'idle',viewYaw:sample.yaw||0,motion:{float:0,gesture:100},action:sample.action},.5);
    const state=rig.inspect(),points=state.emissionPoints||[];
    if(points.length!==4)throw Error('Expected four actual bone emitters');
    for(const id of ids){
     const actual=points.find(p=>p.id===id);if(!actual)throw Error('Missing '+id);
     const v=rig.bones[id].getWorldPosition(new Vector3()).project(rig.camera);
     maxError=Math.max(maxError,Math.hypot(actual.x-(v.x+1)*640,actual.y-(1-v.y)*360));
     finite=finite&&Number.isFinite(actual.x)&&Number.isFinite(actual.y);
    }
    minDepth=Math.min(minDepth,state.depth);maxYaw=Math.max(maxYaw,Math.abs(state.viewYaw));snapshots.push(points.map(p=>({...p})));
   }
   const moved=snapshots.slice(1).map(points=>Math.max(...points.map(p=>{const old=snapshots[0].find(q=>q.id===p.id);return Math.hypot(p.x-old.x,p.y-old.y)})));
   const atmosphere=await new SpiritAtmosphere().load();if(!atmosphere.ready)throw Error(atmosphere.error);
   const ctx=document.createElement('canvas').getContext('2d'),anchors=ids.map((id,i)=>({id,x:100+i*170,y:150+i*80}));
   const params={body:{minX:20,maxX:1200,minY:20,maxY:700},amount:1,emissionPoints:anchors};
   atmosphere.draw(ctx,{...params,clock:0});
   let originError=0;
   for(let i=0;i<4;i++){
    atmosphere.credit=1;atmosphere.draw(ctx,{...params,clock:(i+1)/60});
    const particle=atmosphere.particles.at(-1),anchor=anchors[i];
    originError=Math.max(originError,Math.hypot(particle.x-anchor.x,particle.y-anchor.y));
   }
   atmosphere.draw(ctx,{...params,clock:5/60,reduced:true});const reducedClear=atmosphere.particles.length===0;
   atmosphere.draw(ctx,{...params,clock:6/60,emissionPoints:[null,{x:NaN,y:2},{x:4,y:Infinity}]});
   atmosphere.credit=1;atmosphere.draw(ctx,{...params,clock:7/60,emissionPoints:[null,{x:NaN,y:2}]});
   const invalidSafe=atmosphere.particles.every(p=>[p.x,p.y,p.vx,p.vy].every(Number.isFinite));
   atmosphere.clear();const cleared=atmosphere.particles.length===0&&atmosphere.credit===0&&atmosphere.previous===null;
   return {maxError,finite,moved,minDepth,maxYaw,originError,reducedClear,invalidSafe,cleared};
  });
  assert(result.finite);assert(result.maxError<1e-5,'Bone emitter projection must be exact');
  assert(result.moved.every(d=>d>1),'Emitters must follow yaw, limbs and actual depth');
  assert(result.minDepth<-10);assert(result.maxYaw>.5);
  assert(result.originError<2,'Painted wake must originate at supplied bone anchors');
  assert(result.reducedClear&&result.invalidSafe&&result.cleared);assert.deepEqual(errors,[]);
  console.log('PASS projected bone emitters, yaw/depth/full-body following, painted wake origins, reduced motion and invalid-anchor cleanup',result);
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
