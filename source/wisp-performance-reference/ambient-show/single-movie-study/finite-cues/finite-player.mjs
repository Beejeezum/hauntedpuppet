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
function normalize(cues) {
  if (!Array.isArray(cues) || !cues.length || cues.length > 64) throw Error('Invalid finite playlist');
  const normalized = cues.map(cue => {
    const url = new URL(cue.url, location.href);
    if (url.origin !== location.origin || !Number.isInteger(cue.frames) || cue.frames < 1 || cue.frames > 14400 || cue.fps !== 24)
      throw Error('Invalid finite cue');
    return { ...cue, url: url.href };
  });
  if (normalized.reduce((sum, cue) => sum + cue.frames / cue.fps, 0) > 1800) throw Error('Finite playlist too long');
  return normalized;
}
export class FiniteCueStudy {
  constructor(video, {retentionSeconds=null, cacheBudgetBytes=0}={}) {
    if(retentionSeconds!==null&&(!Number.isFinite(retentionSeconds)||retentionSeconds<10||retentionSeconds>60))throw Error('Invalid rolling retention');
    if(!Number.isSafeInteger(cacheBudgetBytes)||cacheBudgetBytes<0||cacheBudgetBytes>32*1024*1024)throw Error('Invalid media cache budget');
    this.retentionSeconds=retentionSeconds;this.cacheBudgetBytes=cacheBudgetBytes;this.cachedBytes=0;this.cache=new Map();this.evictions=0;
    this.video = video;
    this.disposed = false;
    this.epoch = 0;
    this.sourceLoads = 0;
    this.duration = 0;
    this.frames=0;this.windows=[];this.ready=false;this.sealed=false;
    this.queue = Promise.resolve();
  }
  async prepare(cues, { open = false } = {}) {
    if (this.disposed) throw Error('Finite player disposed');
    if (typeof MediaSource === 'undefined' || !MediaSource.isTypeSupported(MIME)) throw Error('Finite media unsupported');
    const normalized = normalize(cues);
    this.stop();
    const epoch = this.epoch, controller = this.controller = new AbortController();
    const signal = controller.signal, media = this.media = new MediaSource();
    const objectURL = this.objectURL = URL.createObjectURL(media);
    try {
      await event(media, 'sourceopen', signal, () => { this.sourceLoads++; this.video.src = objectURL; });
      this.assertCurrent(epoch, signal);
      this.buffer = media.addSourceBuffer(MIME);
      // Leave the native timeline open while additional selected cues arrive.
      // It waits for data at a temporary buffer edge instead of ending the show.
      media.duration = Infinity;
      const result = await this.appendNow(normalized, !open, epoch, signal);
      this.ready = true;
      return result;
    } catch (error) {
      if (epoch === this.epoch) this.stop();
      throw error;
    }
  }
  append(cues, { seal = false } = {}) {
    let normalized;
    try {
      normalized = normalize(cues);
      if (this.disposed || !this.ready || !this.controller || this.sealed) throw Error('No open finite timeline');
    } catch (error) { return Promise.reject(error); }
    const epoch = this.epoch, signal = this.controller.signal;
    const operation = this.queue.then(() => this.appendNow(normalized, seal, epoch, signal));
    // Serialize independent button/playlist arrivals without poisoning the tail.
    this.queue = operation.catch(() => {});
    return operation;
  }
  assertCurrent(epoch, signal) {
    if (signal.aborted || epoch !== this.epoch) throw cancelled();
  }
  snapshot() {
    return { duration: this.duration, windows: this.windows.map(x => ({ ...x })), sourceLoads: this.sourceLoads, sealed: this.sealed, evictions:this.evictions, cachedBytes:this.cachedBytes,cacheEntries:this.cache.size };
  }
  async appendNow(cues, seal, epoch, signal) {
    this.assertCurrent(epoch, signal);
    if (this.sealed) throw Error('Finite timeline already sealed');
    if(this.retentionSeconds!==null){
      const cutoff=Math.max(0,this.video.currentTime-this.retentionSeconds);
      if(cutoff>0&&this.buffer.buffered.length&&this.buffer.buffered.start(0)<cutoff){
        await event(this.buffer,'updateend',signal,()=>this.buffer.remove(0,cutoff));this.assertCurrent(epoch,signal);
        this.windows=this.windows.filter(window=>window.end>cutoff);this.evictions++;
      }
      if(cues.some(cue=>cue.frames/cue.fps>60)||this.duration-this.video.currentTime>this.retentionSeconds)throw Error('Resident timeline ahead limit');
    }
    if (this.windows.length + cues.length > 64 || this.retentionSeconds===null&&this.duration + cues.reduce((sum, cue) => sum + cue.frames / cue.fps, 0) > 1800)
      throw Error('Finite timeline limit');
    const media = this.media, buffer = this.buffer, controller = this.controller;
    const deadline = setTimeout(() => controller.abort(), 30000);
    try {
      for (const cue of cues) {
        let bytes=this.cache.get(cue.url);
        if(!bytes){
          const response = await abortable(fetch(cue.url, { signal }), signal);
          if (!response.ok) throw Error('Finite cue unavailable');
          bytes = await abortable(response.arrayBuffer(), signal);this.assertCurrent(epoch,signal);
          if(bytes.byteLength<=this.cacheBudgetBytes){
            while(this.cachedBytes+bytes.byteLength>this.cacheBudgetBytes&&this.cache.size){const [url,old]=this.cache.entries().next().value;this.cache.delete(url);this.cachedBytes-=old.byteLength;}
            if(this.cacheBudgetBytes){this.cache.set(cue.url,bytes);this.cachedBytes+=bytes.byteLength;}
          }
        }
        this.assertCurrent(epoch, signal);
        const offset = this.frames / 24, nextFrames = this.frames + cue.frames, end = nextFrames / 24;
        buffer.appendWindowEnd = Infinity;
        // One 24k-track tick prevents timestamp rounding from rejecting an IDR.
        // The fragment contains only the selected cue, never later master media.
        buffer.appendWindowStart = Math.max(0, offset - 1 / 24000);
        buffer.appendWindowEnd = end;
        buffer.timestampOffset = offset;
        await event(buffer, 'updateend', signal, () => buffer.appendBuffer(bytes));
        this.assertCurrent(epoch, signal);
        this.windows.push({ id: cue.id, start: offset, end });
        this.frames = nextFrames;
        this.duration = end;
      }
      if (seal) {
        media.duration = this.duration;
        media.endOfStream();
        this.sealed = true;
      }
      return this.snapshot();
    } catch (error) {
      // A late old append failure cannot dispose the replacement performance.
      if (epoch === this.epoch) this.stop();
      throw error;
    } finally { clearTimeout(deadline); }
  }
  play() {
    if (this.disposed || !this.ready || !this.objectURL || !this.duration) return Promise.reject(Error('No finite playlist prepared'));
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
    this.media = this.buffer = null;
    this.duration = this.frames = 0;
    this.windows = [];
    this.cache.clear();this.cachedBytes=0;
    this.ready = this.sealed = false;
    this.queue = Promise.resolve();
  }
  dispose() { if (!this.disposed) { this.stop(); this.disposed = true; } }
}
