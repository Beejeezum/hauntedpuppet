import {ProjectionMapper} from '../../../assets/projection-mapping.js';
import {SpiritAtmosphere} from '../../../assets/spirit-atmosphere.js';
import {EyeFilm} from './eye-film.mjs';
import {sceneDefaults, validateScene, layerRect, eyeEnvelope} from './scene-settings.mjs';
import {ApparitionMotion} from './apparition-motion.mjs';
import {GhostLettering} from './ghost-lettering.mjs';

/** Compose original footage and painted vapor before one calibrated output. */
export class YardScene {
  constructor(target) {
    this.target = target; this.context = target.getContext('2d'); this.settings = sceneDefaults();
    this.canvas = document.createElement('canvas'); this.canvas.width = 1280; this.canvas.height = 720; this.ctx = this.canvas.getContext('2d');
    this.mapper = new ProjectionMapper(); this.vapor = new SpiritAtmosphere(); this.eyes = new EyeFilm();
    this.motion = new ApparitionMotion(); this.lettering = new GhostLettering();
    this.running = false; this.frames = 0; this.lastPaint = -Infinity; this.disposed = false;
  }
  async load() { await Promise.all([this.eyes.load(), this.vapor.load('../../../assets/spirit-effects/')]); }
  set(settings) { this.settings = validateScene(settings); this.lastPaint = -Infinity; }
  render(film, state, {tone = 'mischief', now = performance.now(), overlay = null, opacity = 1} = {}) {
    if (this.disposed) return;
    if (!state?.running) { this.stop(); return; }
    this.running = true;
    if (now - this.lastPaint < 1000 / 30) return;
    this.lastPaint = now; const s = this.settings, ctx = this.ctx, t = now / 1000, movement = this.motion.tick(t), rect = this.motion.place(layerRect(s.ghost), movement);
    this.eyes.tick(t, s.eyes.visible && s.eyes.opacity > 0 && tone !== 'gentle');
    ctx.clearRect(0, 0, 1280, 720); ctx.fillStyle = 'black'; ctx.fillRect(0, 0, 1280, 720);
    ctx.save(); if (s.mirror) { ctx.translate(1280, 0); ctx.scale(-1, 1); }
    // Existing raster vapor: body-local emission, velocity, drag and settling.
    const body = {minX: rect.x + rect.width * .36, maxX: rect.x + rect.width * .64, minY: rect.y + rect.height * .23, maxY: rect.y + rect.height * .77};
    this.vapor.draw(ctx, {clock: t, visible: s.ghost.visible ? s.ghost.opacity / 100 * Math.max(movement.alpha, movement.fog * .65) : 0, body, amount: Math.min(1, s.fog / 100 + movement.fog * .8)});
    ctx.globalCompositeOperation = 'screen';
    if (s.ghost.visible && film.readyState >= 2) {
      ctx.globalAlpha = s.ghost.opacity / 100 * movement.alpha; ctx.drawImage(film, rect.x, rect.y, rect.width, rect.height);
    }
    const eye = this.eyes.video, er = layerRect(s.eyes, 4 / 3);
    if (this.eyes.active && eye.readyState >= 2 && tone !== 'gentle') {
      ctx.globalAlpha = s.eyes.opacity / 100 * this.eyes.visibility * eyeEnvelope(eye.currentTime, eye.duration);
      ctx.drawImage(eye, er.x, er.y, er.width, er.height);
    }
    ctx.globalAlpha = 1; overlay?.(ctx, t); this.lettering.draw(ctx); ctx.restore();
    // A calibration failure must never send an unwarped picture outside its surface.
    const mapped = this.mapper.render(this.canvas, s.corners, {brightness: s.brightness, feather: s.feather, mask: s.mask});
    this.context.clearRect(0, 0, 1280, 720);
    if (mapped) { this.context.globalAlpha = Number.isFinite(opacity) ? Math.max(0, Math.min(1, opacity)) : 0; this.context.drawImage(mapped, 0, 0); this.context.globalAlpha = 1; } else this.error = this.mapper.error || 'Projection graphics unavailable';
    if (mapped) this.error = null;
    this.frames++;
  }
  stop() { if (this.running) { this.eyes.stop(); this.vapor.clear(); this.motion.reset(); this.lettering.clear(); } this.running = false; this.lastPaint = -Infinity; this.context.clearRect(0, 0, 1280, 720); }
  dispose() { this.stop(); this.disposed = true; this.eyes.dispose(); this.lettering.dispose(); this.mapper.dispose(); this.canvas.width = 0; this.canvas.height = 0; }
  inspect() { return {running: this.running, frames: this.frames, error: this.error || null, movement: this.motion.inspect(), lettering: this.lettering.active, eyes: this.eyes.inspect(), vapor: this.vapor.inspect(), mapping: this.mapper.inspect(), settings: structuredClone(this.settings), disposed: this.disposed}; }
}
