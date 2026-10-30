import test from 'node:test';
import assert from 'node:assert/strict';
import {NightWatch, nightGhostAction} from '../../source/attraction-v2/console/night-watch.mjs';

test('Night watch waits for authored empty exits and a continuous quiet hold',()=>{
 const n=new NightWatch();assert.equal(n.start({eyes:true,spider:true,apparitions:true}),'eyes');assert.equal(n.tick(100,true),null);n.enter(100);
 assert.equal(n.tick(131,true),null);assert.deepEqual(n.tick(132,false),{action:'drain'});assert.equal(n.tick(133,false),null);
 assert.equal(n.tick(134,true),null);assert.equal(n.tick(137,false),null);assert.equal(n.tick(138,true),null);
 assert.deepEqual(n.tick(143,true),{action:'advance',program:'spider'});assert.equal(n.tick(160,true),null);
 n.enter(160);assert.equal(n.tick(185,true),null);assert.equal(n.tick(186,true),null);assert.deepEqual(n.tick(194,true),{action:'advance',program:'apparitions'});
 n.enter(200);assert.equal(n.tick(245,true),null);assert.equal(n.tick(246,true),null);assert.deepEqual(n.tick(251,true),{action:'advance',program:'eyes'});assert.equal(n.inspect().changes,3);
});
test('unavailable scenes are omitted, manual stop cancels, and a stuck exit fails safely',()=>{
 const n=new NightWatch();assert.equal(n.start({spider:true}),'spider');n.enter(0);assert.equal(n.tick(26,true),null);assert.deepEqual(n.tick(34,true),{action:'advance',program:'spider'});
 n.stop();assert.equal(n.tick(100,true),null);assert(!n.inspect().running);assert.throws(()=>n.start({}),/No scene/);
 n.start({eyes:true});n.enter(0);n.tick(32,false);assert.equal(n.tick(53,false).action,'fail');assert(!n.inspect().running);
});
test('ghost passage dwells, travels and vanishes once, with no accidental return during dark hold',()=>{
 assert.deepEqual([0,10,20,30,38,46,100].map(nightGhostAction),['home','left','far','home','vanish','vanish','vanish']);
});
