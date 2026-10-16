import assert from 'node:assert/strict';
import {NetlifyDB} from '@netlify/database-dev';
import {getDatabase} from '@netlify/database';
import {randomUUID,createHmac} from 'node:crypto';
import {cloudRemote} from '../netlify/lib/cloud-remote.mjs';
import {operatorAuth} from '../netlify/lib/operator-auth.mjs';
const engine=new NetlifyDB(),url=await engine.start();
const db=getDatabase({connectionString:url});
const env=name=>({HAUNT_SESSION_SECRET:'cloud-remote-test-secret-that-is-at-least-32-characters',HAUNT_OPERATOR_PASSWORD:'test-operator-password-not-a-real-secret'})[name];
let clock=Date.now();const now=()=>clock,origin='https://haunt.example',auth=operatorAuth(env,now);
await engine.applyMigrations('./netlify/database/migrations');
const login=auth.login(new Request(origin+'/api/operator/login',{method:'POST',headers:{Origin:origin}}),'test-operator-password-not-a-real-secret');
const cookie=login.cookie.split(';')[0],csrf=auth.csrf(login.session),clientId=randomUUID(),room=login.session.sid;
const remote=cloudRemote({database:db,env,now});
async function owner(action,data={},identity=clientId){const response=await remote.handle(new Request(origin+'/api/phone/'+action,{method:'POST',headers:{Origin:origin,Cookie:cookie,'X-Haunt-Token':csrf,'Content-Type':'application/json'},body:JSON.stringify({...data,clientId:identity})}));return {status:response.status,data:await response.json()};}
async function guest(action,data={},token,source='192.0.2.15'){const get=action==='state';const response=await remote.handle(new Request(origin+'/api/remote/'+action+(get?'?room='+room:''),{method:get?'GET':'POST',headers:{Origin:origin,...(token?{Authorization:'Bearer '+token}:{}),'Content-Type':'application/json'},body:get?undefined:JSON.stringify({room,...data})}),{ip:source});return {status:response.status,data:await response.json()};}
async function pair(source){const code=(await owner('pairing')).data.code;const r=await guest('pair',{code},undefined,source);assert.equal(r.status,200,JSON.stringify(r.data));return r.data.token;}
const checks=[];
try{
 assert.equal((await owner('enable')).status,200);assert.equal((await owner('enable',{},randomUUID())).status,409);checks.push('exclusive owner');
 await owner('poll');await owner('state',{state:{status:'idle',volume:.5,transcript:'secret',apiKey:'secret'},cues:['hello'],preview:'data:image/jpeg;base64,/9j/'});
 const code=(await owner('pairing')).data.code;
 const concurrent=await Promise.all([guest('pair',{code},undefined,'one'),guest('pair',{code},undefined,'two')]);assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,403]);const token=concurrent.find(r=>r.status===200).data.token;checks.push('atomic one-use pairing');
 const snap=await guest('state',{},token);assert.equal(snap.status,200);assert(snap.data.connected);assert.equal(snap.data.preview,'data:image/jpeg;base64,/9j/');assert(!('transcript' in snap.data.state));assert(!('apiKey' in snap.data.state));checks.push('whitelisted preview state');
 // NetlifyDB local uses one engine session; concurrent failing transactions can
 // roll back each other's work. Validate the API and SQL uniqueness separately.
 const id=randomUUID(),first=await guest('command',{id,command:'gesture',value:'wave'},token);assert.equal(first.status,202);assert.equal((await guest('command',{id,command:'gesture',value:'wave'},token)).status,409);const seq=first.data.seq;assert.equal(typeof seq,'string');
 await assert.rejects(db.pool.query('INSERT INTO haunt_remote_commands(room_id,generation,phone_id,command_id,command,value,status,created_at,expires_at) SELECT room_id,generation,phone_id,command_id,command,value,status,created_at,expires_at FROM haunt_remote_commands WHERE seq=$1',[seq]),e=>e.code==='23505');
 assert.equal((await db.pool.query('SELECT count(*)::int AS count FROM haunt_remote_commands WHERE command_id=$1',[id])).rows[0].count,1);checks.push('sequential UUID dedup + SQL unique constraint');
 const poll=await owner('poll');assert.equal(poll.data.commands.length,1);assert.equal(poll.data.commands[0].seq,seq);assert.equal((await owner('ack',{seq,status:'applied'})).status,200);assert((await guest('state',{},token)).data.acks.some(a=>a.seq===seq&&a.status==='applied'));checks.push('claim then applied acknowledgement');
 for(const [command,value] of [['volume',2],['cue','missing'],['gesture',['wave']],['provider','key']])assert.equal((await guest('command',{id:randomUUID(),command,value},token)).status,400);checks.push('typed allowlist');
 clock+=1100;await owner('poll');await owner('state',{state:{audience:'big',form:'haunting',scaryReady:true,revealArmed:true},cues:['hello']});
 for(const [command,value]of [['move','phantom'],['move','dance'],['move','twirl'],['form','haunting'],['reveal','arm'],['reveal','fire']])assert.equal((await guest('command',{id:randomUUID(),command,value},token)).status,202);
 assert.equal((await guest('command',{id:randomUUID(),command:'welcome',value:null},token)).status,202);const gentle=await owner('poll');assert.equal(gentle.data.commands.length,1);assert.equal(gentle.data.commands[0].command,'welcome');assert.equal((await guest('state',{},token)).data.state.scaryReady,true);assert.equal((await guest('command',{id:randomUUID(),command:'move',value:'unknown-script'},token)).status,400);checks.push('bold moves and form allowlist; welcome cancels queued scares');
 clock+=1100;await owner('poll');await owner('state',{state:{status:'idle'},cues:['hello']});
 const flood=[];for(let i=0;i<18;i++)flood.push(await guest('command',{id:randomUUID(),command:'gesture',value:'wave'},token));assert.equal(flood.filter(r=>r.status===202).length,12);assert.equal(flood.filter(r=>r.status===429).length,6);
 assert.equal((await guest('command',{id:randomUUID(),command:'stop',value:null},token)).status,202);assert.equal((await owner('poll')).data.commands.length,1);assert((await guest('state',{},token)).data.acks.some(a=>a.status==='cancelled'));checks.push('sequential rate limit + panic priority (local engine is not a load tester)');
 clock+=1100;await owner('poll');await owner('state',{state:{status:'idle'},cues:[]});await guest('command',{id:randomUUID(),command:'gesture',value:'wave'},token);clock+=3100;assert.equal((await owner('poll')).data.commands.length,0);checks.push('stale queued commands expire');
 clock+=6000;assert.equal((await guest('state',{},token)).data.connected,false);assert.equal((await guest('command',{id:randomUUID(),command:'gesture',value:'wave'},token)).status,503);assert.equal((await owner('poll')).status,200);await owner('state',{state:{status:'idle'}});assert((await guest('state',{},token)).data.connected);checks.push('owner lease loss and same desk recovery');
 clock+=6000;const other=randomUUID();assert.equal((await owner('enable',{},other)).status,200);assert.equal((await owner('poll')).status,409);await owner('enable',{},clientId).then(r=>assert.equal(r.status,409));clock+=6000;assert.equal((await owner('enable')).status,200);await owner('poll');await owner('state',{state:{status:'idle'}});checks.push('lease takeover excludes old desk');
 for(let i=0;i<5;i++)assert.equal((await guest('pair',{code:'999999'},undefined,'brute')).status,403);assert.equal((await guest('pair',{code:'999999'},undefined,'brute')).status,429);checks.push('persistent pairing throttles');
 const bad=new Request(origin+'/api/phone/poll',{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({clientId})});assert.equal((await remote.handle(bad)).status,401);assert.equal(auth.read(new Request(origin+'/api/status',{headers:{Cookie:'__Host-haunt-operator='+token}})),null);checks.push('phone bearer and cookie cannot authorize operator/provider routes');
 const raw=token.split('.')[0],forged=raw+'.'+createHmac('sha256',env('HAUNT_SESSION_SECRET')).update(raw).digest('base64url');assert.equal((await guest('state',{},forged)).status,401);checks.push('HMAC domain separation');
 assert.equal((await owner('state',{preview:'data:image/svg+xml;base64,PHN2Zz4='})).status,400);assert.equal((await owner('state',{preview:'data:image/jpeg;base64,'+Buffer.alloc(100001).toString('base64')})).status,400);checks.push('preview format and size bounds');
 await owner('revoke');assert.equal((await guest('state',{},token)).status,401);checks.push('generation revocation');
 const phones=[];for(let i=0;i<8;i++)phones.push(await pair('phone-'+i));const ninthCode=(await owner('pairing')).data.code;assert.equal((await guest('pair',{code:ninthCode},undefined,'ninth')).status,409);await owner('poll');await owner('state',{state:{status:'idle'}});for(const phone of phones)for(let i=0;i<8;i++)assert.equal((await guest('command',{id:randomUUID(),command:'gesture',value:'wave'},phone)).status,202);assert.equal((await guest('command',{id:randomUUID(),command:'gesture',value:'wave'},phones[0])).status,503);assert.equal((await guest('command',{id:randomUUID(),command:'blackout',value:'on'},phones[0])).status,202);assert.equal((await owner('poll')).data.commands.length,1);checks.push('64-command queue cap and panic bypass');clock+=28800001;assert.equal((await owner('enable')).status,200);await pair('after-expiry');checks.push('eight phone cap with expired cleanup');
 await owner('disable');assert.equal((await owner('status')).data.enabled,false);checks.push('explicit disable');
 const unavailable=cloudRemote({env,database:{pool:{connect:async()=>{throw Error('private-database-url')}}}});const badDb=await unavailable.handle(new Request(origin+'/api/phone/status',{method:'POST',headers:{Origin:origin,Cookie:cookie,'X-Haunt-Token':csrf},body:JSON.stringify({clientId})}));assert.equal(badDb.status,503);assert(!(await badDb.text()).includes('private-database-url'));checks.push('database failure closes safely without credentials');
 console.log(JSON.stringify({passed:true,checks},null,2));
}finally{await db.pool.end();await engine.stop();}
