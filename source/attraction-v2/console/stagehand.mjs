import {StagehandRehearsal} from './rehearsal-player.mjs';
import {MOMENTS, validateSettings, lockedForm} from './rehearsal-plan.mjs';
import {mountFilmOutput} from '../../wisp-performance-reference/runway-pilots/wisp-film-output.js';
import {YardScene} from './yard-scene.mjs';
import {mountSceneControls} from './scene-controls.mjs';
import {YardSpeech, speechSpec} from './yard-speech.mjs';
import {castLabel, readCast, CAST_KEY} from './yard-cast.mjs';
let castChoices = readCast();
import {YardRemote} from './yard-remote.mjs';
import {mountPhoneControls} from '../../../assets/phone-bridge.js';
import {mountPreviewNotice} from './yard-environment.mjs';
mountPreviewNotice();

const $ = id => document.getElementById(id), film = $('film'), canvas = $('stage'), context = canvas.getContext('2d');
const setText = (id, text) => { if ($(id).textContent !== text) $(id).textContent = text; };
const key = 'wisp-stagehand-rehearsal-v1';
let settings = {schema: 1, tone: 'gentle', pace: 'balanced', sequence: []};
try { const saved = localStorage.getItem(key); if (saved) settings = validateSettings(JSON.parse(saved)); } catch {}
let player, scene, sceneControls, speech, remote, phoneMounted = false, disposed = false, drawn = -1, draws = 0, frame = 0, output, holdMessageUntil = 0, lastAutoMotion = 0, autoMotion = 0;
const names = {friendly: 'Watching the path', scary: 'Keeping watch', wave: 'A little hello', 'to-scary': 'Finding his spooky side', 'to-cute': 'Friendly again', return: 'Settling back in'};
const toneNames = {gentle: 'Friendly', mischief: 'Mixed', haunted: 'Evil'};
function message(text, error = false) { $('message').textContent = text; $('message').classList.toggle('error', error); holdMessageUntil = performance.now() + 6000; }
function save() {
  try { localStorage.setItem(key, JSON.stringify(settings)); } catch { message('This browser could not save your settings. They still work for this session.'); }
  player?.plan.update(settings);
  $('settings-summary').textContent = `${toneNames[settings.tone]} · ${settings.pace}`;
  document.querySelectorAll('[data-tone]').forEach(b => b.setAttribute('aria-pressed', b.dataset.tone === settings.tone));
}
function renderSequence() {
  $('sequence-list').replaceChildren();
  settings.sequence.forEach((id, index) => {
    const li = document.createElement('li'), span = document.createElement('span'), remove = document.createElement('button');
    span.textContent = MOMENTS[id]; remove.textContent = 'Remove'; remove.setAttribute('aria-label', `Remove ${MOMENTS[id]} at ${index + 1}`);
    remove.onclick = () => { settings.sequence.splice(index, 1); save(); renderSequence(); };
    li.append(span, remove); $('sequence-list').append(li);
  });
  $('sequence-empty').hidden = settings.sequence.length > 0;
  $('run-sequence').disabled = !settings.sequence.length || !player?.running;
  $('clear-sequence').disabled = !settings.sequence.length;
  document.querySelectorAll('[data-add]').forEach(b => b.disabled = settings.sequence.length >= 24);
}
function paint() {
  const state = player?.inspect();
  if (!state?.running) { if (remote?.waiters.size) remote.invalidate(); if (speech?.active) speech.stop(); scene?.stop(); context.clearRect(0, 0, 1280, 720); drawn = -1; return; }
  if (film.readyState >= 2 && film.currentTime !== drawn) {
    drawn = film.currentTime; draws++;
  }
  scene.render(film, state, {tone: settings.tone});
  if (scene.error && player.running) { speech?.stop(); player.fail(scene.error); scene.stop(); }
}
function refresh() {
  if (disposed) return;
  paint();
  const state = player?.inspect(), running = !!state?.running, loading = !!state?.loading;
  $('start').hidden = running; $('start').disabled = !player || loading;
  $('start').lastChild.textContent = loading ? ' Loading films…' : state?.error ? ' Restart rehearsal' : ' Start rehearsal';
  $('poster').hidden = running || !!state?.error;
  $('connection').textContent = running ? 'Output · live' : 'Output';
  $('connection').classList.toggle('live', running);
  $('now').textContent = names[state?.current] || (loading ? 'Preparing the stage' : state?.error ? 'Stage is black' : 'Ready when you are');
  $('next').textContent = state?.next?.length ? names[state.next[0]] + (state.pending ? ' · then ' + MOMENTS[state.pending] : '') : state?.pending ? MOMENTS[state.pending] + ' queued' : running && state.mode === 'auto' ? 'Wisp chooses' : 'Your cue';
  const mode = state?.mode || 'host';
  $('host').setAttribute('aria-pressed', mode === 'host'); $('auto').setAttribute('aria-pressed', mode === 'auto');
  $('host').disabled = $('auto').disabled = !running;
  document.querySelectorAll('[data-moment]').forEach(b => { b.disabled = !running || !player.plan.allows(b.dataset.moment); b.dataset.queued = String(state?.pending === b.dataset.moment); });
  document.querySelectorAll('[data-action]').forEach(b => b.disabled = !running);
  const target = lockedForm(settings.tone), changing = running && target && (state.form !== target || state.current?.startsWith('to-') || state.next.some(id => id.startsWith('to-')));
  setText('form-status', target ? changing ? `Changing to ${toneNames[settings.tone]} after the current movement…` : `${toneNames[settings.tone]} stays ${toneNames[settings.tone].toLowerCase()}. Actions keep this form.` : 'Mixed can change form. Speech holds its character until the line finishes.');
  $('say-line').textContent = `Say it as ${speakingForm() === 'scary' ? 'Evil' : 'Friendly'}`;
  $('say-line').disabled = !running || !speech?.configured || !castChoices[speakingForm()] || !$('line').value.trim() || speech.queue.length + (speech.active ? 1 : 0) >= 3;
  $('preview-lettering').disabled = !running || !!speech?.active || !!remote?.letteringPending || !$('line').value.trim();
  const hidden = scene?.motion.target.alpha === 0; $('vanish').dataset.action = hidden ? 'appear' : 'vanish'; $('vanish').querySelector('strong').textContent = hidden ? 'Appear' : 'Vanish';
  if (running && mode === 'auto' && !speech?.active && !hidden && state.time - lastAutoMotion > 24) {
    lastAutoMotion = state.time; scene.motion.request(['left', 'home', 'right', 'far', 'home', 'fog'][autoMotion++ % 6], performance.now() / 1000);
  }
  if (!running && speech?.active) speech.stop();
  $('sound').disabled = !running;
  $('motion-open').disabled = !running;
  $('evil-loom').hidden = settings.tone !== 'haunted';
  document.querySelector('[data-moment=welcome]').hidden = settings.tone === 'haunted';
  $('eyes-toggle').disabled = !running || !scene?.eyes.ready || settings.tone === 'gentle';
  if ($('scene-dialog').open) {
    const preview = $('scene-preview').getContext('2d'); preview.drawImage(canvas, 0, 0, 640, 360);
    preview.strokeStyle = '#f7bf61'; preview.lineWidth = 1; preview.beginPath();
    scene.settings.corners.forEach((p, i) => preview[i ? 'lineTo' : 'moveTo'](p[0] * 6.4, p[1] * 3.6)); preview.closePath(); preview.stroke();
  }
  if (state?.error && $('message').textContent !== state.error) message(state.error, true);
  else if (running && performance.now() > holdMessageUntil) {
    $('message').classList.remove('error'); setText('message', mode === 'auto' ? (player.plan.sequenceOn ? 'Your sequence is running. Tap a moment to take over.' : 'Wisp is choosing moments. Tap a moment to take over.') : 'Tap a moment. Wisp finishes his movement before taking your cue.');
  }
  frame = requestAnimationFrame(refresh);
}
function setMode(mode) {
  if (!player?.running) return;
  player.plan.setMode(mode);
  if (mode === 'auto' && scene.motion.target.alpha === 0) scene.motion.request('appear', performance.now() / 1000);
  message(mode === 'auto' ? 'Wisp takes over after the movement already in progress.' : 'You have the stage. Pick a moment.');
}
function request(id) { try { player.request(id); message(`${MOMENTS[id]} queued. The movement already playing will finish first.`); } catch (error) { message(error.message, true); } }
function stop() { remote?.invalidate(); speech?.stop(); player?.stop(); film.muted = true; syncSound(); paint(); output?.blackout(); output?.releasePictures(); message('Stopped. The projector is black and sound is off.'); }
function syncSound() { $('sound').setAttribute('aria-pressed', !film.muted); $('sound').querySelector('span').textContent = film.muted ? 'Sound off' : 'Effects on'; $('sound').querySelector('img').src = `./vendor/phosphor/speaker-${film.muted ? 'slash' : 'high'}-bold.svg`; }
async function startShow() { if (await player.start()) { lastAutoMotion = autoMotion = 0; output?.blackout(); message(scene.eyes.error || scene.vapor.error || 'Choose a character, cue an action, or give Wisp a line.'); renderSequence(); return true; } return false; }
$('start').onclick = startShow;
$('stop').onclick = stop;
$('loops-link').onclick = stop;
$('auto').onclick = () => setMode('auto'); $('host').onclick = () => setMode('host');
document.querySelectorAll('[data-moment]').forEach(b => b.onclick = () => request(b.dataset.moment));
function performAction(action) {
  if (!player?.running) return;
  player.plan.setMode('host'); if (action === 'vanish') { remote?.invalidate(); speech.stop(); }
  scene.motion.request(action, performance.now() / 1000); message('Movement cued. The character stays in the selected form.');
}
document.querySelectorAll('[data-action]').forEach(b => b.onclick = () => performAction(b.dataset.action));
$('sound').onclick = () => { film.muted = !film.muted; syncSound(); message(film.muted ? 'Sound off.' : 'Existing dry effects on this device. The wave is silent; projector output stays silent.'); };
for (const [trigger, dialog] of [['settings-open', 'settings-dialog'], ['sequence-open', 'sequence-dialog'], ['compose', 'line-dialog'], ['motion-open', 'motion-dialog'], ['connection', 'output-dialog'], ['phone-open', 'phone-dialog']]) $(trigger).onclick = () => { renderSequence(); $(dialog).showModal(); if (dialog === 'line-dialog') void voiceStatus(); };
$('tone').value = settings.tone; $('pace').value = settings.pace;
function chooseTone(tone) { if (settings.tone === tone) return; remote?.invalidate(); speech?.stop(); settings.tone = tone; $('tone').value = tone; save(); message(tone === 'mischief' ? 'Mixed mode. Auto may change characters.' : `${toneNames[tone]} locked. Any form change uses the painted morph; speech for the old form was cleared.`); }
$('tone').onchange = () => chooseTone($('tone').value);
document.querySelectorAll('[data-tone]').forEach(b => b.onclick = () => chooseTone(b.dataset.tone));
$('pace').onchange = () => { settings.pace = $('pace').value; save(); };
document.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { if (settings.sequence.length < 24) settings.sequence.push(b.dataset.add); save(); renderSequence(); });
$('clear-sequence').onclick = () => { settings.sequence = []; save(); renderSequence(); };
$('run-sequence').onclick = () => { player.plan.sequenceOn = true; player.plan.cursor = 0; setMode('auto'); $('sequence-dialog').close(); message('Sequence on. Each moment has room to breathe between performances.'); };
function speakingForm() { return lockedForm(settings.tone) || player?.inspect().form || 'friendly'; }
async function voiceStatus() {
  refreshCast();
  if (!speech) return;
  const status = await speech.status();
  if (status.phoneReady && !phoneMounted && !disposed) {
    phoneMounted = true; mountPhoneControls({controller: () => remote, previewCanvas: () => canvas, host: $('yard-phone-controls')});
    $('yard-phone-controls').querySelector('details').open = true;
    $('yard-phone-controls').querySelector('summary').textContent = 'Direct Wisp from your phone';
    $('yard-phone-controls').querySelector('p.help').textContent = 'Enable on trusted Wi-Fi, then scan the address and enter the pairing code. Send words and actions while the laptop runs the projection and sound. No microphone needed.';
    const enable = $('phoneEnable').onclick;
    $('phoneEnable').onclick = async event => { try { await speech.unlock(); await enable(event); } catch (error) { $('phoneStatus').textContent = error.message; } };
    $('phone-open').hidden = false;
  }
  $('voice-connection').textContent = status.configured ? 'Character voice connected. Sound plays on this laptop.' : status.available ? 'Connect once; this laptop remembers the key in Mac Keychain.' : 'This preview is picture-only. Open the voice-enabled console for speech.';
  $('connect-voice').hidden = !status.available || status.configured;
  $('voice-console-link').hidden = status.available;
  if (speech.phase === 'idle') $('speech-status').textContent = !status.configured ? 'Connect voice to enable Say it.' : !castChoices[speakingForm()] ? 'Choose a connected voice for this character on the casting page. Silent lettering is ready.' : player.running ? 'Ready. Your selected character will speak this exact line.' : 'Start the show to speak.';
}
$('connect-voice').onclick = async () => { $('connect-voice').disabled = true; try { await speech.connect(); await voiceStatus(); } catch (error) { $('voice-connection').textContent = error.message; } finally { $('connect-voice').disabled = false; } };
document.querySelectorAll('[data-line]').forEach(b => b.onclick = () => { $('line').value = b.dataset.line; $('line').focus(); });
$('say-line').onclick = async () => {
  try { const epoch = speech.epoch, form = speakingForm(), text = $('line').value, lettering = $('lettering').checked; await speech.unlock(); if (epoch !== speech.epoch || disposed) return; speech.enqueue(text, form, lettering); }
  catch (error) { $('speech-status').textContent = error.message; }
};
$('cancel-speech').onclick = () => { remote?.invalidate(); speech.stop(); };
$('casting-link').onclick = () => { speech.stop(); film.muted = true; syncSound(); };
function refreshCast() {
  const choices = castChoices = readCast();
  $('cast-summary').textContent = `Friendly: ${castLabel('friendly', choices)}. Evil: ${castLabel('scary', choices)}. Voice choices apply to new lines, including your phone.`;
}
window.addEventListener('storage', event => { if (event.key === CAST_KEY || event.key === null) refreshCast(); });
refreshCast();
$('preview-lettering').onclick = () => {
  try {
    const form = speakingForm(), spec = speechSpec($('line').value, form), start = performance.now();
    scene.lettering.show(spec.text, form, () => (performance.now() - start) / 1000, Math.max(4, Math.min(14, spec.text.length / 16)));
    $('line-dialog').close(); message('Silent lettering preview. No voice generated or credits used.');
  } catch (error) { $('speech-status').textContent = error.message; }
};
document.addEventListener('keydown', e => {
  if (document.querySelector('dialog[open]') || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (e.key === 'Escape') stop();
  if (player?.running && e.key === '1' && !e.repeat) request('welcome');
});
window.addEventListener('pagehide', () => { disposed = true; cancelAnimationFrame(frame); remote?.dispose(); speech?.dispose(); player?.dispose(); scene?.dispose(); output?.dispose(); }, {once: true});
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
try {
  const response = await fetch('./media/manifest.json'); if (!response.ok) throw Error('Rehearsal package missing');
  const manifest = await response.json(); player = new StagehandRehearsal(film, manifest, settings);
  scene = new YardScene(canvas); await scene.load();
  if (disposed) { scene.dispose(); player.dispose(); } else {
  sceneControls = mountSceneControls(scene, {message, repaint: paint});
  speech = new YardSpeech({player, scene, film, onState: state => { $('speech-status').textContent = state.detail + (state.queued ? ` · ${state.queued} waiting` : ''); }});
  remote = new YardRemote({player, scene, speech, getTone: () => settings.tone, setTone: chooseTone, setMode, start: startShow, stop, action: performAction});
  window.WispYardScene = Object.freeze({inspect: () => ({...scene.inspect(), playback: player.inspect(), speech: speech.inspect(), draws})});
  output = mountFilmOutput(canvas, () => ({...player.inspect(), disposed, metrics: {draws}}), {beforePaint: paint, windowName: 'wisp-stagehand-rehearsal-output'});
  const button = canvas.nextElementSibling;
  button.textContent = 'Open projector'; button.id = 'projector'; $('output-tools').prepend(button);
  save(); renderSequence(); refresh(); void voiceStatus();
  }
} catch (error) { message(error.message, true); $('start').disabled = true; player?.dispose(); scene?.dispose(); }
