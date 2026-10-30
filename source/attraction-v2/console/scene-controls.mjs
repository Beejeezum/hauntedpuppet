import {sceneDefaults, validateScene} from './scene-settings.mjs';
const KEY = 'wisp-yard-scene-v1';
export function mountSceneControls(scene, {message, repaint}) {
  const $ = id => document.getElementById(id), dialog = $('scene-dialog');
  try { const saved = localStorage.getItem(KEY); if (saved) scene.set(JSON.parse(saved)); } catch { message('Saved yard setup was invalid; the default placement is ready.'); }
  const inputs = dialog.querySelectorAll('[data-scene]');
  const corners = $('scene-corners'), cornerNames = ['Top left', 'Top right', 'Bottom right', 'Bottom left'];
  let dragging = null;
  cornerNames.forEach((name, i) => {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = String(i + 1); button.dataset.handle = i;
    button.onpointerdown = e => { e.preventDefault(); dragging = i; button.setPointerCapture(e.pointerId); };
    button.onpointermove = e => {
      if (dragging !== i) return;
      const rect = $('scene-preview').getBoundingClientRect();
      change(next => { next.corners[i] = [Math.max(0, Math.min(100, (e.clientX - rect.left) / rect.width * 100)), Math.max(0, Math.min(100, (e.clientY - rect.top) / rect.height * 100))]; });
    };
    button.onpointerup = button.onpointercancel = () => { dragging = null; };
    button.onkeydown = e => {
      const delta = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}[e.key];
      if (!delta) return; e.preventDefault();
      change(next => { next.corners[i] = next.corners[i].map((v, j) => Math.max(0, Math.min(100, v + delta[j] * (e.shiftKey ? 2 : .5)))); });
    };
    corners.append(button);
  });
  function refresh() {
    const s = scene.settings;
    for (const el of inputs) {
      const [group, prop] = el.dataset.scene.split('.'), value = prop ? s[group][prop] : s[group];
      if (el.type === 'checkbox') el.checked = value; else el.value = value;
      const out = dialog.querySelector(`[data-value="${el.dataset.scene}"]`); if (out) out.textContent = Math.round(value) + '%';
    }
    dialog.querySelectorAll('[data-corner]').forEach(el => { const [i, axis] = el.dataset.corner.split(',').map(Number); el.value = s.corners[i][axis]; });
    [...corners.children].forEach((button, i) => { const p = s.corners[i]; button.style.left = p[0] + '%'; button.style.top = p[1] + '%'; button.setAttribute('aria-label', `${cornerNames[i]} surface corner. ${p[0].toFixed(1)} across, ${p[1].toFixed(1)} down. Drag or use arrow keys.`); });
    $('eyes-toggle').setAttribute('aria-pressed', String(s.eyes.visible));
    $('eyes-toggle').querySelector('span').textContent = s.eyes.visible ? 'Watching in the dark' : 'Hidden';
  }
  function change(fn) {
    const next = structuredClone(scene.settings); fn(next);
    try {
      scene.set(validateScene(next)); refresh(); repaint();
      try { localStorage.setItem(KEY, JSON.stringify(scene.settings)); $('scene-status').textContent = 'Placement saved on this laptop.'; }
      catch { $('scene-status').textContent = 'Placement works for this session; browser storage is unavailable.'; }
    } catch (error) { $('scene-status').textContent = error.message; refresh(); }
  }
  for (const el of inputs) el.addEventListener('input', () => change(next => {
    const [group, prop] = el.dataset.scene.split('.'), value = el.type === 'checkbox' ? el.checked : el.tagName === 'SELECT' ? el.value : +el.value;
    if (prop) next[group][prop] = value; else next[group] = value;
  }));
  dialog.querySelectorAll('[data-corner]').forEach(el => el.addEventListener('input', () => change(next => {
    const [i, axis] = el.dataset.corner.split(',').map(Number); next.corners[i][axis] = +el.value;
  })));
  $('scene-open').onclick = () => { $('output-dialog').close(); refresh(); dialog.showModal(); };
  $('scene-reset').onclick = () => change(next => Object.assign(next, sceneDefaults()));
  $('eyes-toggle').onclick = () => { change(next => { next.eyes.visible = !next.eyes.visible; }); message(scene.settings.eyes.visible ? 'Eyes will peek from the dark, then disappear between looks.' : 'The separate eyes layer is hidden.'); };
  refresh();
  return {refresh};
}
