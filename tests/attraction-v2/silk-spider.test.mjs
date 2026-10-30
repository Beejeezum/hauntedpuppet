import test from 'node:test';
import assert from 'node:assert/strict';
import {silkBeat,legPose} from '../../source/attraction-v2/console/silk-spider.mjs';

test('spider has deliberate dark relocation, visible descent/acting/climb, bounded envelopes',()=>{
 const seen=new Set();for(let t=0;t<144;t+=1/60){const b=silkBeat(t);seen.add(b.phase);assert(b.alpha>=0&&b.alpha<=1);assert(b.y>=165&&b.y<=360);assert(b.climb>=0&&b.climb<=1);assert(b.reach>=0&&b.reach<=1);}
 for(const phase of ['empty','emerge','descend','watch','reach','recoil','climb','leave'])assert(seen.has(phase));
 for(let c=1;c<4;c++){assert.equal(silkBeat(c*36-.01).alpha,0);assert.equal(silkBeat(c*36+.01).alpha,0);assert.notEqual(silkBeat(c*36-1).x,silkBeat(c*36+1).x);}
});
test('all eight legs retain bone lengths and keep independently moving while hanging',()=>{
 for(let pair=0;pair<4;pair++)for(const side of [-1,1]){
  const start=legPose(pair,side,silkBeat(9)),measure=p=>p.slice(1).map((v,i)=>Math.hypot(v[0]-p[i][0],v[1]-p[i][1]));const lengths=measure(start);
  for(let t=3;t<26;t+=.13){const pose=legPose(pair,side,silkBeat(t));assert.equal(pose.length,4);measure(pose).forEach((n,i)=>assert(Math.abs(n-lengths[i])<1e-9));}
  const later=legPose(pair,side,silkBeat(11));assert(Math.hypot(later[3][0]-start[3][0],later[3][1]-start[3][1])>1);
 }
});
test('cue boundaries do not pop the body or jointed legs',()=>{
 for(const t of [3,4,8.5,15.4,16.7,18.4,19,19.65,20,20.4,21.5,24.6,25,26]){
  const a=silkBeat(t-.0001),b=silkBeat(t+.0001);assert(Math.abs(a.y-b.y)<.03);assert(Math.abs(a.alpha-b.alpha)<.001);
  for(let pair=0;pair<4;pair++)for(const side of [-1,1]){const p=legPose(pair,side,a),q=legPose(pair,side,b);for(let i=0;i<4;i++)assert(Math.hypot(p[i][0]-q[i][0],p[i][1]-q[i][1])<.15,`joint pop at ${t}`);}
 }
});
