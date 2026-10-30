import {validateResidentDelivery} from '../wisp-performance-reference/ambient-show/resident-contract.mjs';

// Renderer-neutral show decisions. This does not render media or prove art quality.
export const PROFILES = Object.freeze({
  gentle: {ceiling: 0, initialForm: 'friendly', alternate: false, actionGapMs: 24000, formDwellMs: 90000},
  mischief: {ceiling: 1, initialForm: 'friendly', alternate: true, actionGapMs: 18000, formDwellMs: 60000},
  haunted: {ceiling: 1, initialForm: 'scary', alternate: true, actionGapMs: 24000, formDwellMs: 90000},
});
const IDLE = {friendly: 'friendly-drift', scary: 'scary-drift'};
const ARRIVAL = {friendly: 'friendly-reform', scary: 'scary-reform'};
const PACING = {relaxed: 1.5, balanced: 1, lively: .75};
const formAt = port => port === 'friendly-rest' ? 'friendly' : port === 'scary-rest' ? 'scary' : null;
const clone = value => structuredClone(value);
const SHA = /^[a-f0-9]{64}$/;

function admitted(cue, contract, simulation) {
  if (simulation && cue.status === 'simulation') return;
  if (cue.status !== 'approved' || !SHA.test(cue.media?.sha256 || '') ||
      !cue.media?.file || !cue.media?.reviewEvidence) throw Error('Unapproved film: ' + cue.id);
  validateResidentDelivery(cue, contract);
}

