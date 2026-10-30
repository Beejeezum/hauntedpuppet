/** Opacity with continuous value/velocity when a scene change is cancelled. */
export class SceneFade {
  reset(value = 0, now = 0) { this.value = this.target = value; this.velocity = 0; this.at = now; return this; }
  constructor() { this.reset(); }
  sample(now) {
    const dt = Math.max(0, now - this.at), omega = 10;
    const offset = this.value - this.target, c = this.velocity + omega * offset, decay = Math.exp(-omega * dt);
    this.value = this.target + (offset + c * dt) * decay;
    this.velocity = (this.velocity - omega * c * dt) * decay;
    this.at = Math.max(this.at, now);
    if (this.value < 0 || this.value > 1) { this.value = Math.max(0, Math.min(1, this.value)); this.velocity = 0; }
    return this.value;
  }
  to(target, now) { this.sample(now); this.target = target ? 1 : 0; }
}
