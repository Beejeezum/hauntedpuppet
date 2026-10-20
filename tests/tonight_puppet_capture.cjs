const assert = require('node:assert/strict');
const fs = require('node:fs');
const pw = require(process.env.HAUNT_PLAYWRIGHT || 'playwright');
const name = process.env.HAUNT_BROWSER || 'chromium';
(async () => {
 const fixture = await require('./tonight_fixture.cjs').start();
 const browser = await pw[name].launch(name === 'webkit' ? {} : {args:['--mute-audio']});
 let page;
 try {
  page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
   const Native = window.AudioContext;
   window.__contexts = [];window.__contextEvents=[];
   window.AudioContext = function(...args) {const context = new Native(...args);const id=__contexts.length;__contexts.push(context);for(const method of ['resume','close']){const native=context[method].bind(context);context[method]=(...values)=>{__contextEvents.push({id,method,phase:'call',state:context.state});return native(...values).then(value=>{__contextEvents.push({id,method,phase:'resolved',state:context.state});return value;},error=>{__contextEvents.push({id,method,phase:'rejected',state:context.state,message:error.message});throw error;});};}context.addEventListener('statechange',()=>__contextEvents.push({id,phase:'statechange',state:context.state}));return context;};
   window.AudioContext.prototype = Native.prototype;
   window.__captureMode = 'deny'; window.__captureCount = 0; window.__streams = [];window.__fixtureSources=[];
   Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async () => {
    __captureCount++;
    if (__captureMode === 'deny') throw new DOMException('Fixture permission denied','NotAllowedError');
    // The fixture microphone is an independent producer, like hardware.
    // Feeding an owner context its own destination stream causes a WebKit
    // feedback lifecycle artifact after close; it does not model a microphone.
    const context = new Native(), oscillator = context.createOscillator(), destination = context.createMediaStreamDestination();
    oscillator.connect(destination);oscillator.start();await context.resume();
    const stream = destination.stream;__fixtureSources.push({context,oscillator});
    __streams.push(stream);
    if (__captureMode === 'defer') return new Promise(resolve => {window.__grant = () => resolve(stream);});
    return stream;
   }}});
  });
  await page.goto(fixture.base + fixture.prefix + 'puppet.html');
  await page.waitForFunction(() => window.FogPuppet?.inspect().ready);
  assert.equal(await page.evaluate(() => __captureCount),0);
  await page.click('#startMic');
  await page.waitForFunction(() => document.querySelector('#status').textContent === 'Microphone permission declined');
  assert(await page.evaluate(() => __contexts.every(context => context.state === 'closed')));
  assert.equal(await page.locator('#startMic').isEnabled(),true);

  // A Stop while the browser permission dialog is open must defeat a late grant.
  await page.evaluate(() => {__captureMode = 'defer';});
  await page.click('#startMic');
  await page.waitForFunction(() => FogPuppet.inspect().pending && typeof __grant === 'function');
  await page.click('#blackout');
  await page.waitForFunction(() => FogPuppet.inspect().black && !FogPuppet.inspect().pending && __contexts.every(c => c.state === 'closed'));
  await page.evaluate(() => {__grant();});
  await page.waitForFunction(() => __streams.every(stream => stream.getTracks().every(track => track.readyState === 'ended')));
  assert.equal(await page.evaluate(() => FogPuppet.inspect().mic),false);
  assert.equal(await page.evaluate(() => FogPuppet.inspect().audioContext),'not-created');

  // A fresh explicit capture still works after cancellation; device loss closes it.
  await page.click('#show');
  await page.evaluate(() => {__captureMode = 'live';});
  await page.click('#startMic');
  await page.waitForFunction(() => FogPuppet.inspect().mic && !FogPuppet.inspect().pending);
  await page.evaluate(() => {const track = __streams.at(-1).getAudioTracks()[0];track.stop();track.dispatchEvent(new Event('ended'));});
  await page.waitForFunction(() => !FogPuppet.inspect().mic && __contexts.every(c => c.state === 'closed'));
  assert.equal(await page.locator('#status').textContent(),'Microphone disconnected');

  // Leaving the desk while permission is outstanding must also discard its grant.
  await page.evaluate(() => {__captureMode = 'defer';delete window.__grant;});
  await page.click('#startMic');
  await page.waitForFunction(() => FogPuppet.inspect().pending && typeof __grant === 'function');
  await page.evaluate(() => {dispatchEvent(new Event('pagehide'));__grant();});
  await page.waitForFunction(() => FogPuppet.inspect().disposed && __contexts.every(c => c.state === 'closed') && __streams.every(s => s.getTracks().every(t => t.readyState === 'ended')));
  assert.equal(await page.evaluate(() => FogPuppet.inspect().mic),false);
  await page.evaluate(async()=>{for(const source of __fixtureSources){source.oscillator.stop();await source.context.close();}});
  assert.deepEqual(errors,[]);
  fs.mkdirSync('test-results',{recursive:true});
  fs.writeFileSync('test-results/tonight-puppet-capture-'+name+'.json',JSON.stringify({passed:true,permissionDenial:true,stopDefeatsLatePermission:true,retryAfterCancellation:true,deviceEndedCleanup:true,pagehideDefeatsLatePermission:true,allContextsClosed:true,allTracksEnded:true,scope:'Scripted local capture grants and actual Web Audio contexts; no human microphone, provider, upload or acoustic acceptance',errors},null,2));
  console.log('PASS Puppet denied/pending permission, Stop/late grant, explicit retry, device loss and pagehide capture cleanup.');
 } catch(error) {if(page){const state=await page.evaluate(()=>({puppet:window.FogPuppet?.inspect(),status:document.querySelector('#status')?.textContent,contexts:window.__contexts?.map(c=>c.state),contextEvents:window.__contextEvents,streams:window.__streams?.map(s=>s.getTracks().map(t=>({state:t.readyState,hasEndedHandler:typeof t.onended==='function'})))})).catch(()=>null);fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/tonight-puppet-capture-'+name+'-failure.json',JSON.stringify({error:error.message,state},null,2));}throw error;} finally {if(page)await page.evaluate(async()=>{for(const source of window.__fixtureSources||[]){try{source.oscillator.stop();}catch{}if(source.context.state!=='closed')await source.context.close();}}).catch(()=>{});await browser.close();await fixture.close();}
})().catch(error => {console.error(error);process.exitCode=1;});
