import assert from 'node:assert/strict';
import {skinArmPointPolar} from './rotation-skinning.js';
import {boneTransform,bindArmPoint,distance} from '../../../assets/wisp-performance/limb-solver.js';
const rest=[[0,-100],[0,0],[0,100],[0,150]];
let probes=0;
for(const degrees of [0,45,90,135,170,179]){
 const angle=degrees*Math.PI/180,target=[[0,-100],[0,0],[100*Math.sin(angle),100*Math.cos(angle)],[150*Math.sin(angle),150*Math.cos(angle)]];
 const bones=[0,1,2].map(i=>boneTransform(rest[i],rest[i+1],target[i],target[i+1]));
 for(let a=0;a<Math.PI*2;a+=.05){
  const p=[10*Math.cos(a),10*Math.sin(a)],q=skinArmPointPolar(...p,[.5,.5,0],bones);
  assert(Math.abs(distance(q,[0,0])-10)<1e-8,'Constant-weight elbow ring loses volume');probes++;
 }
 for(let i=0;i<rest.length;i++)assert(distance(skinArmPointPolar(...rest[i],bindArmPoint(...rest[i],rest),bones),target[i])<1e-6,'Shared joint moved');
}
const identity=[0,1,2].map(i=>boneTransform(rest[i],rest[i+1],rest[i],rest[i+1]));
for(let x=-50;x<=50;x+=5)for(let y=-150;y<=200;y+=5)assert(distance(skinArmPointPolar(x,y,bindArmPoint(x,y,rest),identity),[x,y])<1e-8);
// At a weight-support boundary the two-bone blend must approach the single bone.
const target=[[0,-100],[0,0],[100,0],[150,0]],bones=[0,1,2].map(i=>boneTransform(rest[i],rest[i+1],target[i],target[i+1]));
for(const w of [1e-8,1-1e-8]){
 const p=skinArmPointPolar(15,3,[1-w,w,0],bones),q=skinArmPointPolar(15,3,w<.5?[1,0,0]:[0,1,0],bones);
 assert(distance(p,q)<1e-5);
}
console.log('PASS experimental polar elbow rings, exact shared joints, identity and influence-boundary continuity',probes);
