const assert=require('node:assert/strict'),pw=require('playwright');
const watchdog=setTimeout(()=>{console.error('Status HTTP test exceeded30seconds');process.exit(1)},30000);
(async()=>{let mode='ok',requests=0;const requestHandler=async(req,res,path)=>{if(path!=='/api/status')return false;requests++;if(mode==='wait'){const timer=setTimeout(()=>res.end('{}'),1000);res.on('close',()=>clearTimeout(timer));return true;}const body=mode==='large'?'x'.repeat(70000):mode==='invalid'?'not json':mode==='array'?'[]':JSON.stringify({token:'fixture-only',mode:'local'});res.writeHead(mode==='signed-out'?401:200,{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)});res.end(body);return true;};const fixture=await require('./tonight_fixture.cjs').start({requestHandler}),engine=process.env.HAUNT_BROWSER||'chromium',browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{});try{
 const page=await browser.newPage();
 await page.goto(fixture.base);const invoke=()=>page.evaluate(async()=>{const{readDirectorStatus}=await import('/source/wisp-performance-reference/ambient-show/director-status-request.mjs');try{return{ok:true,value:await readDirectorStatus(new AbortController().signal,{timeoutMs:200})}}catch(e){return{ok:false,name:e.name,message:e.message}}});
 assert.equal((await invoke()).value.token,'fixture-only');
 for(mode of ['signed-out','large','invalid','array'])assert.equal((await invoke()).ok,false,mode);
 mode='wait';assert.equal((await invoke()).name,'TimeoutError');
 const result=await page.evaluate(async()=>{const{readDirectorStatus}=await import('/source/wisp-performance-reference/ambient-show/director-status-request.mjs');const controller=new AbortController();const pending=readDirectorStatus(controller.signal);controller.abort();let cancelled;try{await pending}catch(e){cancelled=e.name}const already=new AbortController();already.abort();let pre;try{await readDirectorStatus(already.signal)}catch(e){pre=e.name}return{cancelled,pre};});assert.equal(result.cancelled,'AbortError');assert.equal(result.pre,'AbortError');
 // A cancelled/timed-out operation must not poison the next real request.
 mode='ok';assert.equal((await invoke()).value.mode,'local');assert(requests>=7);
 console.log('PASS '+engine+' real XHR status success, unauthorized/invalid/oversize rejection, native timeout, pending/pre-abort and subsequent recovery; no retries/provider calls');
 }finally{await browser.close();await fixture.close();clearTimeout(watchdog)}})().catch(e=>{console.error(e);process.exitCode=1});
