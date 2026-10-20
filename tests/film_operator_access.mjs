import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import https from 'node:https';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {cloudService} from '../netlify/lib/cloud-api.mjs';
const require=createRequire(import.meta.url),{chromium,webkit}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
const engine=process.env.HAUNT_BROWSER==='webkit'?webkit:chromium,password='fixture operator password not real';
let now=Date.now(),local=false,providerCalls=0,origin,browser,server;
const env=name=>({HAUNT_SESSION_SECRET:'fixture-only-operator-signing-secret-at-least32chars',HAUNT_OPERATOR_PASSWORD:password})[name];
const service=cloudService({env,now:()=>now,fetchImpl:async()=>{providerCalls++;throw Error('Unexpected provider call');}});
const errors=[],requests=[],apiResults=[],temporary=fs.mkdtempSync(path.join(os.tmpdir(),'haunt-operator-fixture-'));
try{
 const key=path.join(temporary,'key.pem'),cert=path.join(temporary,'cert.pem');
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-subj','/CN=localhost','-keyout',key,'-out',cert],{stdio:'ignore'});
 server=https.createServer({key:fs.readFileSync(key),cert:fs.readFileSync(cert)},async(req,res)=>{
  const url=new URL(req.url,origin);requests.push(url.pathname);
  if(url.pathname==='/operator-access.mjs'){res.setHeader('Content-Type','text/javascript');return res.end(fs.readFileSync('source/wisp-performance-reference/ambient-show/operator-access.mjs'));}
  if(url.pathname==='/'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><main><aside><details class="phone-controls"><summary>Phone remote</summary><button>Enable phone</button></details></aside></main><script type="module">import {mountOperatorAccess} from "/operator-access.mjs";window.events={stops:0,cleanups:0,signins:0};window.access=mountOperatorAccess(document.querySelector("aside"),{onSignedOut:()=>events.stops++,beforeSignOut:async()=>events.cleanups++,onSignedIn:async()=>events.signins++});</script>');}
  if(url.pathname==='/favicon.ico'){res.statusCode=204;return res.end();}
  if(url.pathname==='/api/status'&&local){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({mode:'direct',configured:false}));}
  try{
   assert(['/api/status','/api/operator/login','/api/operator/logout'].includes(url.pathname));
   const parts=[];for await(const chunk of req)parts.push(chunk);
   const response=await service.handle(new Request(url.href,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Buffer.concat(parts)}:{})}));
   apiResults.push({path:url.pathname,status:response.status,hasCookie:!!req.headers.cookie,hasOrigin:!!req.headers.origin});
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch(error){errors.push(error.message);res.statusCode=500;res.end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='https://127.0.0.1:'+server.address().port;
 browser=await engine.launch();const context=await browser.newContext({ignoreHTTPSErrors:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(()=>{window.captureAttempts=0;window.audioContexts=0;const Native=window.AudioContext;if(Native)window.AudioContext=class extends Native{constructor(...args){super(...args);audioContexts++;}};if(navigator.mediaDevices)navigator.mediaDevices.getUserMedia=async()=>{captureAttempts++;throw Error('Unexpected capture');};});
 await page.goto(origin+'/');await page.waitForFunction(()=>window.access?.inspect().visible);assert.equal(await page.locator('.phone-controls').evaluate(e=>e.inert),true);
 await page.click('#filmSignIn');await page.fill('#filmOperatorPassword','cancelled private fixture');await page.click('#filmOperatorClose');assert.equal(await page.locator('#filmOperatorPassword').inputValue(),'');
 await page.click('#filmSignIn');await page.fill('#filmOperatorPassword','wrong fixture password');await page.locator('dialog [type=submit]').click();await page.waitForFunction(()=>document.getElementById('filmOperatorError').textContent.includes('Incorrect')).catch(async error=>{console.error('Operator fixture state',await page.evaluate(()=>({error:document.getElementById('filmOperatorError').textContent,status:document.getElementById('filmOperatorStatus').textContent,access:access.inspect()})));throw error;});assert.equal(await page.locator('#filmOperatorPassword').inputValue(),'');assert.equal(await page.evaluate(()=>access.inspect().authenticated),false);
 async function signIn(){await page.fill('#filmOperatorPassword',password);await page.locator('dialog [type=submit]').click();await page.waitForFunction(()=>access.inspect().authenticated&&!access.inspect().busy).catch(async error=>{console.error('Sign-in fixture state',{state:await page.evaluate(()=>({error:document.getElementById('filmOperatorError').textContent,status:document.getElementById('filmOperatorStatus').textContent,access:access.inspect()})),apiResults,cookieFlags:(await context.cookies()).map(c=>({name:c.name,secure:c.secure,httpOnly:c.httpOnly}))});throw error;});assert.equal(await page.locator('#filmOperatorPassword').inputValue(),'');assert.equal(await page.locator('dialog').evaluate(e=>e.open),false);assert.equal(await page.locator('.phone-controls').evaluate(e=>e.inert),false);}
 await signIn();assert.equal(await page.evaluate(()=>events.signins),1);assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);assert.equal(await page.evaluate(()=>document.cookie.includes('__Host-haunt-operator')),false);
 const cookie=(await context.cookies()).find(c=>c.name==='__Host-haunt-operator');assert(cookie?.httpOnly&&cookie.secure);assert.equal(await page.evaluate(()=>document.activeElement.id),'filmSignOut');
 await page.click('#filmSignOut');await page.waitForFunction(()=>!access.inspect().authenticated&&!access.inspect().busy);assert.equal(await page.evaluate(()=>events.stops),1);assert.equal(await page.evaluate(()=>events.cleanups),1);assert.equal((await context.cookies()).some(c=>c.name==='__Host-haunt-operator'),false);
 await page.click('#filmSignIn');await signIn();now+=31*86400000;await page.evaluate(()=>access.refresh());assert.equal(await page.evaluate(()=>access.inspect().authenticated),false);assert.equal(await page.evaluate(()=>events.stops),2);assert.equal(await page.locator('.phone-controls').evaluate(e=>e.inert),true);
 local=true;await page.evaluate(()=>access.refresh());assert.equal(await page.locator('.operator-access').evaluate(e=>e.hidden),true);assert.equal(await page.locator('.phone-controls').evaluate(e=>e.inert),false);
 await page.evaluate(()=>access.dispose());assert.equal(await page.locator('dialog').count(),0);assert.equal(await page.evaluate(()=>access.inspect().disposed&&!access.inspect().visible),true);assert.equal(await page.evaluate(()=>captureAttempts+audioContexts),0);assert.deepEqual(errors,[]);assert.equal(providerCalls,0);
 fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/film-operator-access-'+(process.env.HAUNT_BROWSER||'chromium')+'.json',JSON.stringify({passed:true,engine:process.env.HAUNT_BROWSER||'chromium',requests,errors,providerCalls,scope:'Real local HTTPS UI against the existing operator auth service with a temporary self-signed certificate, fixture secrets and clock; secure HttpOnly cookie/CSRF, no provider key/capture. Local-mode status is an explicit fixture. Not hosted credentials or real phone pairing.'},null,2));console.log('PASS existing operator login/logout, wrong password, private-field clearing, secure cookie/CSRF, expiry stop, local mode and disposal without audio/provider access.');
}finally{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));fs.rmSync(temporary,{recursive:true,force:true});}
