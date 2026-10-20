// Verify the deployed Git build, never the uncommitted local dist directory.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
(async()=>{
 const commit=process.argv[2];assert(/^[a-f0-9]{40}$/.test(commit||''),'Pass the exact deployed Git commit');
 const base='https://hauntedpuppet.netlify.app',build=await (await fetch(base+'/build-info.json',{cache:'no-store'})).json();assert.equal(build.commit,commit,'Production has not published the expected Git build');
 const manifest=JSON.parse(execFileSync('git',['show',commit+':scripts/public-showdesk.json'],{encoding:'utf8'}));const hashes=[];
 for(const file of manifest.files){const response=await fetch(base+'/assets/wisp-showdesk/'+file.destination,{cache:'no-store'});assert(response.ok,file.destination);const bytes=Buffer.from(await response.arrayBuffer()),sha=crypto.createHash('sha256').update(bytes).digest('hex');assert.equal(sha,file.publishedSha256,file.destination);hashes.push({file:file.destination,sha256:sha});}
 const browser=await chromium.launch({args:['--mute-audio']});let timer;try{
  timer=setTimeout(()=>{console.error('Hosted showdesk test exceeded 90 seconds');process.exit(1);},90000);
  const context=await browser.newContext(),page=await context.newPage(),errors=[],providerRequests=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  await context.addInitScript(()=>{window.captureAttempts=0;navigator.mediaDevices.getUserMedia=async()=>{captureAttempts++;throw Error('Unexpected hosted test capture');};});
  await context.route('**/*',route=>{const u=new URL(route.request().url());if(/openai|runway|elevenlabs/.test(u.hostname)||/realtime|performance/.test(u.pathname)){providerRequests.push(u.hostname+u.pathname);return route.abort();}return route.continue();});
  await page.goto(base+'/assets/wisp-showdesk/index.html');await page.waitForFunction(()=>window.WispDesk);await page.locator('#pace').selectOption('500');
  const opened=context.waitForEvent('page');await page.getByRole('button',{name:'Open silent rehearsal output'}).click();const output=await opened;await output.waitForFunction(()=>window.WispFilmOutput);
  for(const [id,title]of [['cute','Friendly Wisp'],['scary','Menacing Wisp'],['cute','Friendly Wisp']]){await page.getByRole('button',{name:new RegExp(title)}).click();await page.waitForFunction(id=>WispDesk.inspect().director.phase==='playing'&&WispDesk.inspect().director.current===id,id);}
  await output.waitForFunction(()=>{const c=document.querySelector('canvas');return c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4!==3&&v);});
  assert.equal(await output.locator('audio,video').count(),0);assert(await page.evaluate(()=>WispDesk.inspect().media.every(v=>v.muted)));assert.equal(await page.evaluate(()=>captureAttempts),0);
  await page.getByRole('button',{name:/BLACKOUT \/ STOP/}).click();await output.waitForFunction(()=>{const c=document.querySelector('canvas');return !c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4!==3&&v);});
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  fs.mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/showdesk-hosted-mobile.png'});await page.goto('about:blank');await output.waitForFunction(()=>WispFilmOutput.inspect().stopped);assert.deepEqual(errors,[]);assert.deepEqual(providerRequests,[]);
  const report={passed:true,build,hashes,checks:['exact deployed Git commit and published hashes','real cute/scary/cute playback','visible silent mirrored output','Blackout clears output','owner navigation stops output','390px no horizontal overflow','no capture/provider requests'],scope:'Hosted isolated muted Chromium. Does not prove human visual, physical phone, sound or physical projection acceptance.'};fs.writeFileSync('test-results/showdesk-hosted.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{clearTimeout(timer);await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
