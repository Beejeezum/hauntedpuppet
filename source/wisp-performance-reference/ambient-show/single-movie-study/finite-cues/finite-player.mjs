// Private finite-media experiment. Not the production cue scheduler.
const MIME = 'video/mp4; codecs="avc1.64001f,mp4a.40.2"';
const cancelled = () => new DOMException('Playback cancelled', 'AbortError');
function abortable(promise, signal) {
  return new Promise((resolve, reject) => {
    const cleanup = () => signal.removeEventListener('abort', abort);
    const abort = () => { cleanup(); reject(cancelled()); };
    signal.addEventListener('abort', abort, { once: true });
    Promise.resolve(promise).then(value => { cleanup(); resolve(value); }, error => { cleanup(); reject(error); });
    if (signal.aborted) abort();
  });
}
function event(target, name, signal, start) {
  return new Promise((resolve, reject) => {
    const finish = (error) => {
      clearTimeout(timer);
      target.removeEventListener(name, done);
      target.removeEventListener('error', failed);
      signal.removeEventListener('abort', abort);
      error ? reject(error) : resolve();
    };
    const done = () => finish();
    const failed = () => finish(Error(`Finite media ${name} failed`));
    const abort = () => finish(cancelled());
    const timer = setTimeout(() => finish(Error(`Finite media ${name} timed out`)), 10000);
    target.addEventListener(name, done, { once: true });
    target.addEventListener('error', failed, { once: true });
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) return abort();
    try { start(); } catch (error) { finish(error); }
  });
}
export class FiniteCueStudy {
  constructor(video) {
    this.video = video;
    this.disposed = false;
    this.epoch = 0;
    this.sourceLoads = 0;
    this.duration = 0;
  }
  async prepare(cues) {
    if (this.disposed) throw Error('Finite player disposed');
    if (typeof MediaSource === 'undefined' || !MediaSource.isTypeSupported(MIME)) throw Error('Finite media unsupported');
    if (!Array.isArray(cues) || !cues.length || cues.length > 64) throw Error('Invalid finite playlist');
    const normalized = cues.map(cue => {
      const url = new URL(cue.url, location.href);
      if (url.origin !== location.origin || !Number.isInteger(cue.frames) || cue.frames < 1 || cue.frames > 14400 || cue.fps !== 24)
        throw Error('Invalid finite cue');
      return { ...cue, url: url.href };
    });
    if (normalized.reduce((sum, cue) => sum + cue.frames / cue.fps, 0) > 1800) throw Error('Finite playlist too long');
    this.stop();
    const epoch = this.epoch, controller = this.controller = new AbortController();
    const signal = controller.signal, media = new MediaSource();
    const deadline = setTimeout(() => controller.abort(), 30000);
    const objectURL = this.objectURL = URL.createObjectURL(media);
    const current = () => { if (signal.aborted || epoch !== this.epoch) throw cancelled(); };
    try {
      await event(media, 'sourceopen', signal, () => { this.sourceLoads++; this.video.src = objectURL; });
      current();
      const buffer = media.addSourceBuffer(MIME);
      let offset = 0;
      this.windows = [];
      for (const cue of normalized) {
        const response = await abortable(fetch(cue.url, { signal }), signal);
        if (!response.ok) throw Error('Finite cue unavailable');
        const bytes = await abortable(response.arrayBuffer(), signal);
        current();
        const end = offset + cue.frames / cue.fps;
        // No later source media exists in this buffer. Trim AAC padding at the
        // finite cue boundary before appending the next selected performance.
        buffer.appendWindowEnd = Infinity;
        // WebKit rounds timestamps to the 24k track timescale. An exact
        // floating-point start can otherwise reject the incoming IDR and
        // its dependent frames. One track tick includes that boundary;
        // it does not introduce media from another source cue.
        buffer.appendWindowStart = Math.max(0, offset - 1 / 24000);
        buffer.appendWindowEnd = end;
        buffer.timestampOffset = offset;
        await event(buffer, 'updateend', signal, () => buffer.appendBuffer(bytes));
        current();
        this.windows.push({ id: cue.id, start: offset, end });
        offset = end;
      }
      media.duration = offset;
      media.endOfStream();
      this.duration = offset;
      return { duration: offset, windows: this.windows.map(x => ({ ...x })), sourceLoads: this.sourceLoads };
    } catch (error) {
      // A late failure from an old playlist cannot dispose its replacement.
      if (epoch === this.epoch) this.stop();
      throw error;
    } finally { clearTimeout(deadline); }
  }
  play() {
    if (this.disposed || !this.objectURL || !this.duration) return Promise.reject(Error('No finite playlist prepared'));
    return this.video.play();
  }
  stop() {
    this.epoch++;
    this.controller?.abort();
    this.controller = null;
    this.video.pause();
    if (this.objectURL) {
      this.video.removeAttribute('src');
      this.video.load();
      URL.revokeObjectURL(this.objectURL);
      this.objectURL = null;
    }
    this.duration = 0;
    this.windows = [];
  }
  dispose() { if (!this.disposed) { this.stop(); this.disposed = true; } }
}
