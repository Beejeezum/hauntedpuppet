import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {NetlifyDB} from '@netlify/database-dev';
import {getDatabase} from '@netlify/database';
import {cloudRemote} from '../netlify/lib/cloud-remote.mjs';
import {operatorAuth} from '../netlify/lib/operator-auth.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
const engine=new NetlifyDB(),db=getDatabase({connectionString:await engine.start()});await engine.applyMigrations('./netlify/database/migrations');
const env=name=>({HAUNT_SESSION_SECRET:'film-phone-fixture-secret-not-real-at-least32chars',HAUNT_OPERATOR_PASSWORD:'film-phone-test-password-not-real'})[name];
const origin='https://haunt.example',auth=operatorAuth(env),login=auth.login(new Request(origin+'/api/operator/login',{method:'POST',headers:{Origin:origin}}),'film-phone-test-password-not-real'),service=cloudRemote({database:db,env});
const browser=await chromium.launch({args:['--mute-audio']}),errors=[],outside=[],requests=[];let desk,phone;
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.mp4':'video/mp4','.png':'image/png','.json':'application/json'};
try{
 const ownerContext=await browser.newContext({viewport:{width:1440,height:1000}}),phoneContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const [cookieName,...cookieValue]=login.cookie.split(';')[0].split('=');await ownerContext.addCookies([{name:cookieName,value:cookieValue.join('='),url:origin,httpOnly:true,secure:true}]);
 for(const context of [ownerContext,phoneContext]){
  await context.addInitScript(()=>{window.captureAttempts=0;navigator.mediaDevices.getUserMedia=async()=>{captureAttempts++;throw Error('Unexpected capture in silent film controls');};});
  await context.route('**/*',async route=>{
   const r=route.request(),u=new URL(r.url());if(u.origin!==origin){outside.push(r.url());return route.abort();}requests.push(u.pathname);
   if(u.pathname==='/api/status')return route.fulfill({json:{mode:'cloud',token:auth.csrf(login.session)}});
   if(u.pathname.startsWith('/api/')){const response=await service.handle(new Request(r.url(),{method:r.method(),headers:r.headers(),body:r.method()==='GET'?undefined:r.postData()}),{ip:'192.0.2.91'});return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});}
   const relative=u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname,root=path.resolve('dist'),file=path.resolve(root,'.'+relative);
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'Fixture asset missing'});
   return route.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
  });
 }
 desk=await ownerContext.newPage();desk.setDefaultTimeout(20000);desk.on('pageerror',e=>errors.push(e.message));await desk.goto(origin+'/assets/wisp-showdesk/index.html');await desk.waitForFunction(()=>window.WispDesk&&window.HauntPhone);
 await desk.locator('.phone-controls').evaluate(el=>el.open=true);await desk.click('#phoneEnable');await desk.waitForFunction(()=>/^\d{6}$/.test(document.getElementById('phoneCode').textContent));
 const url=await desk.locator('#phoneUrl').getAttribute('href'),code=await desk.locator('#phoneCode').textContent();phone=await phoneContext.newPage();phone.setDefaultTimeout(20000);phone.on('pageerror',e=>errors.push(e.message));await phone.goto(url);await phone.fill('#code',code);await phone.locator('#pairForm button').click();
 await phone.waitForFunction(()=>document.getElementById('cueHeading').textContent==='Animation cues & shows');console.log('FILM PHONE paired; workspace received');assert.equal(await phone.locator('[data-live-only]:visible').count(),0);assert.equal(await phone.locator('audio,video').count(),0);
 const cue=value=>phone.locator('#cues button').filter({hasText:new RegExp('^'+value+'$')});
 console.log('FILM PHONE friendly cue');await cue('Friendly Wisp').click();await desk.waitForFunction(()=>WispDesk.inspect().director.current==='cute'&&WispDesk.inspect().director.phase==='playing');
 const opened=desk.waitForEvent('popup');await desk.getByRole('button',{name:'Open silent rehearsal output'}).click();const output=await opened;await output.waitForFunction(()=>window.WispFilmOutput);assert.equal(await output.locator('audio,video').count(),0);
 console.log('FILM PHONE scary cue');await cue('Menacing Wisp').click();await desk.waitForFunction(()=>WispDesk.inspect().director.current==='scary'&&WispDesk.inspect().director.phase==='playing');
 console.log('FILM PHONE automatic program');await cue('Show Alternating').click();await desk.waitForFunction(()=>WispDesk.inspect().mode==='alternate'&&WispDesk.inspect().director.phase==='playing');
 console.log('FILM PHONE Welcome');await phone.click('#phoneWelcome');await desk.waitForFunction(()=>WispDesk.inspect().mode==='manual'&&WispDesk.inspect().director.current==='cute'&&WispDesk.inspect().director.phase==='playing');
 console.log('FILM PHONE Stop interrupts preparation');await cue('Menacing Wisp').click();await phone.locator('[data-command=stop]').click();await desk.waitForFunction(()=>WispDesk.inspect().composition.black);await desk.waitForTimeout(1800);assert.equal(await desk.evaluate(()=>WispDesk.inspect().composition.black),true,'Late preparation must not undo phone Stop');assert(!(await desk.locator('#phoneStatus').textContent()).includes('could not be applied'),'Intended Stop must not leave an obsolete cue error');await output.waitForFunction(()=>{const c=document.querySelector('canvas');return !c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4!==3&&v);});
 await cue('Friendly Wisp').click();await desk.waitForFunction(()=>WispDesk.inspect().director.phase==='playing');await phone.click('#blackout');await desk.waitForFunction(()=>WispDesk.inspect().composition.black);assert.equal(await phone.locator('#blackout').getAttribute('data-value'),'on');await cue('Restore Picture').click();await desk.waitForFunction(()=>WispDesk.inspect().director.phase==='playing');
 assert(await desk.evaluate(()=>WispDesk.remoteCommand('gesture','wave').then(()=>false,()=>true)),'Unsupported live control must fail honestly');assert(await desk.evaluate(()=>WispDesk.inspect().media.every(v=>v.muted)));assert.equal(await phone.evaluate(()=>captureAttempts),0);assert.equal(await desk.evaluate(()=>captureAttempts),0);assert(!requests.some(p=>/performance|realtime/.test(p)));assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
 await output.waitForFunction(()=>{const c=document.querySelector('canvas');return c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4!==3&&v);});
 fs.mkdirSync('test-results',{recursive:true});await phone.evaluate(()=>scrollTo(0,0));await phone.screenshot({path:'test-results/film-phone-cloud-mobile-viewport.png'});await phone.screenshot({path:'test-results/film-phone-cloud-mobile.png',fullPage:true});assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await desk.click('#phoneRevoke');await phone.waitForFunction(()=>!document.getElementById('pairPanel').hidden);await desk.click('#phoneDisable');
 fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/film-phone-cloud.json',JSON.stringify({passed:true,checks:['actual pairing/auth service','built owner desk and phone UI','film workspace hides incompatible live controls','film cues','automatic program','Welcome cancels program','Stop defeats late decode','Blackout/restore','revoke/disable','zero capture/provider requests','silent phone and owner videos','phone Stop blanks actual silent output'],scope:'Actual local Postgres-compatible service and real films in isolated Chromium; HTTPS transport routed in fixture. No deployed service or physical phone/projection acceptance.',errors,outside},null,2));console.log('PASS paired film desk and silent phone through actual local cloud service.');
}catch(error){fs.mkdirSync('test-results',{recursive:true});const state=desk?await desk.evaluate(()=>window.WispDesk?.inspect()).catch(()=>null):null;const phoneState=phone?await phone.evaluate(()=>({connection:document.getElementById('connection')?.textContent,action:document.getElementById('actionStatus')?.textContent,blackout:document.getElementById('blackout')?.dataset.value})).catch(()=>null):null;fs.writeFileSync('test-results/film-phone-cloud-failure.json',JSON.stringify({error:error.message,state,phoneState,requests},null,2));throw error;}finally{await browser.close();await db.pool.end();await engine.stop();}
