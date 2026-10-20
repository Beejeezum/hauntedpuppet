const {liveWorkspaceUrl}=require('./live-url.cjs');
/** Deterministic real-rig temporal regression. No microphone, provider, or physical projector. */
const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(liveWorkspaceUrl((process.env.HAUNT_TEST_BASE||'http://127.0.0.1:8770')+'/assets/wisp-3d-studio.html'));
  await page.waitForFunction(()=>window.Wisp3DStudio?.inspect().frames>2);
  const result=await page.evaluate(async()=>{
   const {Wisp3DRuntime}=await import('/assets/wisp-3d-runtime.js');
   const {Vector3}=await import('/assets/vendor/three/three.module.js');
   // A separate instance prevents the studio's requestAnimationFrame from affecting the test clock.
   const rig=await new Wisp3DRuntime().load();
   if(!rig.ready)throw Error(rig.error);
   // Initial real GPU render compiles the asset; subsequent samples inspect actual CPU skinning.
   rig.render({clock:0,freeze:true},0);
   rig.composer.render=()=>{};
   const body=rig.model.getObjectByName('Wisp_Skin'),points=[];
   for(let i=0;i<body.geometry.attributes.position.count;i+=997)points.push(i);
   const dt=1/60,base={dt,state:'idle',motion:{gesture:100,float:100}};
   let clock=0,frames=0,maxPixelStep=0,maxJointStep=0,maxQuaternionError=0,maxIdleDrift=0,worst=null;
   const sample=()=>({
    points:points.map(i=>body.getVertexPosition(i,new Vector3()).applyMatrix4(body.matrixWorld).project(rig.camera).multiply(new Vector3(640,360,1))),
    joints:Object.values(rig.bones).map(b=>b.quaternion.clone()),
    root:rig.root.position.toArray(),
   });
   const sequenceResults=[];
   const sequences=[
    {kind:'wave',interrupt:1.3,next:'dance'},
    {kind:'twirl',interrupt:1.7,next:'wave'},
    {kind:'exit',interrupt:2.2,next:'dance'},
   ];
   for(const sequence of sequences){
    rig.render({...base,clock,freeze:true},0);
    // Warm idle before measuring so freeze release is not confused with an action interruption.
    for(let n=0;n<60;n++){clock+=dt;rig.render({...base,clock},0);}
    let previous=sample(),sequenceMaxStep=0,minDepth=0;
    for(let n=0;n<420;n++){
     clock+=dt;
     const at=n*dt,action=at<sequence.interrupt?{kind:sequence.kind,at}:at<sequence.interrupt+1.2?{kind:sequence.next,at:at-sequence.interrupt}:undefined;
     // Continuous cute/evil cycle while motion is interrupted and then settles to idle.
     const blend=(1-Math.cos(at*Math.PI/3.5))/2;
     rig.render({...base,clock,action},blend);
     const current=sample();minDepth=Math.min(minDepth,rig.inspect().depth);
     for(let i=0;i<current.points.length;i++){
      const p=current.points[i],q=previous.points[i];
      if(![p.x,p.y,p.z,...current.root].every(Number.isFinite))throw Error('Non-finite skinned pose');
      const step=Math.hypot(p.x-q.x,p.y-q.y);sequenceMaxStep=Math.max(sequenceMaxStep,step);if(step>maxPixelStep){maxPixelStep=step;worst={sequence:sequence.kind,frame:n,at,action,root:current.root,priorRoot:previous.root};}
     }
     for(let i=0;i<current.joints.length;i++){
      const q=current.joints[i];
      maxJointStep=Math.max(maxJointStep,q.angleTo(previous.joints[i]));
      maxQuaternionError=Math.max(maxQuaternionError,Math.abs(1-q.length()));
     }
     previous=current;frames++;
    }
    sequenceResults.push({kind:sequence.kind,maxPixelStep:sequenceMaxStep,minDepth,idleAction:rig.inspect().action,finalDepth:rig.inspect().depth});
    // Frozen identical inputs must return exactly to rest after long animation runs.
    const rest={...base,clock:clock+1,freeze:true,motion:{float:0},performer:{eyeLookX:0,eyeLookY:0,eyeBlinkLeft:0,eyeBlinkRight:0}};
    rig.render(rest,0);const first=sample();
    for(let n=0;n<90;n++)rig.render(rest,0);
    const last=sample();
    for(let i=0;i<first.points.length;i++)maxIdleDrift=Math.max(maxIdleDrift,first.points[i].distanceTo(last.points[i]));
    clock=rest.clock+1;
   }
   // The operator app supplies a clock without dt. Slow rendering must retain real-time turns.
   const cadenceResults=[];
   for(const {fps,physicsDt} of [{fps:15},{fps:30},{fps:15,physicsDt:.05}]){
    clock+=1;
    rig.render({clock,freeze:true,viewYaw:0,state:'idle',motion:{float:0}},0);
    let maxYaw=0,closestBack=Math.PI,midTurnYaw=null,finiteBounds=true,inside=true;
    const started=clock,startYaw=rig.inspect().viewYaw;
    for(let n=1;n<=fps*6;n++){
     clock=started+n/fps;
     const at=n/fps;
     rig.render({clock,...(physicsDt===undefined?{}:{dt:physicsDt}),state:'idle',motion:{gesture:100,float:100},action:at<3.6?{kind:'twirl',at}:undefined},0);
     const info=rig.inspect(),yaw=info.viewYaw-startYaw;
     maxYaw=Math.max(maxYaw,yaw);
     if(Math.abs(at-1.8)<1e-6)midTurnYaw=yaw;
     closestBack=Math.min(closestBack,Math.abs(Math.atan2(Math.sin(yaw-Math.PI),Math.cos(yaw-Math.PI))));
     finiteBounds=finiteBounds&&['minX','minY','maxX','maxY'].every(k=>Number.isFinite(info.bounds[k]));
     inside=inside&&info.bounds.inside;
    }
    const final=rig.inspect();
    cadenceResults.push({fps,dtMode:physicsDt===undefined?'clock-only':'clamped-physics',maxYaw,closestBack,midTurnYaw,finiteBounds,inside,idleAction:final.action,finalYawError:Math.abs(Math.atan2(Math.sin(final.viewYaw),Math.cos(final.viewYaw)))});
   }
   rig.dispose();
   return {frames,maxPixelStep,maxJointStep,maxQuaternionError,maxIdleDrift,worst,sequenceResults,cadenceResults,disposed:!rig.ready};
  });
  assert(result.maxPixelStep<60,`Visible per-frame snap: ${JSON.stringify(result)}`);
  assert(result.maxJointStep<.18,`Joint discontinuity: ${JSON.stringify(result)}`);
  assert(result.maxQuaternionError<1e-5,'Bone rotations must stay normalized');
  assert(result.maxIdleDrift<1e-5,'Repeated identical rest poses must not accumulate deformation');
  assert(result.sequenceResults.every(s=>s.idleAction===null&&s.finalDepth===0),'Interrupted actions must fully return to idle and foreground');
  assert(result.sequenceResults.find(s=>s.kind==='exit').minDepth < -100,'Exit interruption must exercise genuine deep flight');
  for(const cadence of result.cadenceResults){
   assert(cadence.maxYaw>2.5&&cadence.closestBack<.35&&cadence.midTurnYaw>2.5&&cadence.midTurnYaw<3.5,`${cadence.dtMode} ${cadence.fps}FPS must show the real back: ${JSON.stringify(cadence)}`);
   assert(cadence.finiteBounds&&cadence.inside,`${cadence.dtMode} ${cadence.fps}FPS must remain finite and framed`);
   assert(cadence.idleAction===null&&cadence.finalYawError<.05,`${cadence.dtMode} ${cadence.fps}FPS must settle facing front`);
  }
  assert(result.disposed);assert.deepEqual(errors,[]);
  console.log('PASS deterministic 3D action interruption, morph-in-motion, return to idle and no pose accumulation',result);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
