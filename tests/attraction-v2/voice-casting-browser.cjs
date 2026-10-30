// Actual generated audition files, always muted. No provider requests or human listening verdict.
const assert=require('node:assert/strict'),fs=require('node:fs'),pw=require('playwright');process.env.HAUNT_TONIGHT_ROOT='.';
(async()=>{const fixture=await require('../tonight_fixture.cjs').start(),engine=process.env.HAUNT_BROWSER||'chromium',browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{ }),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],requests=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/'))requests.push(r.url());});
try{
 await page.addInitScript(()=>{if(!sessionStorage.getItem('casting-test-initialized')){localStorage.setItem('wisp-character-casting-2026-10-30','null');sessionStorage.setItem('casting-test-initialized','yes');}});
 await page.goto(fixture.base+'/source/attraction-v2/console/voice-casting.html');
 await page.waitForFunction(()=>[...document.querySelectorAll('audio')].every(a=>Number.isFinite(a.duration)&&a.duration>1));
 const media=await page.evaluate(()=>[...document.querySelectorAll('audio')].map(a=>({duration:a.duration,paused:a.paused,label:a.getAttribute('aria-label')})));
 assert.equal(media.length,9);assert(media.every(a=>a.paused&&a.label));
 await page.evaluate(async()=>{const a=[...document.querySelectorAll('audio')];a.forEach(x=>x.muted=true);await a[1].play();});
 await page.waitForFunction(()=>document.querySelectorAll('audio')[1].currentTime>.1);
 await page.evaluate(()=>document.querySelectorAll('audio')[2].play());
 await page.waitForFunction(()=>document.querySelectorAll('audio')[2].currentTime>.1);
 assert.equal(await page.evaluate(()=>[...document.querySelectorAll('audio')].filter(a=>!a.paused).length),1);
 assert(await page.evaluate(()=>document.querySelectorAll('audio')[1].paused));
 for(const id of ['friendly-c','evil-c','friendly-d','evil-d']){
  await page.locator(`[data-candidate=${id}] audio`).evaluate(a=>a.play());
  await page.waitForFunction(id=>document.querySelector(`[data-candidate=${id}] audio`).currentTime>.15,id);
  assert.equal(await page.evaluate(()=>[...document.querySelectorAll('audio')].filter(a=>!a.paused).length),1);
 }
 await page.locator('[data-candidate=friendly-b] button').click();await page.locator('[data-candidate=evil-a] button').click();
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('wisp-character-casting-2026-10-30'))),{friendly:'friendly-b',evil:'evil-a'});
 assert.equal(await page.locator('button[aria-pressed=true]:not([data-live])').count(),2);
 // Feedback never installs a live voice. Explicit installation makes no provider request.
 assert.equal(await page.evaluate(()=>localStorage.getItem('wisp-yard-live-cast-v1')),null);
 for(const id of ['friendly-d','evil-d']){assert.equal(await page.locator(`[data-candidate=${id}] [data-live]`).count(),0);await page.locator(`[data-candidate=${id}] button`).click();}
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('wisp-character-casting-2026-10-30'))),{friendly:'friendly-d',evil:'evil-d'});
 assert.equal(await page.evaluate(()=>localStorage.getItem('wisp-yard-live-cast-v1')),null);
 await page.locator('[data-live=friendly-c]').click();await page.locator('[data-live=evil-c]').click();
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('wisp-yard-live-cast-v1'))),{friendly:'friendly-c',scary:'evil-c'});
 const spec=await page.evaluate(async()=>{const {speechSpec}=await import('./yard-speech.mjs');return [speechSpec('Hi!','friendly'),speechSpec('Boo!','scary')];});
 assert.deepEqual(spec.map(x=>x.voice),['marin','cedar']);assert.equal(await page.locator('[data-live][aria-pressed=true]').count(),2);
 await page.evaluate(()=>[...document.querySelectorAll('audio')].forEach(a=>a.pause()));
 for(const width of [390,320]){await page.setViewportSize({width,height:844});assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)));}
 await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 const violations=await page.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[]);
 await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide')));
 assert(await page.evaluate(()=>[...document.querySelectorAll('audio')].every(a=>a.paused&&!a.hasAttribute('src'))));
 const restored=page.waitForEvent('domcontentloaded');await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await restored;await page.waitForFunction(()=>[...document.querySelectorAll('audio')].every(a=>a.duration>1));assert.equal(await page.locator('button[aria-pressed=true]:not([data-live])').count(),2);assert(await page.evaluate(()=>[...document.querySelectorAll('audio')].every(a=>a.paused)));
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('wisp-character-casting-2026-10-30'))),{friendly:'friendly-d',evil:'evil-d'});
 await page.screenshot({path:`work/yard-operator/${engine}-casting-connected.png`,fullPage:true});assert.deepEqual(requests,[]);assert.deepEqual(errors,[]);fs.mkdirSync('work/yard-operator',{recursive:true});fs.writeFileSync(`work/yard-operator/${engine}-casting.json`,JSON.stringify({engine,media,noAutoplay:true,onePlayback:true,newCandidateActualMutedPlayback:true,localStudiesNotLive:true,selection:true,explicitLiveCastSelection:true,feedbackDoesNotInstall:true,corruptStorageHandled:true,noProviderCalls:true,cleanup:true,restoredPageLifecycle:'simulated persisted pageshow reloads playable sources without autoplay; selections retained',violations,quality:'not judged by automated test'},null,2));console.log('PASS '+engine+' real audition decode, no autoplay, exclusive playback, selection, storage recovery, page restore and mobile accessibility.');
}finally{await browser.close();await fixture.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
