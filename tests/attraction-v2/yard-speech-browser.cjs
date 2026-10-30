// Actual films + AudioContext playback, MOCK provider PCM. No paid calls or microphone.
const assert = require('node:assert/strict'), fs = require('node:fs'), pw = require('playwright');
process.env.HAUNT_TONIGHT_ROOT = '.';
function wav(seconds) {
 const n=24000*seconds, b=Buffer.alloc(44+n*2); b.write('RIFF'); b.writeUInt32LE(36+n*2,4); b.write('WAVEfmt ',8); b.writeUInt32LE(16,16); b.writeUInt16LE(1,20); b.writeUInt16LE(1,22); b.writeUInt32LE(24000,24); b.writeUInt32LE(48000,28); b.writeUInt16LE(2,32); b.writeUInt16LE(16,34); b.write('data',36); b.writeUInt32LE(n*2,40); return b.toString('base64');
}
(async()=>{
 const requests=[],engine=process.env.HAUNT_BROWSER||'chromium'; let delay=0, fail=false;
 const fixture=await require('../tonight_fixture.cjs').start({requestHandler:async(req,res,path)=>{
  if(path==='/api/status'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({configured:true,token:'test-only'}));return true;}
  if(path!=='/api/performance')return false;
  let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw);requests.push(body);
  assert.equal(req.headers['x-haunt-token'],'test-only');await new Promise(r=>setTimeout(r,delay));
  res.writeHead(fail?503:200,{'Content-Type':'application/json'});res.end(JSON.stringify(fail?{error:'Simulated provider failure'}:{audio:wav(5)}));return true;
 }});
 const browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{ }),context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));fs.mkdirSync('work/yard-operator',{recursive:true});
 const state=()=>page.evaluate(()=>WispYardScene.inspect());
 const waitPhase=phase=>page.waitForFunction(p=>WispYardScene.inspect().speech.phase===p,phase,{timeout:20000});
 async function line(text){await page.locator('#line').fill(text);await page.locator('#say-line').click();}
 try{
  await page.goto(fixture.base+'/source/attraction-v2/console/index.html');
  await page.waitForFunction(()=>window.WispYardScene);
  assert.deepEqual((await state()).speech.castReady,{friendly:false,scary:false});assert(await page.locator('#say-line').isDisabled());
  const casting=await page.context().newPage();await casting.goto(fixture.base+'/source/attraction-v2/console/voice-casting.html');
  await casting.locator('[data-live=friendly-c]').click();await casting.locator('[data-live=evil-c]').click();
  await page.waitForFunction(()=>document.getElementById('cast-summary').textContent.includes('Dark, amused spirit'));
  await casting.close();assert.equal(requests.length,0);
  await page.locator('[data-tone=haunted]').click();await page.locator('#start').click();
  await page.waitForFunction(()=>WispYardScene.inspect().playback.current==='scary');
  assert.equal((await state()).playback.form,'scary');assert(await page.locator('[data-moment=welcome]').isDisabled());
  await page.locator('#motion-open').click();await page.locator('[data-action=far]').click();await page.getByRole('button',{name:'Close movement'}).click();await page.waitForTimeout(1200);
  assert((await state()).movement.value.scale<.85);assert.equal((await state()).playback.form,'scary');
  await page.locator('#vanish').click();await page.waitForTimeout(1600);assert((await state()).movement.value.alpha<.05);
  await page.locator('#auto').click();await page.waitForTimeout(1800);assert((await state()).movement.value.alpha>.95);assert.equal((await state()).playback.form,'scary');await page.locator('#host').click();
  await page.locator('#compose').click();await page.waitForFunction(()=>WispYardScene.inspect().speech.configured);
  await page.locator('#line').fill('Welcome to my haunted garden.');await page.locator('#preview-lettering').click();
  await page.waitForTimeout(850);assert((await state()).lettering);assert.equal(requests.length,0);
  fs.writeFileSync(`work/yard-operator/${engine}-silent-lettering.png`,Buffer.from((await page.locator('#stage').evaluate(c=>c.toDataURL())).split(',')[1],'base64'));
  await page.locator('#compose').click();await page.locator('#cancel-speech').click();
  await line('Who is wandering through my garden?');await waitPhase('speaking');
  assert.equal(requests[0].voice,'cedar');assert.equal((await state()).speech.form,'scary');
  await page.waitForTimeout(450);assert((await state()).lettering);
  await page.screenshot({path:`work/yard-operator/${engine}-speech.png`});
  fs.writeFileSync(`work/yard-operator/${engine}-lettering.png`, Buffer.from((await page.locator('#stage').evaluate(c=>c.toDataURL())).split(',')[1], 'base64'));
  await line('A second line.');await line('A third line.');assert.equal((await state()).speech.queued,2);await page.waitForFunction(()=>document.querySelector('#say-line').disabled);
  await page.locator('#cancel-speech').click();assert(!(await state()).speech.active);assert.equal((await state()).speech.queued,0);assert(!(await state()).lettering);
  await page.getByRole('button',{name:'Close speech',exact:true}).click();
  await page.locator('[data-tone=gentle]').click();
  await page.waitForFunction(()=>{const s=WispYardScene.inspect().playback;return s.current==='friendly'&&!s.next.some(x=>x.startsWith('to-'));},null,{timeout:30000});
  assert.equal((await state()).playback.targetForm,'friendly');
  await page.locator('#compose').click();await line('Happy Halloween, little ghosts!');await waitPhase('speaking');assert.equal(requests.at(-1).voice,'marin');
  await page.getByRole('button',{name:'Close speech',exact:true}).click();
  await page.locator('[data-tone=haunted]').click();assert(!(await state()).speech.active);assert(!(await state()).lettering);
  // A provider response arriving after cancellation cannot speak or draw.
  delay=1100;await page.locator('#compose').click();await line('This cancelled line must never play.');await waitPhase('preparing');await page.locator('#cancel-speech').click();await page.waitForTimeout(1500);
  assert(!(await state()).speech.active);assert(!(await state()).lettering);
  delay=0;fail=true;await line('Provider failure test.');await waitPhase('error');assert.match(await page.locator('#speech-status').innerText(),/Simulated provider failure/);assert((await state()).playback.running);
  fail=false;await page.getByRole('button',{name:'Close speech',exact:true}).click();
  await page.locator('#stop').click();assert(!(await state()).running);assert.equal((await state()).movement.value.scale,1);
  await page.reload();await page.locator('#start').click();await page.waitForFunction(()=>WispYardScene.inspect().playback.current==='scary');
  assert.equal((await state()).playback.form,'scary');
  await page.locator('#connection').click();const pp=page.waitForEvent('popup');await page.locator('#projector').click();const popup=await pp;await popup.waitForLoadState();
  assert.equal(await popup.locator('video,audio').count(),0);assert(await popup.evaluate(()=>WispFilmOutput.inspect().silent));
  await page.getByRole('button',{name:'Close output',exact:true}).click();await page.locator('#compose').click();await line('The projector must stay silent.');await waitPhase('speaking');
  await page.getByRole('button',{name:'Close speech',exact:true}).click();await page.locator('#stop').click();assert(!(await state()).speech.active);
  assert.equal(await popup.evaluate(()=>Math.max(...document.querySelector('canvas').getContext('2d').getImageData(640,360,1,1).data)),0);
  assert.deepEqual(errors,[]);
  fs.writeFileSync(`work/yard-operator/${engine}-speech.json`,JSON.stringify({engine,provider:'mock PCM; no provider quality test',requests:requests.length,errors,passed:['evil startup','locked actions','friendly authored transition','explicit casting across tabs', 'distinct selected voice profiles','lettering','three-line queue','cancel active','cancel late preparation','mode-change cancels old voice','provider failure preserves film','saved evil restart','silent projector','global stop']},null,2));
  console.log('PASS '+engine+' character locks, spatial movement, mock voice/lettering/queue/cancellation, provider failure and silent projector.');
 }catch(e){await page.screenshot({path:`work/yard-operator/${engine}-failure.png`});console.error(errors);throw e;}
 finally{await browser.close();await fixture.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
