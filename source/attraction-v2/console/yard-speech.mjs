import {decodePcmVoice} from '../../wisp-performance-reference/ambient-show/pcm-voice.mjs';
import {liveCandidates, readCast, validateCast} from './yard-cast.mjs';
import {PICTURE_ONLY} from './yard-environment.mjs';

// Validation/preview defaults only. enqueue requires an explicit live cast choice.
const profiles = {friendly:liveCandidates['friendly-c'], scary:liveCandidates['evil-c']};
export function speechSpec(text, form, choices = readCast()) {
  text = typeof text === 'string' ? text.trim() : '';
  if (!Object.hasOwn(profiles, form) || !text || text.length > 240 || /[\x00-\x08\x0b-\x1f\x7f]/.test(text)) throw Error('Enter a short line, up to 240 characters.');
  const candidate = liveCandidates[validateCast(choices)[form]], profile = candidate || profiles[form];
  const {voice, mood, intensity, speed, instructions} = profile;
  return {provider: 'openai', voice, mood, intensity, speed, instructions, text};
}
const aborted = () => new DOMException('Speech cancelled', 'AbortError');
function settle(item, error = null) { const callback = item?.settled; if (item) item.settled = null; callback?.(error); }
export function waitForCharacter(player, form, signal) {
  return new Promise((resolve, reject) => {
    const started = performance.now(); let timer;
    const finish = error => { clearTimeout(timer); signal.removeEventListener('abort', abort); error ? reject(error) : resolve(); };
    const abort = () => finish(aborted()); signal.addEventListener('abort', abort, {once: true});
    const tick = () => {
      if (signal.aborted) return abort();
      const s = player.inspect();
      if (!s.running) return finish(Error('Start the show before speaking.'));
      const stable = id => form === 'scary' ? id === 'scary' : ['friendly', 'wave', 'return'].includes(id);
      if (stable(s.current) && s.next.every(stable)) return finish();
      if (performance.now() - started > 40000) return finish(Error('The character could not settle. Try the line again.'));
      timer = setTimeout(tick, 100);
    }; tick();
  });
}

