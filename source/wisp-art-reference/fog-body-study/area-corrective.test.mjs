import assert from 'node:assert/strict';
import {correctAreas} from './area-corrective.mjs';
const c=[{a:0,b:2,c:4,sign:1,minimum:4}],area=p=>((p[2]-p[0])*(p[5]-p[1])-(p[3]-p[1])*(p[4]-p[0]))/2;
for(const initial of [[0,0,10,0,0,-10],[0,0,10,0,5,0]]){
 const p=Float32Array.from(initial);correctAreas(p,c);assert.ok(area(p)>=3.999,'inverted/flat triangle repaired');
 for(const axis of [0,1])assert.ok(Math.abs(p[axis]+p[axis+2]+p[axis+4]-initial[axis]-initial[axis+2]-initial[axis+4])<1e-5,'centroid retained');
}
const p=Float32Array.from([0,0,10,0,0,10]);correctAreas(p,c);assert.deepEqual([...p],[0,0,10,0,0,10],'valid triangle stays fixed');
console.log('Area corrective repairs isolated inversion/flattening without drifting valid geometry');
