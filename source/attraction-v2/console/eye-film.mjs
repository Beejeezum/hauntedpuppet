/** One silent native performance. Rewinds only after its intentional dark ending. */
export class EyeFilm {
  constructor() {
    this.video = document.createElement('video'); this.video.muted = true;
    this.video.playsInline = true; this.video.preload = 'auto'; this.video.loop = false;
    this.video.setAttribute('aria-hidden', 'true'); this.video.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none';
    document.body.append(this.video); this.ready = false; this.disposed = false;
    this.active = false; this.pending = false; this.epoch = 0; this.nextAt = 0; this.plays = 0; this.visibility = 0;
  }
  async load() {
    this.controller = new AbortController(); const signal = this.controller.signal;
    const timeout = setTimeout(() => this.controller.abort(), 12000);
    try {
      const manifestResponse = await fetch('./media/scene-assets.json', {signal});
      if (!manifestResponse.ok) throw Error('Eyes package unavailable');
      const manifest = await manifestResponse.json(), cue = manifest.eyes;
      if (cue?.url !== './media/eyes-watch.mp4' || !/^[a-f0-9]{64}$/.test(cue.sha256)) throw Error('Invalid eyes package');
      const response = await fetch(cue.url, {signal}); if (!response.ok) throw Error('Eyes film unavailable');
      const bytes = await response.arrayBuffer();
      const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(v => v.toString(16).padStart(2, '0')).join('');
      if (hash !== cue.sha256) throw Error('Eyes film changed; refresh before playing');
      if (this.disposed) return;
      this.url = URL.createObjectURL(new Blob([bytes], {type: 'video/mp4'}));
      await new Promise((resolve, reject) => {
        const finish = error => { clearTimeout(timer); this.video.removeEventListener('loadeddata', loaded); this.video.removeEventListener('error', failed); signal.removeEventListener('abort', aborted); error ? reject(error) : resolve(); };
        const loaded = () => finish(), failed = () => finish(Error('Eyes film cannot decode')), aborted = () => finish(Error('Eyes load cancelled'));
        const timer = setTimeout(() => finish(Error('Eyes load timed out')), 10000);
        this.video.addEventListener('loadeddata', loaded, {once: true}); this.video.addEventListener('error', failed, {once: true}); signal.addEventListener('abort', aborted, {once: true});
        this.video.src = this.url; this.video.load();
      });
      if (!this.disposed) this.ready = true;
    } catch (error) { if (!this.disposed) this.error = signal.aborted ? 'Eyes load timed out; Wisp can still play' : error.message; }
    finally { clearTimeout(timeout); }
  }
  tick(now, enabled, allowStart = true) {
    if (!this.ready || this.disposed) { if (this.active || this.pending) this.stop(); return; }
    if (enabled && !this.wasEnabled) this.nextAt = now;
    this.wasEnabled = enabled;
    const dt = this.lastTick == null ? 0 : Math.min(.1, Math.max(0, now - this.lastTick)); this.lastTick = now;
    this.visibility = enabled ? Math.min(1, this.visibility + dt / .35) : Math.max(0, this.visibility - dt / .35);
    if (!enabled) { if (this.visibility === 0 && (this.active || this.pending)) this.stop(); return; }
    if (this.video.ended && this.active) { this.active = false; this.nextAt = now + 6.5; }
    if (allowStart && !this.active && !this.pending && now >= this.nextAt) {
      this.video.currentTime = 0; this.pending = true; const epoch = this.epoch;
      this.video.play().then(() => {
        if (epoch !== this.epoch || this.disposed) return;
        this.pending = false; this.active = true; this.plays++;
      }).catch(error => { if (epoch === this.epoch) { this.pending = false; this.error = error.message; this.nextAt = Infinity; } });
    }
  }
  stop() { this.epoch++; this.video.pause(); this.active = this.pending = false; this.nextAt = 0; this.visibility = 0; this.lastTick = null; this.wasEnabled = false; }
  dispose() { this.disposed = true; this.stop(); this.controller?.abort(); this.video.removeAttribute('src'); this.video.load(); this.video.remove(); if (this.url) URL.revokeObjectURL(this.url); this.url = null; this.ready = false; }
  inspect() { return {ready: this.ready, active: this.active, pending: this.pending, visibility: this.visibility, time: this.video.currentTime, plays: this.plays, muted: this.video.muted, error: this.error || null, disposed: this.disposed}; }
}
