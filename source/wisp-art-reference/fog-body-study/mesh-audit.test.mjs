import assert from 'node:assert/strict';
import {auditMesh} from './mesh-audit.mjs';
const rest=[0,0,10,0,0,10,10,10],ix=[0,1,2,1,3,2],uv=[0,0,1,0,0,1,1,1];
assert.equal(auditMesh(rest,rest,ix,uv).inverted,0);
const flipped=[0,0,10,0,0,-10,10,-10];assert.equal(auditMesh(rest,flipped,ix,uv).inverted,2);
assert.equal(auditMesh(rest,[0,0,10,0,0,0,10,0],ix,uv).collapsed,2);
assert.equal(auditMesh(rest,rest.map((x,i)=>x+(i%2?20:30)),ix,uv).minimumRatio,1);
console.log('Mesh audit detects inverted/collapsed triangles and ignores translation');

assert.equal(auditMesh(rest,flipped,ix,uv,()=>0).paintedInverted,0,'empty triangles excluded from painted count');
assert.equal(auditMesh(rest,flipped,ix,uv,()=>255).paintedInverted,2,'painted triangle inversions included');
