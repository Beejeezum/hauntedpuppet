import test from 'node:test';
import assert from 'node:assert/strict';
import {RehearsalPlan} from '../../source/attraction-v2/console/rehearsal-plan.mjs';
import {ApparitionMotion} from '../../source/attraction-v2/console/apparition-motion.mjs';
import {speechSpec} from '../../source/attraction-v2/console/yard-speech.mjs';

for (const [tone, form, excluded] of [['gentle', 'friendly', 'spook'], ['haunted', 'scary', 'welcome']]) {
  test(`${tone} holds its form through three simulated hours and incompatible playlists`, () => {
    const p = new RehearsalPlan({schema: 1, tone, pace: 'lively', sequence: ['spook', 'welcome', 'notice']});
    assert.equal(p.initialForm, form); p.setMode('auto'); p.sequenceOn = true;
    for (let t = 0; t < 10800; t += 5) {
      const route = p.choose(form, t); assert(route.every(id => form === 'friendly' ? ['friendly', 'wave'].includes(id) : id === 'scary'));
    }
    assert.throws(() => p.request(excluded));
    p.stop?.(); p.reset(); assert.equal(p.initialForm, form);
  });
}
test('form change keeps an allowed pending action through its morph; speech prevents auto-switch', () => {
  const p = new RehearsalPlan({schema: 1, tone: 'haunted', pace: 'lively', sequence: []});
  p.update({...p.settings(), tone: 'gentle'}); p.request('welcome');
  assert.deepEqual(p.choose('scary', 10), ['to-cute', 'return', 'wave', 'friendly']);
  assert.equal(p.pending, null); assert.deepEqual(p.choose('friendly', 15), ['friendly']);
  p.update({...p.settings(), tone: 'mischief'}); p.setMode('auto'); p.holdSpeech('scary');
  assert.deepEqual(p.choose('friendly', 20), ['to-scary', 'scary']);
  assert.deepEqual(p.choose('scary', 200), ['scary']);
  p.holdSpeech(null); assert.deepEqual(p.choose('scary', 205), ['to-cute', 'return', 'wave', 'friendly']);
});
test('spatial cue interruptions preserve position and velocity, stay bounded, stop resets', () => {
  const m = new ApparitionMotion(); m.tick(0); m.request('far', 0);
  for (let i = 1; i < 50; i++) m.tick(i / 60);
  const position = {...m.value}, velocity = {...m.velocity}; m.request('near', 50 / 60);
  assert.deepEqual(m.value, position); assert.deepEqual(m.velocity, velocity);
  for (let i = 50; i < 600; i++) {
    const value = m.tick(i / 60), r = m.place({x:0,y:0,width:1280,height:720}, value);
    assert(r.x >= 24 && r.y >= 24 && r.x+r.width <= 1256 && r.y+r.height <= 696);
  }
  assert(Math.abs(m.value.scale - 1.08) < .001); m.reset(); assert.equal(m.value.alpha, 1);
});
test('voice lines are bounded and select distinct acting profiles without changing supplied words', () => {
  const cute = speechSpec(' Welcome, little ghost! ', 'friendly'), evil = speechSpec('Who goes there?', 'scary');
  assert.equal(cute.text, 'Welcome, little ghost!'); assert.notEqual(cute.voice, evil.voice);
  assert.throws(() => speechSpec('x'.repeat(241), 'friendly')); assert.throws(() => speechSpec('Hi', 'other'));
  assert.throws(() => speechSpec('Hi', '__proto__')); assert.throws(() => speechSpec('Hi', 'constructor'));
});
