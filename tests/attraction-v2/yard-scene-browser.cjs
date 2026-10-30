// Actual local footage and composed pixels, silent isolated browser. Not physical projection QA.
const assert = require('node:assert/strict'), fs = require('node:fs'), pw = require('playwright');
process.env.HAUNT_TONIGHT_ROOT = '.';
(async () => {
  const fixture = await require('../tonight_fixture.cjs').start(), engine = process.env.HAUNT_BROWSER || 'chromium';
  const browser = await pw[engine].launch(engine === 'chromium' ? {args: ['--mute-audio']} : {});
  const page = await browser.newPage({viewport: {width: 1366, height: 900}}), errors = [], report = {engine};
  page.on('pageerror', e => errors.push(e.message)); fs.mkdirSync('work/yard-scene', {recursive: true});
  const stage = () => page.evaluate(() => {
    const c = document.getElementById('stage'), data = c.getContext('2d').getImageData(0, 0, 1280, 720).data;
    let sum = 0, weighted = 0, peak = 0, lit = 0;
    for (let y = 0; y < 720; y += 2) for (let x = 0; x < 1280; x += 2) {
      const i = (y * 1280 + x) * 4, v = Math.max(data[i], data[i + 1], data[i + 2]); peak = Math.max(peak, v);
      if (v > 12) { lit++; sum += v; weighted += v * x; }
    }
    return {peak, lit, centerX: sum ? weighted / sum : 0, cornerRGB: [...data.slice(0, 3)]};
  });
  async function setup() {
    await page.bringToFront();
    await page.getByRole('button', {name: 'Output and rehearsal settings'}).click();
    await page.locator('#output-dialog').waitFor({state: 'visible'});
    await page.getByRole('button', {name: 'Place ghosts & layers'}).click();
  }
  async function range(id, value) { await page.locator('#' + id).fill(String(value)); }
  async function visibleEyes() { await page.waitForFunction(() => { const e = WispYardScene.inspect().eyes; return e.active && e.time > .8 && e.time < 2.3; }, null, {timeout: 16000}); await page.waitForTimeout(70); }
  try {
    await page.goto(fixture.base + '/source/attraction-v2/console/index.html');
    await page.locator('[data-tone=mischief]').click();
    await page.getByRole('button', {name: 'Start rehearsal', exact: true}).click();
    await page.waitForFunction(() => window.WispYardScene?.inspect().frames > 20);
    await visibleEyes(); report.initial = await page.evaluate(() => WispYardScene.inspect());
    assert(report.initial.eyes.ready && report.initial.eyes.muted && report.initial.vapor.ready);
    assert.equal(report.initial.mapping.renderer, 'perspective-webgl');
    await page.locator('#stage').screenshot({path: `work/yard-scene/${engine}-composite.png`});
    await setup(); await page.screenshot({path: `work/yard-scene/${engine}-setup.png`});
    await page.locator('[data-scene="ghost.visible"]').uncheck(); await range('scene-fog', 0);
    await range('scene-eyes-x', 75); await range('scene-eyes-y', 50); await range('scene-eyes-size', 40);
    await visibleEyes(); report.eyesOnly = await stage();
    assert(report.eyesOnly.peak > 80 && report.eyesOnly.centerX > 850 && report.eyesOnly.lit < 20000);
    await page.locator('#stage').screenshot({path: `work/yard-scene/${engine}-eyes-only.png`});
    await page.locator('[data-scene="mirror"]').check(); await page.waitForTimeout(100);
    report.mirrored = await stage(); assert(report.mirrored.centerX < 430 && report.mirrored.peak > 50);
    await page.locator('[data-scene="mirror"]').uncheck();
    // The native passage ends in darkness, waits, then restarts from an invisible frame.
    await page.waitForFunction(() => !WispYardScene.inspect().eyes.active, null, {timeout: 5000});
    await page.waitForTimeout(80); report.intentionalDark = await stage(); assert.equal(report.intentionalDark.peak, 0);
    const plays = await page.evaluate(() => WispYardScene.inspect().eyes.plays);
    await visibleEyes(); assert((await page.evaluate(() => WispYardScene.inspect().eyes.plays)) > plays);
    await page.locator('[data-scene="eyes.visible"]').uncheck(); await page.waitForTimeout(100);
    report.manualHideEnvelope = await page.evaluate(() => WispYardScene.inspect().eyes.visibility);
    assert(report.manualHideEnvelope > 0 && report.manualHideEnvelope < 1);
    await page.waitForTimeout(350); assert.equal((await stage()).peak, 0);
    await page.locator('[data-scene="eyes.visible"]').check();
    await page.waitForFunction(() => WispYardScene.inspect().eyes.active, null, {timeout: 1500});
    // Corner fitting is applied to the composed picture, not only the body layer.
    const corners = [[10, 10], [90, 14], [85, 90], [15, 86]];
    await page.locator('[data-handle="0"]').press('ArrowRight');
    assert.equal(await page.evaluate(() => WispYardScene.inspect().settings.corners[0][0]), .5);
    await page.getByText('Fit the four corners', {exact: true}).click();
    for (let i = 0; i < 4; i++) for (let axis = 0; axis < 2; axis++) await page.locator(`[data-corner="${i},${axis}"]`).fill(String(corners[i][axis]));
    assert.deepEqual(await page.evaluate(() => WispYardScene.inspect().settings.corners), corners);
    await page.locator('[data-corner="0,0"]').fill('100');
    assert.match(await page.locator('#scene-status').innerText(), /valid Wisp yard setup/);
    assert.deepEqual(await page.evaluate(() => WispYardScene.inspect().settings.corners), corners);
    await page.locator('[data-scene="ghost.visible"]').check(); await range('scene-fog', 30);
    await range('scene-ghost-size', 60); await range('scene-ghost-x', 38);
    await page.getByRole('button', {name: 'Close yard setup'}).click(); await page.waitForTimeout(900);
    report.mapped = await stage(); assert.deepEqual(report.mapped.cornerRGB, [0, 0, 0]); assert(report.mapped.peak > 80);
    await page.locator('#stage').screenshot({path: `work/yard-scene/${engine}-mapped.png`});
    await page.getByRole('button', {name: 'Output and rehearsal settings'}).click();
    const popupPromise = page.waitForEvent('popup'); await page.getByRole('button', {name: 'Open projector', exact: true}).click();
    const popup = await popupPromise; await popup.waitForLoadState();
    await page.getByRole('button', {name: 'Close output', exact: true}).click();
    const frames = await page.evaluate(() => WispYardScene.inspect().frames);
    await page.evaluate(() => { window.originalRAF = requestAnimationFrame; window.savedFrame = null; window.requestAnimationFrame = callback => { window.savedFrame = callback; return 0; }; });
    await popup.waitForTimeout(1500);
    report.output = await popup.evaluate(() => ({...WispFilmOutput.inspect(), mediaElements: document.querySelectorAll('video,audio').length}));
    assert(report.output.silent && !report.output.stale && report.output.mediaElements === 0);
    assert((await page.evaluate(() => WispYardScene.inspect().frames)) > frames + 10);
    await page.evaluate(() => { window.requestAnimationFrame = window.originalRAF; if (window.savedFrame) requestAnimationFrame(window.savedFrame); });
    // Gentle excludes the sinister overlay even if its saved toggle is on.
    await page.locator('#settings-open').click(); await page.locator('#tone').selectOption('gentle');
    await page.getByRole('button', {name: 'Close settings', exact: true}).click();
    await page.waitForTimeout(500); assert(!(await page.evaluate(() => WispYardScene.inspect().eyes.active)));
    assert(await page.locator('#eyes-toggle').isDisabled());
    await page.getByRole('button', {name: 'Stop', exact: true}).click(); await page.waitForTimeout(120);
    report.stop = await page.evaluate(() => ({scene: WispYardScene.inspect(), paused: [...document.querySelectorAll('video')].every(v => v.paused)}));
    assert(report.stop.paused && !report.stop.scene.running && !report.stop.scene.eyes.active && report.stop.scene.vapor.particles === 0);
    assert.equal((await stage()).peak, 0);
    assert.equal(await popup.evaluate(() => Math.max(...document.querySelector('canvas').getContext('2d').getImageData(640, 360, 1, 1).data)), 0);
    await page.reload(); await page.waitForFunction(() => window.WispYardScene);
    report.saved = await page.evaluate(() => WispYardScene.inspect().settings);
    assert.equal(report.saved.ghost.size, 60); assert.deepEqual(report.saved.corners, corners);
    await page.getByRole('button', {name: 'Start rehearsal', exact: true}).click(); await page.waitForFunction(() => WispYardScene.inspect().frames > 10);
    await setup(); await page.getByRole('button', {name: 'Reset placement'}).click();
    assert.equal(await page.evaluate(() => WispYardScene.inspect().settings.ghost.size), 82);
    await page.setViewportSize({width: 390, height: 844});
    assert(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)));
    await page.screenshot({path: `work/yard-scene/${engine}-mobile-setup.png`});
    if (engine === 'chromium') {
      await page.addScriptTag({path: require.resolve('axe-core/axe.min.js')});
      report.accessibility = await page.evaluate(async () => (await axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa']}})).violations.map(v => ({id: v.id, nodes: v.nodes.map(n => n.target)})));
      assert.deepEqual(report.accessibility, []);
    }
    // A private component instance tests GPU loss and resource disposal without an app test hook.
    report.gpuLoss = await page.evaluate(async () => {
      const {YardScene} = await import('./yard-scene.mjs'), target = document.createElement('canvas'); target.width = 1280; target.height = 720;
      const scene = new YardScene(target), film = document.querySelector('#film');
      scene.render(film, {running: true}, {now: 10}); const before = scene.mapper.ready;
      scene.mapper.canvas.dispatchEvent(new Event('webglcontextlost', {cancelable: true})); scene.render(film, {running: true}, {now: 100});
      const black = Math.max(...target.getContext('2d').getImageData(640, 360, 1, 1).data) === 0;
      scene.dispose(); return {before, black, disposed: scene.inspect().disposed, textureReleased: scene.mapper.texture === null, eyeRemoved: !scene.eyes.video.isConnected};
    });
    assert(report.gpuLoss.before && report.gpuLoss.black && report.gpuLoss.disposed && report.gpuLoss.textureReleased && report.gpuLoss.eyeRemoved);
    await page.getByRole('button', {name: 'Close yard setup'}).click();
    await page.getByRole('button', {name: 'Stop', exact: true}).click(); await popup.close();
    // Optional overlay corruption cannot silently install changed footage or break the hero.
    await page.route('**/media/eyes-watch.mp4', route => route.fulfill({contentType: 'video/mp4', body: 'changed eyes asset'}));
    await page.reload(); await page.waitForFunction(() => window.WispYardScene);
    report.changedEyes = await page.evaluate(() => WispYardScene.inspect().eyes);
    assert(!report.changedEyes.ready && /changed/.test(report.changedEyes.error));
    await page.getByRole('button', {name: 'Start rehearsal', exact: true}).click(); await page.waitForFunction(() => WispYardScene.inspect().frames > 10);
    assert((await stage()).peak > 80); await page.getByRole('button', {name: 'Stop', exact: true}).click();
    await page.evaluate(() => dispatchEvent(new Event('pagehide')));
    assert((await page.evaluate(() => WispYardScene.inspect().disposed)));
    assert.deepEqual(errors, []); report.errors = errors;
    fs.writeFileSync(`work/yard-scene/${engine}.json`, JSON.stringify(report, null, 2));
    console.log('PASS native eyes, independent placement, mirror, intentional dark/re-entry, calibrated composite, silent popup/owner throttle, Gentle exclusion, Stop, persistence, GPU loss/disposal and changed-asset fallback.');
  } catch (error) {
    fs.writeFileSync(`work/yard-scene/${engine}-failure.json`, JSON.stringify({...report, errors, error: String(error)}, null, 2));
    await page.screenshot({path: `work/yard-scene/${engine}-failure.png`}); throw error;
  } finally { await browser.close(); await fixture.close(); }
})().catch(error => {console.error(error); process.exitCode = 1;});
