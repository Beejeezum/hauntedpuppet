const bounded = (v, min, max) => {
  if (!Number.isFinite(v)) throw Error('Use a number for stage placement');
  return Math.min(max, Math.max(min, v));
};
export const sceneDefaults = () => ({schema: 1,
  ghost: {x: 43, y: 50, size: 82, opacity: 100, visible: true},
  eyes: {x: 77, y: 35, size: 30, opacity: 90, visible: true},
  fog: 18, mirror: false, brightness: 100, feather: 0, mask: 'none',
  corners: [[0, 0], [100, 0], [100, 100], [0, 100]]});
export function validCorners(points) {
  if (!Array.isArray(points) || points.length !== 4 || points.some(p => !Array.isArray(p) || p.length !== 2 || p.some(v => !Number.isFinite(v) || v < 0 || v > 100))) return false;
  // Ordered TL, TR, BR, BL. Reject reflections, crossed or collapsed surfaces.
  return points.every((a, i) => {
    const b = points[(i + 1) % 4], c = points[(i + 2) % 4];
    return (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]) > 25;
  });
}
export function layerRect(layer, aspect = 16 / 9) {
  const width = 1280 * layer.size / 100, height = width / aspect;
  return {x: 1280 * layer.x / 100 - width / 2, y: 720 * layer.y / 100 - height / 2, width, height};
}
function layer(value, aspect, max) {
  if (!value || typeof value.visible !== 'boolean') throw Error('Invalid layer');
  const size = bounded(value.size, 10, max), halfX = size / 2, halfY = size * 1280 / aspect / 720 / 2;
  return {x: bounded(value.x, halfX, 100 - halfX), y: bounded(value.y, halfY, 100 - halfY),
    size, opacity: bounded(value.opacity, 0, 100), visible: value.visible};
}
export function validateScene(value) {
  if (value?.schema !== 1 || typeof value.mirror !== 'boolean' || !['none', 'ellipse'].includes(value.mask) || !validCorners(value.corners)) throw Error('Use a valid Wisp yard setup');
  return {schema: 1, ghost: layer(value.ghost, 16 / 9, 100), eyes: layer(value.eyes, 4 / 3, 60),
    fog: bounded(value.fog, 0, 100), mirror: value.mirror, brightness: bounded(value.brightness, 20, 120),
    feather: bounded(value.feather, 0, 20), mask: value.mask, corners: value.corners.map(p => [...p])};
}
export function eyeEnvelope(time, duration) {
  if (!Number.isFinite(time) || !Number.isFinite(duration) || duration <= 0) return 0;
  const q = Math.max(0, Math.min(1, time / .55, (duration - time) / .65));
  return q * q * (3 - 2 * q);
}
