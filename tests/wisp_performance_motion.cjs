const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const source=fs.readFileSync('assets/wisp-performance/motion.js','utf8');
 const{PerformanceMotionRig,CONTROL_KEYS}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const pose={head:[526,588],chest:[526,930],tail:[530,1370],left:[190,970],right:[900,990]};
 const simulate=hz=>{const rig=new PerformanceMotionRig();let result;for(let i=0;i<=hz*3;i++)result=rig.sample(pose,{clock:i/hz,dt:1/hz,action:{kind:'wave',at:i/hz},motion:{float:100}});return{rig,result}};
 const a=simulate(60),b=simulate(120);let error=0;for(const key of CONTROL_KEYS)for(let j=0;j<2;j++)error=Math.max(error,Math.abs(a.result.points[key][j]-b.result.points[key][j]));assert(error<.5,'Frame-rate drift '+error);
 // A pose interruption must not teleport local controls to a distant new drawing.
 const before=a.result.points.left[0],changed={...pose,left:[650,500]};
 const after=a.rig.sample(changed,{clock:3+1/60,dt:1/60});assert(Math.abs(after.points.left[0]-before)<25);assert(Math.abs(after.points.left[0]-changed.left[0])>200);
 // Held drawings contain independent arm/wrist movement, not a rigid body offset.
 const rig=new PerformanceMotionRig(),frames=[];for(let i=0;i<180;i++)frames.push(rig.sample(pose,{clock:i/60,dt:1/60,action:{kind:'wave',at:i/60}}));
 const relative=frames.map(f=>f.points.left[0]-f.points.leftShoulder[0]);assert(Math.max(...relative)-Math.min(...relative)>20);
 const rotation=frames.map(f=>f.rotations.left);assert(Math.max(...rotation)-Math.min(...rotation)>.1);
 const frozen=rig.sample(pose,{clock:4,freeze:true});assert.deepEqual(frozen.points.head,pose.head);assert.equal(frozen.rotations.left,0);
 const reduced=rig.sample(pose,{clock:4.1,reduced:true});assert.deepEqual(reduced.points.left,pose.left);
 for(const f of frames)for(const key of CONTROL_KEYS)assert(f.points[key].every(Number.isFinite));

 const reelSource=fs.readFileSync('assets/wisp-performance/reel.js','utf8'),{performanceFrame}=await import('data:text/javascript;base64,'+Buffer.from(reelSource).toString('base64'));
 const phases=new Set();for(let i=0;i<=900;i++){const frame=performanceFrame(i/60);phases.add(frame.phase);assert(frame.evil>=0&&frame.evil<=1);if(frame.params.state!=='speaking')assert.equal(frame.params.jaw,0);}assert.equal(phases.size,8);assert.equal(performanceFrame(15).evil,0);assert.equal(performanceFrame(13.5).evil,1);
 console.log('PASS independent wrist/elbow motion, interruption continuity, reduced motion, finite controls, 60/120Hz drift',error.toFixed(3));
})().catch(e=>{console.error(e);process.exitCode=1});
