const{chromium,webkit}=require(process.env.HAUNT_PLAYWRIGHT||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await(process.env.HAUNT_BROWSER==='webkit'?webkit:chromium).launch({args:process.env.HAUNT_BROWSER==='webkit'?[]:['--mute-audio']}),page=await browser.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  const base=process.env.HAUNT_TEST_BASE||'http://127.0.0.1:8770';await page.goto(base+'/assets/wisp-performance-studio.html');await page.waitForFunction(()=>window.WispPerformanceStudio?.inspect().frontRig?.ready);
  const report=await page.evaluate(()=>{
   const r=WispPerformanceStudio.rig,events=[{time:0,kind:''},{time:.8,kind:'wave'},{time:1.5,kind:'swoop'},{time:2.2,kind:'twirl'},{time:3,kind:'laugh'},{time:3.4,kind:'exit'},{time:4.4,kind:'surprise'},{time:5.3,kind:'wave'},{time:6.1,kind:''},{time:7,kind:'twirl'},{time:8.4,kind:''}],meshes=[r.frontRig.body,...r.frontRig.arms.map(a=>a.mesh)];
   let event=0,blend=0,previous=null,previousVelocity=null,maxStep=0,maxVelocityChange=0,peakEvent=null,peakChange=null,frames=0;const series=[];
   for(let i=0;i<=600;i++){
    const clock=i/60;while(event<events.length-1&&clock>=events[event+1].time)event++;const cue=events[event],target=clock>=2.6&&clock<6.1?1:0;blend+=(target-blend)*(1-Math.exp(-1/60*5));
    r.render({clock,dt:1/60,state:clock<8.4?'speaking':'idle',action:{kind:cue.kind,at:clock-cue.time},weights:{A:.4+.3*Math.sin(clock*10)},jaw:.5,performer:{eyeBlinkLeft:Math.max(0,Math.sin(clock*2)),eyeBlinkRight:Math.max(0,Math.sin(clock*2-.2)),eyeLookX:Math.sin(clock),eyeLookY:Math.cos(clock)*.3},motion:{float:90,gesture:100}},blend);
    const matrix=r.root.worldTransform,points=[],owners=[];for(const mesh of meshes)for(let k=0;k<mesh.vertices.length;k+=2){const x=mesh.vertices[k],y=mesh.vertices[k+1];points.push(matrix.a*x+matrix.c*y+matrix.tx,matrix.b*x+matrix.d*y+matrix.ty);owners.push({mesh:meshes.indexOf(mesh),vertex:k/2});}
    if(previous){const velocity=points.map((v,k)=>v-previous[k]);let step=0,change=0;for(let k=0;k<velocity.length;k+=2){if(Math.hypot(velocity[k],velocity[k+1])>step){step=Math.hypot(velocity[k],velocity[k+1]);var point=owners[k/2];}if(previousVelocity){const delta=Math.hypot(velocity[k]-previousVelocity[k],velocity[k+1]-previousVelocity[k+1]);if(delta>change){change=delta;var changePoint=owners[k/2];}}}if(step>maxStep){maxStep=step;peakEvent={clock,kind:cue.kind,point};}if(change>maxVelocityChange){maxVelocityChange=change;peakChange={clock,kind:cue.kind,point:changePoint,arms:r.frontRig.inspect().arms};}series.push({clock,step,change,...(clock>=4.7&&clock<=4.9?{arms:r.frontRig.inspect().arms,controls:r.inspect().controls,view:r.frontRig.inspect().viewAngle,root:r.motionRoot,actual:[r.root.x,r.root.y,r.root.scale.x,r.root.scale.y]}:{} )});previousVelocity=velocity;}
    if(!r.inspect().bounds.inside)throw Error('Interrupted action left stage');previous=points;frames++;
   }
   return{frames,maxStep,maxVelocityChange,peakEvent,peakChange,series,final:r.inspect().action,mouth:r.inspect().mouth,scope:'Actual painted mesh vertices transformed to screen pixels at 60Hz; scripted interruptions and synthetic facial inputs'};
  });
  fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/wisp-performance-continuity.json',JSON.stringify(report,null,2));
  assert(report.maxStep<35,'Visible one-frame jump '+JSON.stringify(report.peakEvent)+' '+report.maxStep);assert(report.maxVelocityChange<30,'Abrupt one-frame velocity change '+report.maxVelocityChange);assert.equal(report.final,null);assert.equal(report.mouth,'rest');assert.deepEqual(errors,[]);
  const{series,peakChange,...summary}=report;console.log('PASS layered screen-space interruption continuity',summary);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
