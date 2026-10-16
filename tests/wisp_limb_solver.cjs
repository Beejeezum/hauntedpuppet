const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const source=fs.readFileSync('assets/wisp-performance/limb-solver.js','utf8'),{solveArm,distance,boneTransform,bindArmPoint,skinArmPoint}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 let samples=0,maxError=0;
 for(const side of ['left','right'])for(let angle=-Math.PI;angle<Math.PI;angle+=.1)for(const radius of [40,100,200,300,400,700]){
  const shoulder=[500,850],palm=[500+Math.cos(angle)*radius,850+Math.sin(angle)*radius],result=solveArm(shoulder,palm,{upper:140,lower:120,hand:65,side,handAngle:angle});
  const j=result.joints;assert(Math.abs(distance(j[0],j[1])-140*result.upperStretch)<1e-6);assert(Math.abs(distance(j[1],j[2])-120*result.lowerStretch)<1e-6);assert(Math.abs(distance(j[2],j[3])-65)<1e-6);assert(result.stretch>=1&&result.stretch<=1.75);assert(j.flat().every(Number.isFinite));
  if(radius>=100&&radius<=400){maxError=Math.max(maxError,result.reachError);assert(result.reachError<1e-6);}
  samples++;
 }
 const tight=solveArm([0,0],[80,0],{upper:170,lower:100,hand:75,side:'left',handAngle:0});assert(tight.reachError<1e-6);assert.equal(tight.handAngle,0);assert(tight.lowerStretch>1.3,'Tight folds should lengthen the shorter ghost segment without snapping the wrist');
 const joints=[[0,0],[100,150],[230,180],[290,180]],bones=[0,1,2].map(i=>boneTransform(joints[i],joints[i+1],joints[i],joints[i+1]));
 for(let y=-50;y<250;y+=15)for(let x=-50;x<350;x+=15){const weights=bindArmPoint(x,y,joints),p=skinArmPoint(x,y,weights,bones);assert(Math.abs(weights.reduce((a,b)=>a+b,0)-1)<1e-8);assert(distance(p,[x,y])<1e-6);}
 // Skin and skeleton share the exact wrist and palm, including a large articulated turn.
 const target=[[30,40],[20,-80],[-60,-180],[-80,-240]],transforms=[0,1,2].map(i=>boneTransform(joints[i],joints[i+1],target[i],target[i+1]));
 for(const i of [0,1,2,3]){const p=skinArmPoint(...joints[i],bindArmPoint(...joints[i],joints),transforms);assert(distance(p,target[i])<1e-6);}
 console.log('PASS bounded two-link reach, segment lengths, fixed hand volume, finite extreme poses, identity skin, shared joints',samples,'samples',maxError);
})().catch(e=>{console.error(e);process.exitCode=1});
