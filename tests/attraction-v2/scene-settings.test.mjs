import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sceneDefaults, validateScene, layerRect, validCorners, eyeEnvelope} from '../../source/attraction-v2/console/scene-settings.mjs';
test('placement keeps full source rectangles on stage at every requested size/position', () => {
  for (const name of ['ghost', 'eyes']) for (const size of [10, 30, 60, 100]) for (const x of [-20, 0, 50, 100, 500]) for (const y of [-20, 0, 50, 100, 500]) {
    const state = sceneDefaults(); Object.assign(state[name], {x, y, size});
    const rect = layerRect(validateScene(state)[name], name === 'eyes' ? 4 / 3 : 16 / 9);
    assert(rect.x >= -1e-8 && rect.y >= -1e-8 && rect.x + rect.width <= 1280.00001 && rect.y + rect.height <= 720.00001);
  }
});
test('bad storage cannot turn into a crossed surface, NaN transform or foreign settings', () => {
  for (const corners of [[[0, 0], [100, 100], [100, 0], [0, 100]], [[0, 0], [0, 0], [0, 0], [0, 0]], [[0, 0], [100, 0], [100, 100], [NaN, 100]]]) assert(!validCorners(corners));
  const state = sceneDefaults(); state.ghost.size = Infinity; assert.throws(() => validateScene(state));
  assert.throws(() => validateScene({...sceneDefaults(), schema: 2}));
  const original = sceneDefaults(), normalized = validateScene(original); normalized.corners[0][0] = 10; assert.equal(original.corners[0][0], 0);
});
test('eyes disappear at both native endpoints before any rewind; no held endpoint', () => {
  assert.equal(eyeEnvelope(0, 3.5), 0); assert.equal(eyeEnvelope(3.5, 3.5), 0); assert.equal(eyeEnvelope(4, 3.5), 0);
  assert.equal(eyeEnvelope(1, 3.5), 1); assert.equal(eyeEnvelope(NaN, 3.5), 0);
  assert(eyeEnvelope(.1, 3.5) < eyeEnvelope(.3, 3.5));
});
