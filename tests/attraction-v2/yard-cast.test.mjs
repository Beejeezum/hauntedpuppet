import test from 'node:test';
import assert from 'node:assert/strict';
import {CAST_KEY, chooseCast, readCast, validateCast, castLabel} from '../../source/attraction-v2/console/yard-cast.mjs';
import {speechSpec, YardSpeech} from '../../source/attraction-v2/console/yard-speech.mjs';

test('missing, corrupt, wrong-form and unsupported cast choices cannot install a voice', () => {
  for (const value of [null, {}, [], 'friendly-c', {friendly:'evil-c'}, {scary:'friendly-c'}, {friendly:'__proto__'}, {friendly:'friendly-a'}, {friendly:{voice:'marin'}}]) assert.deepEqual(validateCast(value), {});
  assert.deepEqual(readCast({getItem:()=>'{broken'}), {});
  assert.deepEqual(readCast({getItem:()=>{throw Error('blocked');}}), {});
  assert.equal(castLabel('friendly', {}), 'Choose a voice');
});
test('explicit installation preserves the other form, and cannot claim success if storage fails', () => {
  let saved = null; const storage = {getItem:key=>{assert.equal(key,CAST_KEY);return saved;},setItem:(key,value)=>{assert.equal(key,CAST_KEY);saved=value;}};
  assert.deepEqual(chooseCast('friendly-c',storage), {friendly:'friendly-c'});
  assert.deepEqual(chooseCast('evil-c',storage), {friendly:'friendly-c',scary:'evil-c'});
  assert.throws(()=>chooseCast('evil-a',storage), /not connected/);
  assert.throws(()=>chooseCast('friendly-c',{getItem:()=>null,setItem:()=>{throw Error('blocked');}}), /blocked/);
  assert.equal(castLabel('scary',readCast(storage)), 'Dark, amused spirit');
});
test('new lines snapshot the chosen cast and preserve exact words, without pitch or speed tricks', () => {
  const choices = {friendly:'friendly-c',scary:'evil-c'};
  const cute = speechSpec('  Happy Halloween, Maya!  ','friendly',choices);
  const evil = speechSpec('Who goes there?','scary',choices);
  assert.equal(cute.voice,'marin'); assert.equal(evil.voice,'cedar');
  assert.equal(cute.text,'Happy Halloween, Maya!'); assert.equal(evil.text,'Who goes there?');
  assert.equal(cute.speed,1); assert.equal(evil.speed,1); assert.equal(cute.provider,'openai');
  choices.friendly='evil-c'; assert.equal(cute.voice,'marin');
  assert.equal(speechSpec('Hi','friendly',choices).voice,'marin');
  assert(!Object.hasOwn(cute,'id') && !Object.hasOwn(cute,'name') && !Object.hasOwn(cute,'form'));
  assert(cute.instructions.length <= 1000 && evil.instructions.length <= 1000);
});

test('unselected or rejected casting cannot enqueue a paid generation', () => {
  const speech = new YardSpeech({player:{},scene:{},film:{}});
  assert.throws(()=>speech.enqueue('Hello','friendly'),/Choose a connected character voice/);
  assert.equal(speech.queue.length,0); assert.equal(speech.active,null);
  assert.deepEqual(speech.inspect().castReady,{friendly:false,scary:false});
});
