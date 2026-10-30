import {FiniteCueStudy} from '../../wisp-performance-reference/ambient-show/single-movie-study/finite-cues/finite-player.mjs';
import {RehearsalPlan} from './rehearsal-plan.mjs';

export class StagehandRehearsal {
  constructor(video, manifest, settings) {
    if (manifest.status !== 'private-rehearsal' || manifest.clips.length !== 6) throw Error('Rehearsal package unavailable');
    this.video = video; this.clips = new Map(manifest.clips.map(c => [c.id, c]));
    for (const id of ['friendly', 'scary', 'wave', 'return', 'to-cute', 'to-scary']) {
      const cue = this.clips.get(id);
      if (!cue || cue.status !== 'rehearsal' || !/^[a-f0-9]{64}$/.test(cue.sha256) || !Number.isInteger(cue.frames) || cue.frames < 1 || cue.frames > 360 || cue.fps !== 24) throw Error('Invalid rehearsal package');
    }
    this.plan = new RehearsalPlan(settings); this.timeline = new FiniteCueStudy(video, {retentionSeconds: 20, cacheBudgetBytes: 16 * 1024 * 1024});
    this.running = false; this.loading = false; this.disposed = false; this.busy = false; this.epoch = 0; this.error = null;
    video.muted = true; video.playsInline = true; video.loop = false;
    this.onError = () => this.fail('The film stopped responding. Stop, then start the rehearsal again.');
    video.addEventListener('error', this.onError);
  }
  async verify(epoch) {
    // Pin the actual installed package before any playback, not just manifest labels.
    for (const cue of this.clips.values()) {
      const response = await fetch(cue.url, {signal: this.verifyController.signal});
      if (!response.ok) throw Error('A rehearsal film is missing');
      const bytes = await response.arrayBuffer();
      const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(b => b.toString(16).padStart(2, '0')).join('');
      if (epoch !== this.epoch) return;
      if (hash !== cue.sha256) throw Error('A rehearsal film has changed. Refresh before playing.');
    }
  }
  async start() {
    if (this.disposed) throw Error('Console closed');
    this.stop(); this.error = null; this.loading = true; this.plan.reset(); const epoch = this.epoch;
    this.verifyController = new AbortController();
    const deadline = this.startDeadline = setTimeout(() => {
      if (epoch === this.epoch) this.fail('The film took too long to prepare. Check the connection, then start again.');
    }, 15000);
    try {
      await this.verify(epoch); if (epoch !== this.epoch) return false;
      await this.timeline.prepare([this.clips.get(this.plan.initialForm)], {open: true}); if (epoch !== this.epoch) return false;
      await this.timeline.play(); if (epoch !== this.epoch) return false;
      this.loading = false; this.running = true; this.lastAdvance = performance.now(); this.lastTime = this.video.currentTime;
      this.timer = setInterval(() => this.pump(), 120); return true;
    } catch (error) { if (epoch !== this.epoch) return false; this.fail(error.message); return false; }
    finally { clearTimeout(deadline); if (this.startDeadline === deadline) this.startDeadline = null; }
  }
  async pump() {
    if (!this.running || this.disposed) return;
    const now = performance.now(), time = this.video.currentTime;
    if (time > this.lastTime + .01) { this.lastTime = time; this.lastAdvance = now; }
    if (now - this.lastAdvance > 3500) return this.fail('Playback paused unexpectedly. Start again when ready.');
    if (this.busy || this.timeline.duration - time > 2) return;
    const epoch = this.epoch;
    const tail = this.clips.get(this.timeline.windows.at(-1).id);
    const ids = this.plan.choose(tail.exit, time);
    this.busy = true;
    try { await this.timeline.append(ids.map(id => this.clips.get(id))); }
    catch (error) { if (epoch === this.epoch) this.fail(error.message); }
    finally { if (epoch === this.epoch) this.busy = false; }
  }
  request(id) { if (!this.running) throw Error('Start the rehearsal first'); return this.plan.request(id); }
  inspect() {
    const time = this.video.currentTime, timeline = this.timeline.snapshot();
    const current = timeline.windows.find(w => time >= w.start && time < w.end);
    const upcoming = timeline.windows.filter(w => w.start > time + .01);
    return {running: this.running, loading: this.loading, disposed: this.disposed, busy: this.busy, error: this.error,
      black: !this.running, time, current: current?.id || null, form: this.clips.get(current?.id)?.entry || 'friendly',
      targetForm: this.plan.targetForm, next: upcoming.map(w => w.id), pending: this.plan.pending, mode: this.plan.mode, timeline};
  }
  fail(message) { this.stop(); this.error = message; }
  stop() {
    this.epoch++; this.verifyController?.abort(); clearTimeout(this.startDeadline); this.startDeadline = null; clearInterval(this.timer); this.timer = null;
    this.running = this.loading = this.busy = false; this.plan?.reset(); this.timeline.stop();
  }
  dispose() { this.stop(); this.disposed = true; this.timeline.dispose(); this.video.removeEventListener('error', this.onError); }
}
