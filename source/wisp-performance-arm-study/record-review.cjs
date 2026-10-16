/* Silent local evidence capture. Composite transparent WebGL onto projection black
   before VP8 encoding; raw captureStream loses the intended alpha appearance. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.HAUNT_PLAYWRIGHT || 'playwright');
(async () => {
  const output = process.argv[2];
  if (!output) throw new Error('Provide an output .webm path outside the public build');
  const browser = await chromium.launch({ args: ['--mute-audio'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto((process.env.HAUNT_STUDY_BASE || 'http://127.0.0.1:8812') + '/source/wisp-performance-arm-study/full-character-review.html');
    await page.waitForSelector('canvas');
    const result = await page.evaluate(async () => {
      const source = document.querySelector('canvas');
      const target = document.createElement('canvas');
      target.width = source.width; target.height = source.height;
      const ctx = target.getContext('2d', { alpha: false });
      let animation;
      const paint = () => {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, target.width, target.height);
        ctx.drawImage(source, 0, 0);
        animation = requestAnimationFrame(paint);
      };
      paint();
      const stream = target.captureStream(30);
      const chunks = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 7000000 });
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      const stopped = new Promise(resolve => { recorder.onstop = resolve; });
      const started = performance.now();
      try {
        recorder.start();
        for (const cue of ['wave', 'reach', 'surprise', 'idle']) {
          const button = [...document.querySelectorAll('button')].find(b => b.textContent.trim().toLowerCase() === cue);
          if (!button) throw new Error('Missing cue ' + cue);
          button.click();
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } finally {
        cancelAnimationFrame(animation);
        if (recorder.state !== 'inactive') recorder.stop();
        await stopped;
        stream.getTracks().forEach(track => track.stop());
      }
      return { elapsedMs: performance.now() - started, bytes: Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer())) };
    });
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, Buffer.from(result.bytes));
    const metadata = { elapsedMs: result.elapsedMs, bytes: result.bytes.length, pageErrors: errors, composition: 'opaque black before VP8', scope: 'local synthetic browser cues; silent; no provider or physical projection' };
    fs.writeFileSync(output + '.json', JSON.stringify(metadata, null, 2));
    console.log(JSON.stringify(metadata));
    if (errors.length) throw new Error('Browser errors during capture');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
