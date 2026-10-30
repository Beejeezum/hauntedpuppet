import test from 'node:test';
import assert from 'node:assert/strict';
import {SceneFade} from '../../source/attraction-v2/console/scene-fade.mjs';
test('cancelled program change preserves visible opacity and fade velocity',()=>{
 const f=new SceneFade().reset(1,0);f.to(0,0);const before=f.sample(.3),velocity=f.velocity;
 f.to(1,.3);assert.equal(f.value,before);assert.equal(f.velocity,velocity);
 assert(Math.abs(f.sample(.301)-before)<.01);assert(f.sample(1.5)>.999);
 f.to(0,1.5);assert(f.sample(2.2)<.01);f.reset(0,2.3);assert.equal(f.sample(2.4),0);
});
test('rapid repeated fade reversals stay finite, bounded and continuous',()=>{
 const f=new SceneFade();for(let i=0;i<2000;i++){const t=i/120,a=f.sample(t);f.to(i%2,t);assert.equal(f.value,a);assert(Number.isFinite(a)&&a>=0&&a<=1);}
});
