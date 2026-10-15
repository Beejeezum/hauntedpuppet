import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {NetlifyDB} from '@netlify/database-dev';
import {getDatabase} from '@netlify/database';
import {randomUUID} from 'node:crypto';
import {cloudRemote} from '../netlify/lib/cloud-remote.mjs';
import {operatorAuth} from '../netlify/lib/operator-auth.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
const engine=new NetlifyDB(),db=getDatabase({connectionString:await engine.start()});await engine.applyMigrations('./netlify/database/migrations');
const env=name=>({HAUNT_SESSION_SECRET:'cloud-phone-browser-test-secret-long-enough',HAUNT_OPERATOR_PASSWORD:'test-operator-password-no-real-credential'})[name];
const origin='https://haunt.example',auth=operatorAuth(env),login=auth.login(new Request(origin+'/api/operator/login',{method:'POST',headers:{Origin:origin}}),'test-operator-password-no-real-credential');
const clientId=randomUUID(),room=login.session.sid,service=cloudRemote({database:db,env});
async function owner(action,data={}){const r=await service.handle(new Request(origin+'/api/phone/'+action,{method:'POST',headers:{Origin:origin,Cookie:login.cookie.split(';')[0],'X-Haunt-Token':auth.csrf(login.session)},body:JSON.stringify({...data,clientId})}));assert.equal(r.status,200);return r.json();}
const b=await chromium.launch(),c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),requests=[],errors=[];
try{
 await owner('enable');await owner('poll');await owner('state',{state:{status:'idle',audience:'family',volume:.5},cues:[],preview:'data:image/jpeg;base64,/9j/'});const code=(await owner('pairing')).code;
 await c.route(origin+'/**',async route=>{const r=route.request(),u=new URL(r.url());requests.push(u.pathname);
  if(u.pathname.startsWith('/api/')){const response=await service.handle(new Request(r.url(),{method:r.method(),headers:r.headers(),body:r.method()==='GET'?undefined:r.postData()}),{ip:'192.0.2.90'});return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});}
  const file=u.pathname.endsWith('/phone.js')?'phone.js':u.pathname.endsWith('/phone.css')?'phone.css':'index.html';return route.fulfill({contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html',body:fs.readFileSync(new URL('../phone_remote/'+file,import.meta.url))});
 });
 const unpaired=await c.newPage();unpaired.on('pageerror',e=>errors.push(e.message));await unpaired.goto(origin+'/phone_remote/');assert(await unpaired.locator('#pairForm').isHidden());assert((await unpaired.locator('#pairHelp').textContent()).includes('Scan the phone remote QR'));assert(!requests.some(p=>p.startsWith('/api/')));await unpaired.close();
 const phone=await c.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.goto(origin+'/phone_remote/?room='+room);await phone.fill('#code',code);await phone.locator('#pairForm button').click();await phone.waitForFunction(()=>document.getElementById('connection').textContent==='Connected to the laptop');
 await phone.click('[data-command="gesture"][data-value="wave"]');await phone.waitForFunction(()=>document.getElementById('actionStatus').textContent.startsWith('Sent'));const commands=(await owner('poll')).commands;assert.equal(commands.length,1);assert.equal(commands[0].command,'gesture');await owner('ack',{seq:commands[0].seq,status:'applied'});await phone.waitForFunction(()=>document.getElementById('actionStatus').textContent==='Applied on the laptop.');
 assert(requests.some(p=>p==='/api/remote/pair'));assert(requests.some(p=>p==='/api/remote/command'));assert(requests.some(p=>p==='/api/remote/state'));assert(!requests.includes('/api/pair'));assert(!requests.some(p=>p.includes('/realtime')||p.includes('/performance')));assert(!await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
 await owner('revoke');await phone.waitForFunction(()=>!document.getElementById('pairPanel').hidden);assert.deepEqual(errors,[]);console.log('PASS hosted phone browser with actual local Postgres-compatible service: room routing, no-room guidance, paired command acknowledgement, revoke, no provider routes. HTTPS browser transport simulated; no deployed service tested.');
}finally{await b.close();await db.pool.end();await engine.stop();}
