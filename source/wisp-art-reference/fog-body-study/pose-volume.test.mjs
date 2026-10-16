import assert from 'node:assert/strict';
import {armVolumeFloor as volume} from './pose-volume.mjs';
const joints=d=>[[0,0],[100,0],[100+100*Math.cos(d*Math.PI/180),100*Math.sin(d*Math.PI/180)]];
assert.equal(volume(joints(90)),1.35);
assert.equal(volume(joints(160)),0);
let previous=1.35;
for(let angle=125;angle<=151;angle+=.01){const v=volume(joints(angle));assert.ok(v>=0&&v<=1.35);assert.ok(v<=previous+1e-9);assert.ok(Math.abs(v-previous)<.002);previous=v;}
assert.equal(volume([[0,0],[0,0],[0,0]]),0);
console.log('Pose volume is continuous and releases extra width through tight folds');
