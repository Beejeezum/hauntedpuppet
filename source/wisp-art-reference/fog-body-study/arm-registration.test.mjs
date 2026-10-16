import assert from 'node:assert/strict';
import {triangulate,affine,CUTE_POINTS,EVIL_POINTS} from './arm-registration.mjs';
const triangles=triangulate(CUTE_POINTS);assert(triangles.length>20);const used=new Set(triangles.flat());assert.equal(used.size,CUTE_POINTS.length);
for(const t of triangles){const from=t.map(i=>EVIL_POINTS[i]),to=t.map(i=>CUTE_POINTS[i]),m=affine(from,to);for(let i=0;i<3;i++){const x=m[0]*from[i][0]+m[2]*from[i][1]+m[4],y=m[1]*from[i][0]+m[3]*from[i][1]+m[5];assert(Math.hypot(x-to[i][0],y-to[i][1])<1e-7);}assert(m[0]*m[3]-m[1]*m[2]>0,'folded correspondence '+t);}
console.log('PASS all landmarks represented; positive affine maps hit registered landmarks');

const area=(a,b,c)=>Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2;
assert.equal(triangles.reduce((sum,t)=>sum+area(...t.map(i=>CUTE_POINTS[i])),0),1024*1536,'triangles cover complete registration canvas');
