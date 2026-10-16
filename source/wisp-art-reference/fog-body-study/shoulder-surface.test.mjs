import assert from 'node:assert/strict';
import {shoulderSurfacePoint as bind} from './shoulder-surface.mjs';
const root=[375,870],r=120;
for(let angle=0;angle<=180;angle+=5){
 const c=Math.cos(angle*Math.PI/180),torso=(x,y)=>[512+(x-512)*c+8*Math.sin(y/100),y+12];
 const attached=bind([900,500],root,root,r,torso),target=torso(...root);
 assert.ok(Math.hypot(attached[0]-target[0],attached[1]-target[1])<1e-10,'root remains attached');
 for(let a=0;a<Math.PI*2;a+=.1){
  const rest=[root[0]+r*Math.cos(a),root[1]+r*Math.sin(a)],q=[rest[0]+60,rest[1]-30];
  const x=bind(q,rest,root,r,torso);
  assert.ok(Math.hypot(x[0]-q[0],x[1]-q[1])<1e-8,'outer boundary retains arm skinning');
  const inside=[root[0]+(r-.001)*Math.cos(a),root[1]+(r-.001)*Math.sin(a)];
  const y=bind(q,inside,root,r,torso);
  assert.ok(Math.hypot(y[0]-q[0],y[1]-q[1])<1e-6,'smooth boundary release');
 }
}
console.log('Root attachment and outer-region continuity pass through0..180degrees');
