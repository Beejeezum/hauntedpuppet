// Forms are a policy, not an action. Only Mixed can change form automatically.
export const MOMENTS = Object.freeze({notice: 'Keep watch', welcome: 'Wave hello', spook: 'Become evil'});
export const TONES = ['gentle', 'mischief', 'haunted'];
export const PACES = {relaxed: 1.5, balanced: 1, lively: .75};
export const lockedForm = tone => tone === 'gentle' ? 'friendly' : tone === 'haunted' ? 'scary' : null;
export function routeFor(form, moment) {
  if (!['friendly', 'scary'].includes(form) || !Object.hasOwn(MOMENTS, moment)) throw Error('Unavailable performance');
  if (moment === 'notice') return [form];
  if (moment === 'welcome') return form === 'scary' ? ['to-cute', 'return', 'wave', 'friendly'] : ['wave', 'friendly'];
  return form === 'friendly' ? ['to-scary', 'scary'] : ['scary'];
}
export function validateSettings(value) {
  if (value?.schema !== 1 || !TONES.includes(value.tone) || !Object.hasOwn(PACES, value.pace) ||
      !Array.isArray(value.sequence) || value.sequence.length > 24 || value.sequence.some(id => !Object.hasOwn(MOMENTS, id))) throw Error('Invalid saved rehearsal');
  return {schema: 1, tone: value.tone, pace: value.pace, sequence: [...value.sequence]};
}
export class RehearsalPlan {
  constructor(settings = {schema: 1, tone: 'gentle', pace: 'balanced', sequence: []}) {
    Object.assign(this, validateSettings(settings)); this.reset();
  }
  get initialForm() { return lockedForm(this.tone) || 'friendly'; }
  get targetForm() { return this.speechForm || lockedForm(this.tone); }
  allows(moment) { return !(this.tone === 'gentle' && moment === 'spook' || this.tone === 'haunted' && moment === 'welcome'); }
  reset() { this.mode = 'host'; this.pending = null; this.lastAction = 0; this.formSince = 0; this.form = this.initialForm; this.cursor = 0; this.sequenceOn = false; this.speechForm = null; }
  request(moment) {
    if (!Object.hasOwn(MOMENTS, moment)) throw Error('This performance is still being made');
    if (!this.allows(moment)) throw Error('Choose Mixed or change character to use that action.');
    this.mode = 'host'; this.pending = moment; return moment;
  }
  setMode(mode) { if (!['host', 'auto'].includes(mode)) throw Error('Unknown mode'); this.mode = mode; this.pending = null; }
  holdSpeech(form) { if (form !== null && !['friendly', 'scary'].includes(form)) throw Error('Unknown speaking character'); this.speechForm = form; }
  update(settings) { Object.assign(this, validateSettings(settings)); this.cursor = 0; if (this.pending && !this.allows(this.pending)) this.pending = null; }
  choose(form, time) {
    if (form !== this.form) { this.form = form; this.formSince = time; }
    // Preserve an allowed queued action while the authored morph finishes.
    const target = this.targetForm;
    if (target && form !== target) {
      const transition = target === 'scary' ? ['to-scary'] : ['to-cute', 'return'];
      if (this.pending && !this.speechForm) {
        const moment = this.pending; this.pending = null; this.lastAction = time;
        return [...transition, ...routeFor(target, moment)];
      }
      return [...transition, target];
    }
    // A speaking line owns its character until playback ends or the operator cancels it.
    if (this.speechForm) return [form];
    let moment = this.pending; this.pending = null;
    if (!moment && this.mode === 'auto' && time - this.lastAction >= 24 * PACES[this.pace]) {
      if (this.sequenceOn && this.sequence.length) {
        for (let n = 0; n < this.sequence.length; n++) {
          const candidate = this.sequence[this.cursor++ % this.sequence.length];
          if (this.allows(candidate)) { moment = candidate; break; }
        }
      } else if (this.tone === 'gentle') moment = 'welcome';
      else if (this.tone === 'haunted') moment = 'notice';
      else moment = form === 'friendly' && time - this.formSince < 45 ? 'welcome' : form === 'friendly' ? 'spook' : 'welcome';
    }
    if (moment) { this.lastAction = time; return routeFor(form, moment); }
    return [form];
  }
  settings() { return validateSettings(this); }
}
