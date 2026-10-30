import {EyeFilm} from './eye-film.mjs';
import {eyeEnvelope} from './scene-settings.mjs';

/** Two native eye performances, independently timed; relocate only in darkness. */
export class WatchfulEyes {
  constructor() { this.slots = [0, 1].map(i => ({film: new EyeFilm(), x: 340 + i * 550, y: 260, width: 340, release: 0, plays: 0})); this.started = false; this.seed = 417; }
  random() { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; }
  async load() { await Promise.all(this.slots.map(s => s.film.load())); this.ready = this.slots.every(s => s.film.ready); if (!this.ready) this.error = this.slots.find(s => s.film.error)?.film.error || 'Eyes could not load'; }
  start(now) { this.stop(); this.finishing = false; this.started = true; this.slots.forEach((s, i) => { s.release = now + i * 1.7; s.plays = s.film.plays; }); }
  finish() { this.finishing = true; }
  draw(ctx, now) {
    if (!this.started || !this.ready) return;
    for (const [i, s] of this.slots.entries()) {
      if (now < s.release) continue;
      const was = s.film.active; s.film.tick(now, true, !this.finishing);
      if (s.film.plays !== s.plays) {
        s.plays = s.film.plays; s.width = 260 + this.random() * 170;
        const other = this.slots[1 - i];
        for (let n = 0; n < 8; n++) { s.x = 240 + this.random() * 800; s.y = 190 + this.random() * 320; if (Math.hypot(s.x-other.x, s.y-other.y) > 290) break; }
      }
      if (was && !s.film.active) s.film.nextAt = now + 2.8 + this.random() * 6;
      const video = s.film.video;
      if (s.film.active && video.readyState >= 2) {
        const alpha = eyeEnvelope(video.currentTime, video.duration) * s.film.visibility;
        ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = alpha * .92;
        ctx.drawImage(video, s.x-s.width/2, s.y-s.width*.375, s.width, s.width*.75); ctx.restore();
      }
    }
  }
  stop() { this.started = false; this.slots.forEach(s => s.film.stop()); }
  dispose() { this.stop(); this.slots.forEach(s => s.film.dispose()); }
  inspect() { return {ready: !!this.ready, started: this.started, finishing:!!this.finishing, clear:this.slots.every(s=>!s.film.active&&!s.film.pending), error: this.error || null, slots: this.slots.map(s => ({x:s.x,y:s.y,width:s.width,...s.film.inspect()}))}; }
}
