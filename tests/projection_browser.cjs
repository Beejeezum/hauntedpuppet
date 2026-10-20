const {liveWorkspaceUrl}=require('./live-url.cjs');
const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.HAUNT_TEST_BASE||'http://127.0.0.1:8770';
(async()=>{
 const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:1600,height:1050}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto(liveWorkspaceUrl(base));await page.waitForFunction(()=>HauntWisp?.inspect().ready&&HauntProjection&&HauntDesk);
 assert((await page.evaluate(()=>HauntDesk.inspect())).sections.every(x=>x.present));
 await page.click('.desk-shortcuts a[href="#projectionSetup"]');await page.click('[data-surface="window"]');
 await page.waitForFunction(()=>HauntProjection.inspect().frames>2);
 const renderer=await page.evaluate(()=>HauntProjection.inspect());assert.equal(renderer.renderer,'perspective-webgl');assert.equal(renderer.error,null);
 const handle=page.locator('.mapping-handle').first();await handle.focus();await handle.press('ArrowRight');
 assert.equal((await page.evaluate(()=>HauntProjection.inspect())).corners[0][0],17.2);
 const before=await page.evaluate(()=>HauntProjection.inspect().corners);await page.getByText('Stage calibration',{exact:true}).click();await page.fill('input[aria-label="Top left X"]','90');await page.locator('input[aria-label="Top left X"]').dispatchEvent('change');
 assert.deepEqual((await page.evaluate(()=>HauntProjection.inspect())).corners,before,'Crossed corners must be rejected');
 await page.check('#mappingTest');const output=await context.newPage();await output.goto(liveWorkspaceUrl(base+'/?projector=1'));await output.waitForFunction(()=>HauntProjection?.inspect().settings.testPattern);
 assert.equal((await output.evaluate(()=>HauntWisp.inspect())).audioState,'not-created');
 await page.click('#blackout');await page.waitForTimeout(100);
 for(const p of [page,output]){const sum=await p.locator(p===page?'#preview':'#projection').evaluate(c=>{const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let sum=0;for(let i=0;i<pixels.length;i+=4)sum+=pixels[i]+pixels[i+1]+pixels[i+2];return sum});assert.equal(sum,0,'Blackout must also suppress calibration');}
 await page.uncheck('#mappingTest');await page.click('[data-cue="appear"]');await page.click('#mappingSave');await page.reload();await page.waitForFunction(()=>HauntWisp?.inspect().ready&&HauntProjection);
 assert.equal((await page.evaluate(()=>HauntProjection.inspect())).corners[0][0],17.2);assert.equal((await page.evaluate(()=>HauntProjection.inspect())).settings.testPattern,false);
 await page.click('.desk-shortcuts a[href="#projectionSetup"]');await page.locator('#mappingImport').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"format":"bad"}')});await page.waitForFunction(()=>document.querySelector('#mappingStatus').textContent.includes('valid Wisp'));
 const proof=path.resolve(__dirname,'../../wisp-upgrade-proof');fs.mkdirSync(proof,{recursive:true});await page.locator('#projectionSetup').screenshot({path:path.join(proof,'04-projection-studio-controls.png')});await page.screenshot({path:path.join(proof,'02-upgraded-desk.png'),fullPage:false});
 await page.setViewportSize({width:390,height:844});assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
 await page.screenshot({path:path.join(proof,'03-mobile-desk.png'),fullPage:true});assert.deepEqual(errors,[]);
 await browser.close();console.log('PASS GPU perspective output, keyboard calibration, invalid corners/import, saved reload, silent output, calibration blackout, mobile overflow.');
})().catch(e=>{console.error(e);process.exit(1)});
