// Native decoding of the single-file movie. Audio is analysed before a silent
// hardware sink; no microphone, provider, or physical projection is involved.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const pw = require('playwright');
process.env.HAUNT_TONIGHT_ROOT = '.';
(async () => {
  const fixture = await require('../tonight_fixture.cjs').start();
  const engine = process.env.HAUNT_BROWSER || 'chromium';
  const full = process.env.HAUNT_MOVIE_FULL === '1';
  const browser = await pw[engine].launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const folder = `work/yard-night-movie/${engine}${full ? '-three-cycles' : '-joins'}`;
  fs.mkdirSync(folder, { recursive: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const report = { engine, fullNormalSpeedThreeCycles: full, errors,
    scope: 'Native H264/AAC movie with real decoded effects through a test-only silent hardware sink. No physical projector or human mix approval.' };
  try {
    const base = process.env.HAUNT_YARD_BASE || `${fixture.base}/source/attraction-v2/console/`;
    await page.goto(base + 'haunt-loops.html');
    const link = page.locator('#movie-download');
    const href = await link.getAttribute('href');
    assert.equal(href, './media/night-watch-loop-v1.mp4');
    assert(await link.getAttribute('download'));
    const src = new URL(href, base).href;
    const harnessURL = new URL('/__night-watch-movie-review', base).href;
    await page.route(harnessURL, route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Isolated movie review</title>' }));
    await page.goto(harnessURL);
    await page.setContent('<body style="margin:0;background:black"><button id="start">Test movie</button><video style="display:block;width:1280px" playsinline loop></video><canvas width="1280" height="720" hidden></canvas></body>');
    await page.evaluate(src => {
      if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = () => { throw Error('No capture permitted'); };
      const video = document.querySelector('video');
      video.crossOrigin = 'anonymous'; video.src = src;
      window.__movie = { wraps: 0, frames: 0, peak: 0, decodedTimes: [], stopped: false, maxFrameGap: 0 };
      document.querySelector('#start').onclick = async () => {
        window.__context = new AudioContext();
        const source = __context.createMediaElementSource(video), analyser = __context.createAnalyser(), silent = __context.createGain();
        silent.gain.value = 0; source.connect(analyser); analyser.connect(silent); silent.connect(__context.destination);
        const data = new Float32Array(analyser.fftSize);
        window.__timer = setInterval(() => { analyser.getFloatTimeDomainData(data); __movie.peak = Math.max(__movie.peak, ...data.map(Math.abs)); }, 50);
        let previous = -1, wall = 0;
        const frame = (now, info) => {
          __movie.frames++;
          if (previous > 100 && info.mediaTime < 2) __movie.wraps++;
          if (wall) __movie.maxFrameGap = Math.max(__movie.maxFrameGap, (now - wall) / 1000);
          wall = now; previous = info.mediaTime;
          if (__movie.decodedTimes.length < 500 && __movie.frames % 30 === 0) __movie.decodedTimes.push(info.mediaTime);
          if (!__movie.stopped) video.requestVideoFrameCallback(frame);
        };
        video.requestVideoFrameCallback(frame);
        await __context.resume(); await video.play();
      };
    }, src);
    await page.locator('#start').click();
    await page.waitForFunction(() => __movie.frames > 10 && __movie.peak > .005, null, { timeout: 15000 });
    assert(await page.evaluate(() => { const v = document.querySelector('video'); return v.videoWidth === 1280 && v.videoHeight === 720 && v.duration > 120 && v.duration < 130 && !v.error; }));
    if (full) {
      await page.waitForFunction(() => __movie.wraps >= 3, null, { timeout: 400000 });
    } else {
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => { const v = document.querySelector('video'); v.currentTime = v.duration - 1.1; });
        await page.waitForFunction(count => __movie.wraps > count, i, { timeout: 10000 });
      }
    }
    report.decode = await page.evaluate(() => ({ ...__movie, duration: document.querySelector('video').duration, error: document.querySelector('video').error }));
    assert.equal(report.decode.error, null); assert(report.decode.peak > .005 && report.decode.peak < .8);
    assert(report.decode.wraps >= 3);
    // The exact picture/audio boundaries are checked offline over decoded samples.
    // Inspect a representative native frame here and confirm stop releases audio.
    await page.evaluate(() => { const v = document.querySelector('video'); v.currentTime = 54; });
    await page.waitForFunction(() => document.querySelector('video').currentTime > 54.2);
    await page.locator('video').screenshot({ path: folder + '/spider.png' });
    await page.evaluate(async () => { __movie.stopped = true; clearInterval(__timer); const v = document.querySelector('video'); v.pause(); v.removeAttribute('src'); v.load(); await __context.close(); });
    assert(await page.evaluate(() => document.querySelector('video').paused && __context.state === 'closed'));
    assert.deepEqual(errors, []);
    report.result = 'passed';
    fs.writeFileSync(folder + '/report.json', JSON.stringify(report, null, 2));
    console.log(`PASS ${engine} single-file movie, embedded effects, ${full ? 'three normal-speed cycles' : 'three seek-assisted native loop joins'}, stop and audio cleanup.`);
  } catch (error) {
    report.result = 'failed'; report.failure = String(error);
    report.state = await page.evaluate(() => { const v = document.querySelector('video'); return { movie: window.__movie, video: v && { time: v.currentTime, duration: v.duration, readyState: v.readyState, error: v.error && { code: v.error.code, message: v.error.message } } }; }).catch(() => null);
    fs.writeFileSync(folder + '/report.json', JSON.stringify(report, null, 2)); throw error;
  } finally { await browser.close(); await fixture.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
