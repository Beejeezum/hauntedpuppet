import test from 'node:test';
import assert from 'node:assert/strict';
import {AfterDarkSoundScore} from '../../source/attraction-v2/console/after-dark-sound.mjs';

test('spider gestures follow three visible actions per cycle and leave the dark hold quiet',()=>{
 const score=new AfterDarkSoundScore(),events=[];
 for(let frame=0;frame<36*60*3;frame++){const elapsed=frame/60;for(const e of score.tick({program:'spider',elapsed}))events.push({at:elapsed,...e});}
 assert.equal(events.length,9);assert.deepEqual(events.slice(0,3).map(e=>e.cue),['drift','wake','drift']);
 assert(events.every(e=>e.at%36<21));
});
test('ghost departure has one vapor gesture and no sound through the empty Night watch hold',()=>{
 const score=new AfterDarkSoundScore(),events=[];
 for(let f=0;f<52*60;f++)for(const e of score.tick({program:'apparitions',elapsed:f/60,night:true}))events.push({at:f/60,...e});
 assert.equal(events.filter(e=>e.cue==='vapor').length,1);assert.equal(events.at(-1).at,38);assert.equal(events.length,5);
});
test('sound enabled mid-scene does not replay missed actions or duplicate projector callbacks',()=>{
 const score=new AfterDarkSoundScore();assert.deepEqual(score.tick({program:'spider',elapsed:15.9}),[]);
 assert.deepEqual(score.tick({program:'spider',elapsed:15.9}),[]);
 assert.deepEqual(score.tick({program:'spider',elapsed:22}),[]);
 score.reset();score.tick({program:'spider',elapsed:3.99});assert.equal(score.tick({program:'spider',elapsed:4.01}).length,1);assert.equal(score.tick({program:'spider',elapsed:4.01}).length,0);
});
test('native eye appearances alternate subtle gestures and never repeat a held performance',()=>{
 const score=new AfterDarkSoundScore(),slot={plays:0,active:false,time:0,x:240};
 score.tick({program:'eyes',elapsed:0,eyes:[slot]});
 slot.plays=1;slot.active=true;slot.time=.1;const first=score.tick({program:'eyes',elapsed:.1,eyes:[slot]});assert.equal(first.length,1);assert(first[0].pan<0);
 assert.deepEqual(score.tick({program:'eyes',elapsed:.2,eyes:[slot]}),[]);
 slot.plays=2;assert.deepEqual(score.tick({program:'eyes',elapsed:10,eyes:[slot]}),[]);
 slot.plays=3;slot.time=1;assert.deepEqual(score.tick({program:'eyes',elapsed:20,eyes:[slot]}),[],'Never backfill a sound after the eyes already appeared');
});
