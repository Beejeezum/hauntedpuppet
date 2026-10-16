import assert from 'node:assert/strict';
import {eyeTurnSurface as surface} from './eye-turn-surface.mjs';
for(const side of ['left','right']){
 assert.equal(surface(0,side).width,1);
 assert.equal(surface(0,side).visibility,1);
 for(let yaw=0;yaw<=180;yaw+=.1){
  const p=surface(yaw,side),q=surface(yaw+.01,side);
  assert.ok(Number.isFinite(p.width)&&p.width>0&&p.width<=1.12);
  assert.ok(p.visibility>=0&&p.visibility<=1);
  assert.ok(Math.abs(p.visibility-q.visibility)<.01,'no occlusion pop');
 }
}
assert.equal(surface(60,'right').visibility,0,'far eye hidden before profile');
assert.ok(surface(90,'left').visibility>.99,'near eye remains in profile');
assert.equal(surface(135,'left').visibility,0,'no face visible on rear');
console.log('Eye patch continuity and front/profile/rear visibility pass');
