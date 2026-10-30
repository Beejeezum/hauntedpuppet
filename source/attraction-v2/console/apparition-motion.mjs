const targets = {
  near: {scale: 1.08, x: 0, y: 0}, far: {scale: .68, x: 0, y: -16},
  left: {scale: .88, x: -105, y: 0}, right: {scale: .88, x: 105, y: 0},
  home: {scale: 1, x: 0, y: 0, alpha: 1}, vanish: {alpha: 0}, appear: {alpha: 1},
};
/** Critically damped motion preserves velocity when an operator changes their mind. */
export class ApparitionMotion {
  constructor() { this.reset(); }
  reset() { this.value = {scale: 1, x: 0, y: 0, alpha: 1}; this.target = {...this.value}; this.velocity = {scale: 0, x: 0, y: 0, alpha: 0}; this.last = null; this.fogUntil = 0; this.action = null; }
  request(action, now) {
    if (action !== 'fog' && !Object.hasOwn(targets, action)) throw Error('Unknown movement');
    if (action === 'fog' || action === 'vanish' || action === 'appear') this.fogUntil = now + 4;
    if (targets[action]) Object.assign(this.target, targets[action]);
    this.action = action;
  }
  tick(now) {
    const dt = this.last === null ? 0 : Math.max(0, Math.min(.1, now - this.last)); this.last = now;
    for (const key of Object.keys(this.value)) {
      const w = key === 'alpha' ? 3.4 : 2, x = this.value[key] - this.target[key], v = this.velocity[key], k = v + w * x, e = Math.exp(-w * dt);
      this.value[key] = this.target[key] + (x + k * dt) * e;
      this.velocity[key] = (v - w * k * dt) * e;
    }
    return {...this.value, fog: Math.sin(Math.PI * Math.max(0, Math.min(1, (this.fogUntil - now) / 4))) ** 2};
  }
  place(rect, value) {
    const scale = Math.min(value.scale, 1232 / rect.width, 672 / rect.height);
    const width = rect.width * scale, height = rect.height * scale;
    const x = Math.max(24, Math.min(1256 - width, rect.x + rect.width / 2 + value.x - width / 2));
    const y = Math.max(24, Math.min(696 - height, rect.y + rect.height / 2 + value.y - height / 2));
    return {x, y, width, height};
  }
  inspect() { return {action: this.action, value: {...this.value}, target: {...this.target}}; }
}