/** One audible owner, a bounded serial queue, and cancellation across every await. */
export class YardSpeech {
  constructor({player, scene, film, onState = () => {}}) {
    Object.assign(this, {player, scene, film, onState}); this.queue = []; this.epoch = 0; this.phase = 'idle'; this.active = null; this.disposed = false; this.configured = false;
  }
  emit(phase, detail = '') { this.phase = phase; this.detail = detail; this.onState(this.inspect()); }
  async status() {
    if (PICTURE_ONLY) { this.available = this.configured = this.phoneReady = false; return {available:false,configured:false,phoneReady:false}; }
    try {
      const r = await fetch('/api/status', {signal: AbortSignal.timeout(5000)});
      if (!r.ok) throw Error(); const status = await r.json(); this.token = status.token; this.configured = status.configured === true; this.available = !!status.token; this.phoneReady = status.yardPhone === true;
    } catch { this.available = this.configured = this.phoneReady = false; }
    return {available: this.available, configured: this.configured, phoneReady: this.phoneReady};
  }
  async connect() {
    await this.status(); if (!this.available) throw Error('Open the voice-enabled console on this laptop.');
    const r = await fetch('/api/connect', {method: 'POST', headers: {'Content-Type': 'application/json', 'X-Haunt-Token': this.token}, body: '{}'});
    if (!r.ok) throw Error('The private connection did not complete.'); await this.status(); return this.configured;
  }
  async unlock() {
    if (this.disposed) throw Error('Console closed');
    if (!this.context) { this.context = new AudioContext(); this.gain = this.context.createGain(); this.gain.gain.value = .9; this.gain.connect(this.context.destination); }
    await this.context.resume();
    if (this.context.state !== 'running') throw Error('Enable sound in this browser, then try again.');
  }
  enqueue(text, form, lettering = true, settled = null) {
    if (PICTURE_ONLY) throw Error('New spoken lines run in the laptop console. Saved voice auditions and silent lettering are available here.');
    const choices = readCast();
    if (!choices[form]) throw Error('Choose a connected character voice on the casting page before speaking.');
    const spec = speechSpec(text, form, choices);
    if (!this.configured) throw Error('Connect the character voice first.');
    if (!this.player.running || this.disposed) throw Error('Start the show before speaking.');
    if (this.queue.length + (this.active ? 1 : 0) >= 3) throw Error('Three lines are already waiting. Let Wisp finish one.');
    this.queue.push({spec, form, lettering, settled});
    if (!this.active) void this.drain(); else this.onState(this.inspect());
  }
  async drain() {
    const epoch = this.epoch;
    while (this.queue.length && epoch === this.epoch && !this.disposed) {
      const item = this.queue.shift(); this.active = item; const controller = this.controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 80000); const signal = controller.signal;
      this.player.plan.holdSpeech(item.form); this.emit('preparing', 'Making the character voice…');
      try {
        const r = await fetch('/api/performance', {method: 'POST', headers: {'Content-Type': 'application/json', 'X-Haunt-Token': this.token}, body: JSON.stringify(item.spec), signal});
        const data = await r.json(); if (!r.ok) throw Error(typeof data.error === 'string' ? data.error : 'Voice service unavailable.');
        if (typeof data.audio !== 'string' || data.audio.length > 6400000) throw Error('Voice response was too large. Use a shorter line.');
        if (epoch !== this.epoch) throw aborted();
        const buffer = decodePcmVoice(this.context, Uint8Array.from(atob(data.audio), c => c.charCodeAt(0)).buffer, {signal});
        this.emit('waiting', 'Waiting for this character to settle…');
        await waitForCharacter(this.player, item.form, signal);
        if (epoch !== this.epoch) throw aborted();
        if (this.context.state !== 'running') throw Error('Sound paused. Click Say it again to resume.');
        this.scene.motion.request('appear', performance.now() / 1000);
        const source = this.source = this.context.createBufferSource(); source.buffer = buffer; source.connect(this.gain);
        const start = this.context.currentTime + .04; this.film.volume = .18;
        if (item.lettering) this.scene.lettering.show(item.spec.text, item.form, () => this.context.currentTime - start, buffer.duration);
        this.emit('speaking', `${item.form === 'scary' ? 'Evil' : 'Friendly'} Wisp is speaking`);
        await new Promise((resolve, reject) => {
          const cleanup = () => { signal.removeEventListener('abort', abort); source.onended = null; source.disconnect(); };
          const abort = () => { try { source.stop(); } catch {} cleanup(); reject(aborted()); };
          source.onended = () => { cleanup(); resolve(); }; signal.addEventListener('abort', abort, {once: true});
          if (signal.aborted) return abort(); source.start(start);
        });
        settle(item);
      } catch (error) {
        if (epoch !== this.epoch) return;
        settle(item, error); this.queue.forEach(waiting => settle(waiting, error)); this.queue.length = 0; this.scene.lettering.clear(); this.emit('error', signal.aborted ? 'Voice timed out. Try again.' : error.message);
      } finally {
        clearTimeout(timeout);
        if (epoch === this.epoch) { this.active = null; this.source = null; this.controller = null; this.film.volume = 1; this.player.plan.holdSpeech(null); }
      }
    }
    if (epoch === this.epoch && this.phase !== 'error') this.emit('idle', 'Ready for another line.');
  }
  stop() {
    const cancelled = Object.assign(Error('Speech cancelled'), {cancelled: true}); settle(this.active, cancelled); this.queue.forEach(item => settle(item, cancelled));
    this.epoch++; this.controller?.abort(); this.controller = null;
    try { this.source?.stop(); this.source?.disconnect(); } catch {}
    this.source = this.active = null; this.queue.length = 0; this.film.volume = 1; this.player.plan.holdSpeech(null); this.scene.lettering.clear(); this.emit('idle', 'Speech stopped.');
  }
  inspect() { const cast = readCast(); return {phase: this.phase, detail: this.detail, queued: this.queue.length, active: !!this.active, form: this.active?.form || null, configured: this.configured, castReady:{friendly:!!cast.friendly,scary:!!cast.scary}}; }
  dispose() { this.stop(); this.disposed = true; this.gain?.disconnect(); void this.context?.close(); }
}
