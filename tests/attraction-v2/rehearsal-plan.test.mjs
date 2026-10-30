import test from 'node:test';
import assert from 'node:assert/strict';
import {RehearsalPlan, routeFor, validateSettings} from '../../source/attraction-v2/console/rehearsal-plan.mjs';

test('every form change includes its painted transformation', () => {
  assert.deepEqual(routeFor('friendly', 'spook'), ['to-scary', 'scary']);
  assert.deepEqual(routeFor('scary', 'welcome'), ['to-cute', 'return', 'wave', 'friendly']);
  assert.deepEqual(routeFor('friendly', 'welcome'), ['wave', 'friendly']);
  assert.throws(() => routeFor('friendly', 'wander'));
});
test('latest uncommitted intention wins; auto clears pending takeover', () => {
  const plan = new RehearsalPlan({schema: 1, tone: 'mischief', pace: 'balanced', sequence: []}); plan.request('welcome'); plan.request('spook');
  assert.deepEqual(plan.choose('friendly', 2), ['to-scary', 'scary']);
  plan.request('welcome'); plan.setMode('auto');
  assert.equal(plan.pending, null); assert.deepEqual(plan.choose('scary', 3), ['scary']);
});
test('gentle recovers to cute and skips scary entries without stalling', () => {
  const plan = new RehearsalPlan({schema: 1, tone: 'gentle', pace: 'balanced', sequence: ['spook', 'welcome']});
  assert.throws(() => plan.request('spook'));
  assert.deepEqual(plan.choose('scary', 12), ['to-cute', 'return', 'friendly']);
  plan.setMode('auto'); plan.sequenceOn = true;
  assert.deepEqual(plan.choose('friendly', 30), ['wave', 'friendly']);
  assert.equal(plan.cursor, 2);
});
test('ordered sequences repeat and the action interval respects pace', () => {
  const plan = new RehearsalPlan({schema: 1, tone: 'mischief', pace: 'relaxed', sequence: ['welcome', 'spook', 'welcome']});
  plan.setMode('auto'); plan.sequenceOn = true;
  assert.deepEqual(plan.choose('friendly', 25), ['friendly']);
  assert.deepEqual(plan.choose('friendly', 37), ['wave', 'friendly']);
  assert.deepEqual(plan.choose('friendly', 74), ['to-scary', 'scary']);
  assert.deepEqual(plan.choose('scary', 111), ['to-cute', 'return', 'wave', 'friendly']);
  assert.deepEqual(plan.choose('friendly', 148), ['wave', 'friendly']);
});
test('settings are bounded and copied, stop clears queued work', () => {
  const plan = new RehearsalPlan(); plan.request('welcome'); plan.reset(); assert.equal(plan.pending, null);
  const saved = plan.settings(); saved.sequence.push('welcome'); assert.deepEqual(plan.sequence, []);
  assert.throws(() => validateSettings({...saved, sequence: ['wander']}));
  assert.throws(() => validateSettings({...saved, sequence: Array(25).fill('welcome')}));
  assert.throws(() => validateSettings({...saved, pace: 'instant'}));
});
