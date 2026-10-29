// Real-time whole-bank rehearsal. No synthetic approvals, accelerated clocks or provider calls.
const assert=require('node:assert/strict'),fs=require('node:fs'),pw=require('playwright');
process.env.HAUNT_TONIGHT_ROOT='dist';
const order=['cute','friendly-wave','friendly-boo-fail','friendly-depart','cute-to-evil','scary','scary-eyes','evil-to-cute'];
const cycles=Number(process.env.HAUNT_CUE_SOAK_CYCLES||2);
assert(Number.isInteger(cycles)&&cycles>=1&&cycles<=10);
const watchdog=setTimeout(()=>{console.error('Whole-bank rehearsal exceeded its bounded runtime');process.exit(1);},cycles*120000+60000);
(async()=>{
 const fixture=await require('./tonight_fixture.cjs').start(),engine=process.env.HAUNT_BROWSER||'chromium';
 const browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{});let page;
 try{
  page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(fixture.base+'/assets/wisp-showdesk/index.html?rehearsal=expanded');await page.waitForFunction(()=>window.WispDesk);
  await page.getByRole('button',{name:'Record cue order',exact:true}).click();
  for(const id of order)await page.locator('#cues [data-cue="'+id+'"]').click();
  assert.deepEqual(await page.locator('.playlist-step select').evaluateAll(a=>a.map(e=>e.value)),order);
  await page.locator('[data-name]').fill('Whole-bank rehearsal');await page.getByRole('button',{name:'Save playlist',exact:true}).click();
  await page.reload();await page.waitForFunction(()=>window.WispDesk);
  assert.deepEqual(await page.locator('.playlist-step select').evaluateAll(a=>a.map(e=>e.value)),order);
  const popup=page.waitForEvent('popup');await page.getByRole('button',{name:'Projector output',exact:true}).click();const output=await popup;
  await output.waitForFunction(()=>window.WispFilmOutput);assert(await output.evaluate(()=>WispFilmOutput.inspect().silent));
  await page.evaluate(()=>{
   window.__bankTrace=[];window.__bankSilence=true;window.__bankLast='';
   window.__bankTimer=setInterval(()=>{const s=WispDesk.inspect();__bankSilence&&=s.media.every(v=>v.muted);const key=s.director.current+':'+s.director.phase;
    if(key!==__bankLast){__bankLast=key;__bankTrace.push({id:s.director.current,phase:s.director.phase,level:s.composition.level,black:s.composition.black,at:performance.now()});}
   },25);
  });
  await page.getByRole('button',{name:'Run saved show',exact:true}).click();
  const required=order.length*cycles+1;
  await page.waitForFunction(({n,order})=>{const playing=__bankTrace.filter(r=>r.phase==='playing');if(playing.some((r,i)=>r.id!==order[i%order.length]))throw Error('Recorded order changed: '+playing.map(r=>r.id).join(', '));return playing.length>=n;},{n:required,order},{timeout:cycles*110000+15000});
  const receipt=await page.evaluate(()=>{clearInterval(__bankTimer);return{trace:__bankTrace,silent:__bankSilence,state:WispDesk.inspect()};});
  assert.deepEqual(receipt.trace.filter(r=>r.phase==='playing').slice(0,required).map(r=>r.id),Array.from({length:required},(_,i)=>order[i%order.length]));
  const blanks=receipt.trace.filter(r=>r.phase==='empty-stage');assert(blanks.length>=order.length*cycles);assert(blanks.every(r=>r.level===0),'Every change passes through a fully black composition');
  for(let i=0;i<receipt.trace.length;i++)if(receipt.trace[i].phase==='entering'){assert(receipt.trace[i].level<.1,'Sampled entrance must still be near its black start, never a full-opacity cut');}
  assert(receipt.silent);assert.equal(await output.locator('video,audio').count(),0);assert.deepEqual(errors,[]);
  await page.getByRole('button',{name:'■ Blackout',exact:true}).click();assert(await page.evaluate(()=>WispDesk.inspect().composition.black&&WispDesk.inspect().media.every(v=>v.paused&&v.muted)));
  await page.evaluate(()=>dispatchEvent(new Event('pagehide')));assert.equal(await page.locator('video').count(),0);
  fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/cue-board-soak-'+engine+'.json',JSON.stringify({passed:true,cycles,order,receipt,errors,scope:'Actual native full rehearsal bank in real time, saved/reloaded running order, fade-through-black state boundaries, repeat wrap, silent output, Blackout and disposal. No human seam/sound acceptance or physical projection proof.'},null,2));
  console.log('PASS '+engine+' '+cycles+' complete eight-film rounds and repeat wrap, real-time playback, saved order, near-black entrances, silent output and cleanup');
 }catch(error){if(page){fs.mkdirSync('test-results',{recursive:true});const evidence=await page.evaluate(()=>({trace:window.__bankTrace,state:window.WispDesk?.inspect()})).catch(()=>({unavailable:true}));fs.writeFileSync('test-results/cue-board-soak-'+engine+'-failure.json',JSON.stringify(evidence,null,2));}throw error;}
 finally{await browser.close();await fixture.close();clearTimeout(watchdog);}
})().catch(error=>{console.error(error);process.exitCode=1;});