export class ShowDirector {
  constructor({cues, joins = [], contract, simulation = false, seed = 1, operatorLeaseMs = 30000}) {
    if (!Array.isArray(cues) || !cues.length || !contract?.rules ||
        !Number.isFinite(operatorLeaseMs) || operatorLeaseMs < 5000 || operatorLeaseMs > 120000) throw Error('Invalid show configuration');
    this.cues = new Map(); this.joins = clone(joins); this.simulation = simulation;
    for (const source of cues) {
      const cue = clone(source), rule = contract.rules.find(r => r.id === cue.id);
      if (!rule || this.cues.has(cue.id) || cue.entryPort !== rule.entry || cue.exitPort !== rule.exit ||
          !Number.isFinite(cue.seconds) || cue.seconds <= 0 || cue.seconds > 120 ||
          ![0, 1, 2].includes(cue.intensity) || !Number.isFinite(cue.cooldownMs) || cue.cooldownMs < 0 || cue.cooldownMs > 3600000 ||
          typeof cue.manualOnly !== 'boolean') throw Error('Invalid cue: ' + cue.id);
      admitted(cue, contract, simulation); cue.kind = rule.kind; this.cues.set(cue.id, cue);
    }
    for (const id of Object.values(IDLE)) if (!this.cues.has(id)) throw Error('Missing resident idle: ' + id);
    this.rng = seed >>> 0 || 1; this.leaseMs = operatorLeaseMs; this.clock = 0;
    this.epoch = 0; this.serial = 0; this.status = 'stopped'; this.mode = 'auto'; this.profile = 'gentle'; this.pacing = 'balanced';
    this.current = null; this.last = null; this.route = []; this.pending = null;
    this.operatorUntil = 0; this.lastActionAt = 0; this.formSince = 0;
    this.lastPlayed = new Map(); this.recent = []; this.history = []; this.commands = new Map();
    this.playlist = []; this.playlistIndex = 0; this.problem = null; this.lastSequence = 0;
  }
  time(now) {
    if (!Number.isFinite(now) || now < this.clock) throw Error('Show clock must advance monotonically');
    this.clock = now;
    if (this.mode === 'host' && now >= this.operatorUntil) { this.mode = 'auto'; this.pending = null; }
  }
  random() { this.rng = (Math.imul(1664525, this.rng) + 1013904223) >>> 0; return this.rng / 4294967296; }
  record(event) { this.history.push({at: this.clock, ...event}); if (this.history.length > 128) this.history.shift(); }
  allowed(cue, {manual = false, peak = false, recovery = false} = {}) {
    if (recovery && (cue.id === 'evil-to-cute' || cue.kind === 'idle')) return true;
    return cue.intensity <= (peak && manual ? 2 : PROFILES[this.profile].ceiling) && (!cue.manualOnly || manual);
  }
  reviewed(from, to) {
    if (from.exitPort !== to.entryPort) return false;
    return this.joins.some(j => j.from === from.id && j.to === to.id && j.status === (this.simulation ? 'simulation' : 'approved') &&
      j.fromSha256 === from.media?.sha256 && j.toSha256 === to.media?.sha256 && j.reviewEvidence);
  }
  path(from, target, options) {
    if (!this.allowed(target, options)) throw Error('Moment exceeds selected tone');
    if (!from) {
      if (target.entryPort !== 'empty' || target.kind !== 'arrival') throw Error('An authored arrival is required');
      return [target];
    }
    const queue = [{cue: from, path: []}], visited = new Set([from.id]);
    while (queue.length) {
      const node = queue.shift();
      if (this.reviewed(node.cue, target)) return [...node.path, target];
      for (const candidate of this.cues.values()) {
        const bridge = ['idle', 'morph'].includes(candidate.kind) ||
          (target.entryPort === 'empty' && candidate.kind === 'departure') ||
          (node.cue.exitPort === 'empty' && candidate.kind === 'arrival');
        if (!bridge || visited.has(candidate.id) || !this.allowed(candidate, options) || !this.reviewed(node.cue, candidate)) continue;
        visited.add(candidate.id); queue.push({cue: candidate, path: [...node.path, candidate]});
      }
    }
    throw Error('No reviewed route: ' + from.id + ' → ' + target.id);
  }
  plan(ids, options = {}) {
    let from = this.last; const route = [];
    // The current film is immutable once dispatched. Plan from its eventual exit.
    if (this.current) from = this.cues.get(this.current.id);
    if (!from) {
      const first = this.cues.get(ids[0]);
      if (!first) throw Error('Unknown moment');
      const form = formAt(first.entryPort) || PROFILES[this.profile].initialForm;
      const arrival = this.cues.get(ARRIVAL[form]);
      if (!arrival) throw Error('Missing authored arrival');
      route.push(...this.path(null, arrival, options)); from = arrival;
    }
    for (const id of ids) {
      const target = this.cues.get(id); if (!target) throw Error('Unknown moment');
      route.push(...this.path(from, target, options)); from = target;
    }
    const form = formAt(from.exitPort) || PROFILES[this.profile].initialForm;
    if (from.id !== IDLE[form]) route.push(...this.path(from, this.cues.get(IDLE[form]), options));
    return route;
  }
  start({profile = this.profile, now = this.clock} = {}) {
    this.time(now); if (!Object.hasOwn(PROFILES, profile)) throw Error('Unknown tone');
    if (this.status === 'running') throw Error('Show already running');
    this.profile = profile; this.last = null; this.current = null; this.pending = null; this.route = [];
    const route = this.plan([IDLE[PROFILES[profile].initialForm]]);
    this.epoch++; this.status = 'running'; this.mode = 'auto'; this.problem = null;
    this.route = route; this.formSince = now; this.lastActionAt = now;
    this.record({type: 'start', profile}); return this.inspect();
  }
  command(command, now) {
    this.time(now);
    if (!command || !/^[\w-]{1,96}$/.test(command.id || '')) throw Error('Command ID required');
    if (this.commands.has(command.id)) return clone(this.commands.get(command.id));
    // The authenticated bridge assigns one increasing sequence across controllers.
    // Bounded dedupe storage must not allow an evicted command to replay later.
    if (!Number.isSafeInteger(command.sequence) || command.sequence <= this.lastSequence) throw Error('Stale command sequence');
    let result;
    if (command.type === 'blackout') {
      this.epoch++; this.current = null; this.route = []; this.pending = null; this.last = null;
      this.status = 'blackout'; this.mode = 'auto'; this.record({type: 'blackout'});
      result = {accepted: true, effect: 'stop-output-now', epoch: this.epoch};
    } else {
      if (this.status !== 'running') throw Error('Start the show first');
      if (command.type === 'claim') {
        this.mode = 'host'; this.operatorUntil = now + this.leaseMs; result = {accepted: true};
      } else if (command.type === 'heartbeat') {
        if (this.mode !== 'host') throw Error('Operator control has expired');
        this.operatorUntil = now + this.leaseMs; result = {accepted: true};
      } else if (command.type === 'auto') {
        this.mode = 'auto'; this.pending = null; result = {accepted: true, effect: 'finish-committed-moment'};
      } else if (command.type === 'profile') {
        if (!Object.hasOwn(PROFILES, command.profile)) throw Error('Unknown tone');
        this.profile = command.profile; this.route = []; this.pending = null;
        result = {accepted: true, effect: 'apply-after-current-film'};
      } else if (command.type === 'pacing') {
        if (!Object.hasOwn(PACING, command.pacing)) throw Error('Unknown pacing');
        this.pacing = command.pacing; result = {accepted: true};
      } else if (command.type === 'moment') {
        if (this.mode !== 'host') throw Error('Take control first');
        if (!Array.isArray(command.cues) || !command.cues.length || command.cues.length > 16) throw Error('Invalid moment');
        const options = {manual: true, peak: command.peak === true};
        // Validate before replacing a good queued intention.
        const plan = this.plan(command.cues, options);
        const peaks = plan.filter(cue => cue.intensity === 2);
        if (new Set(peaks.map(cue => cue.id)).size !== peaks.length) throw Error('Repeated big moment');
        for (const cue of plan) {
          if (cue.intensity === 2 && (this.current?.id === cue.id || this.route.some(c => c.id === cue.id))) throw Error('Big moment already committed');
          if (cue.intensity === 2 && now - (this.lastPlayed.get(cue.id) ?? -Infinity) < cue.cooldownMs) throw Error('Big moment is cooling down');
        }
        this.pending = {ids: [...command.cues], options}; this.operatorUntil = now + this.leaseMs;
        result = {accepted: true, effect: 'queued-at-safe-boundary', queued: [...command.cues]};
      } else if (command.type === 'playlist') {
        if (!Array.isArray(command.cues) || !command.cues.length || command.cues.length > 64) throw Error('Invalid playlist');
        for (const id of command.cues) { const cue = this.cues.get(id); if (!cue || cue.manualOnly || cue.kind === 'idle') throw Error('Unavailable playlist moment'); }
        this.playlist = [...command.cues]; this.playlistIndex = 0; result = {accepted: true};
      } else if (command.type === 'clear-playlist') {
        this.playlist = []; this.playlistIndex = 0; result = {accepted: true};
      } else throw Error('Unknown command');
    }
    this.lastSequence = command.sequence;
    this.commands.set(command.id, clone(result)); if (this.commands.size > 256) this.commands.delete(this.commands.keys().next().value);
    return result;
  }
  autoPlan(now) {
    const profile = PROFILES[this.profile], form = formAt(this.last?.exitPort);
    const recover = this.profile === 'gentle' && form !== 'friendly';
    if (recover) return this.plan(['friendly-drift'], {recovery: true});
    const dwell = profile.formDwellMs * PACING[this.pacing] * (this.profile === 'haunted' && form === 'friendly' ? .25 : 1);
    if (profile.alternate && now - this.formSince >= dwell) return this.plan([IDLE[form === 'scary' ? 'friendly' : 'scary']]);
    const idle = IDLE[form || profile.initialForm];
    if (this.mode === 'host' || now - this.lastActionAt < profile.actionGapMs * PACING[this.pacing]) return this.plan([idle]);
    if (this.playlist.length) {
      for (let tried = 0; tried < this.playlist.length; tried++) {
        const id = this.playlist[this.playlistIndex], cue = this.cues.get(id);
        if (!this.allowed(cue)) {
          this.record({type: 'playlist-skip', cue: id, reason: 'selected-tone'});
          this.playlistIndex = (this.playlistIndex + 1) % this.playlist.length; continue;
        }
        if (now - (this.lastPlayed.get(id) ?? -Infinity) >= cue.cooldownMs) {
          const plan = this.plan([id]); this.playlistIndex = (this.playlistIndex + 1) % this.playlist.length; return plan;
        }
        break;
      }
      return this.plan([idle]);
    }
    const eligible = [...this.cues.values()].filter(c => c.kind === 'action' && c.entryPort === form + '-rest' && this.allowed(c) &&
      now - (this.lastPlayed.get(c.id) ?? -Infinity) >= c.cooldownMs);
    const varied = eligible.filter(c => !this.recent.slice(-2).includes(c.id));
    const candidates = varied.length ? varied : eligible.filter(c => this.recent.at(-1) !== c.id || eligible.length === 1);
    // Missing joins make a candidate unavailable; they never authorize a fade.
    const plans = candidates.flatMap(cue => { try { return [this.plan([cue.id])]; } catch { return []; } });
    return plans.length ? plans[Math.floor(this.random() * plans.length)] : this.plan([idle]);
  }
  next(now) {
    this.time(now); if (this.status !== 'running' || this.current) return null;
    try {
      if (this.pending) {
        const pending = this.pending; this.pending = null; this.route = this.plan(pending.ids, pending.options);
      }
      if (!this.route.length) this.route = this.autoPlan(now);
      const cue = this.route.shift();
      if (this.last && !this.reviewed(this.last, cue)) throw Error('Unreviewed dispatch boundary');
      const token = this.epoch + ':' + (++this.serial);
      this.current = {id: cue.id, token, seconds: cue.seconds};
      this.record({type: 'dispatch', cue: cue.id, token, mode: this.mode});
      return {...this.current, simulation: this.simulation};
    } catch (error) {
      this.problem = error.message; this.status = 'fault'; this.route = []; this.pending = null;
      this.record({type: 'fault', message: error.message}); return {fault: error.message, effect: 'hold-safe-output'};
    }
  }
  complete(token, now) {
    this.time(now); if (this.status !== 'running' || this.current?.token !== token) return false;
    const cue = this.cues.get(this.current.id), priorForm = formAt(this.last?.exitPort), form = formAt(cue.exitPort);
    this.last = cue; this.current = null;
    if (form && form !== priorForm) this.formSince = now;
    this.lastPlayed.set(cue.id, now);
    if (!['idle', 'morph', 'arrival'].includes(cue.kind)) {
      this.lastActionAt = now; this.recent.push(cue.id); if (this.recent.length > 8) this.recent.shift();
    }
    this.record({type: 'complete', cue: cue.id}); return true;
  }
  inspect() {
    return clone({status: this.status, mode: this.mode, profile: this.profile, pacing: this.pacing, current: this.current,
      last: this.last?.id || null, next: this.pending?.ids || this.route.map(c => c.id),
      operatorUntil: this.operatorUntil, playlist: this.playlist, playlistIndex: this.playlistIndex,
      problem: this.problem, simulation: this.simulation, recent: this.recent, history: this.history});
  }
  exportSettings() { return {schema: 1, profile: this.profile, pacing: this.pacing, playlist: [...this.playlist]}; }
  restoreSettings(settings) {
    if (this.status === 'running') throw Error('Stop before restoring show settings');
    if (settings?.schema !== 1 || !Object.hasOwn(PROFILES, settings.profile) || !Object.hasOwn(PACING, settings.pacing) ||
        !Array.isArray(settings.playlist) || settings.playlist.length > 64 || settings.playlist.some(id => {
          const cue = this.cues.get(id); return !cue || cue.manualOnly || cue.kind === 'idle';
        })) throw Error('Invalid saved show');
    this.profile = settings.profile; this.pacing = settings.pacing; this.playlist = [...settings.playlist]; this.playlistIndex = 0;
    return this.exportSettings();
  }
}
