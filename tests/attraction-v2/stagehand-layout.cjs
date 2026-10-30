const assert = require('node:assert/strict'), fs = require('node:fs'), {chromium} = require('playwright');
process.env.HAUNT_TONIGHT_ROOT = '.';
(async () => {
  const fixture = await require('../tonight_fixture.cjs').start(), browser = await chromium.launch({args: ['--mute-audio']});
  const page = await browser.newPage({viewport: {width: 390, height: 844}});
  try {
    await page.goto(fixture.base + '/source/attraction-v2/console/index.html');
    await page.getByRole('button', {name: 'Start rehearsal', exact: true}).click();
    await page.waitForFunction(() => document.querySelector('video').currentTime > 1);
    const layout = await page.evaluate(() => ({width: innerWidth, height: innerHeight, overflow: document.documentElement.scrollWidth > innerWidth,
      controls: ['stop', 'auto', 'compose', 'sequence-open', 'settings-open'].map(id => {const r = document.getElementById(id).getBoundingClientRect();return {id,top:r.top,bottom:r.bottom,height:r.height};})}));
    assert(!layout.overflow); for (const c of layout.controls) assert(c.top >= 0 && c.bottom <= 844 && c.height >= 44, JSON.stringify(c));
    fs.mkdirSync('work/attraction-v2', {recursive: true}); await page.screenshot({path: 'work/attraction-v2/design-mobile-final.png'});
    await page.addScriptTag({path: require.resolve('axe-core/axe.min.js')});
    const accessibility = await page.evaluate(async () => (await axe.run(document, {runOnly:{type:'tag',values:['wcag2a','wcag2aa']}})).violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)})));
    assert.deepEqual(accessibility, []);
    await page.getByRole('button', {name: 'Build a sequence'}).click(); await page.screenshot({path: 'work/attraction-v2/design-sequence-final.png'});
    await page.getByRole('button', {name: 'Close sequence', exact: true}).click();
    await page.setViewportSize({width:1280,height:900}); await page.screenshot({path:'work/attraction-v2/design-desktop-final.png'});
    await page.setViewportSize({width:320,height:740}); assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)));
    fs.writeFileSync('work/attraction-v2/layout.json',JSON.stringify({layout,accessibility},null,2));
    await page.getByRole('button', {name: 'Stop', exact: true}).click(); console.log('PASS first-screen mobile controls, 320px no horizontal overflow, WCAG A/AA scan, dialog and desktop captures.');
  } finally { await browser.close(); await fixture.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
