// Exercise the actual movie for a full uninterrupted play, not just chapter seeks.
const assert=require('node:assert/strict'),fs=require('node:fs');
const pw=require(process.env.HAUNT_PLAYWRIGHT||'playwright'),name=process.env.HAUNT_BROWSER||'chromium';
(async()=>{fs.mkdirSync('test-results',{recursive:true});const fixture=await require('./tonight_fixture.cjs').start(),b=await pw[name].launch(name==='webkit'?{}:{args:['--mute-audio']});try{
 const page=await b.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/\.(mp4|m4a)(?:\?|$)/.test(r.url()))requests.push({url:r.url(),resource:r.resourceType(),mainFrame:r.frame()===page.mainFrame()})});
 await page.goto(fixture.base+fixture.prefix+'index.html');await page.waitForFunction(()=>window.TonightDemo);
 assert.equal(await page.locator('video').count(),1);assert.equal(await page.locator('audio').count(),0);
 const cue=await(await page.request.get(fixture.base+fixture.prefix+'show.json')).json();assert(cue.movie.embeddedAudio&&cue.movie.singleClock);
 await page.evaluate(()=>{const v=document.querySelector('#picture');window.movieTrace=[];for(const type of ['seeking','waiting','stalled','pause','emptied','error','volumechange'])v.addEventListener(type,()=>movieTrace.push({type,time:v.currentTime,muted:v.muted}));
 const context=new AudioContext(),source=context.createMediaElementSource(v),analyser=context.createAnalyser();analyser.fftSize=2048;source.connect(analyser);analyser.connect(context.destination);window.movieProbe={context,source,analyser};document.querySelector('#play').addEventListener('click',()=>context.resume(),{once:true});window.movieSamples=[];window.movieTimer=setInterval(()=>{const x=new Float32Array(2048);analyser.getFloatTimeDomainData(x);movieSamples.push({time:v.currentTime,paused:v.paused,muted:v.muted,ready:v.readyState,rms:Math.sqrt(x.reduce((a,v)=>a+v*v,0)/x.length)});},100);});
 await page.click('#play');await page.waitForFunction(()=>document.querySelector('#picture').currentTime>1);
 assert(await page.locator('#picture').isVisible());assert.equal(await page.locator('#picture').evaluate(v=>getComputedStyle(v).opacity),'1');
 await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Story complete'),null,{timeout:75000});
 const data=await page.evaluate(()=>{clearInterval(movieTimer);return{samples:movieSamples,trace:movieTrace,quality:document.querySelector('#picture').getVideoPlaybackQuality?.()}});
 const performanceEnd=cue.chapters.find(ch=>ch.title==='Empty stage')?.startSeconds??cue.durationSeconds-.1;
 const interior=data.samples.filter(s=>s.time>1&&s.time<performanceEnd-.1);assert(interior.length>(performanceEnd-1)*6,'Sample full native playback');
 assert(interior.every(s=>!s.paused&&!s.muted),'Movie must not mute or pause mid-performance');
 assert(!data.trace.some(e=>e.time>1&&e.time<performanceEnd-.1&&['seeking','pause','emptied','error'].includes(e.type)),'No resync seeks, decoder swaps or pauses inside movie');
 for(const title of ['Welcome','Scare and apology','Boo-bye']){const ch=cue.chapters.find(c=>c.title===title);assert(data.samples.some(s=>s.time>ch.startSeconds&&s.time<ch.endSeconds&&s.rms>.002),title+' decoded audio');}
 fs.writeFileSync('test-results/tonight-movie-requests-'+name+'.json',JSON.stringify(requests,null,2));const media=requests.filter(r=>r.mainFrame).map(r=>r.url);assert(!media.some(url=>url.includes('.m4a')),'No separate soundtrack request');assert.equal(new Set(media).size,1,'One movie source for entire show');
 assert.deepEqual(errors,[]);await page.evaluate(()=>{movieProbe.source.disconnect();movieProbe.analyser.disconnect();return movieProbe.context.close()});
 fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/tonight-single-movie-'+name+(process.env.HAUNT_TONIGHT_BASE?'-hosted':'')+'.json',JSON.stringify({passed:true,source:cue.movie.file,fullRuntime:cue.durationSeconds,mediaSources:[...new Set(media)],sampleCount:interior.length,trace:data.trace,voiceDecoded:true,scope:'Actual full native movie decode in silent isolated browser; no human loudspeaker or physical projection acceptance'},null,2));console.log('PASS single embedded-audio movie: full play, all three voices decoded, no mid-film pause/mute/seek or separate soundtrack');
 }finally{await b.close();await fixture.close()}})().catch(e=>{console.error(e);process.exitCode=1});
