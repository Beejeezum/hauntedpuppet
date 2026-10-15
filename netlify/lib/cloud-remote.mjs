import {getDatabase} from '@netlify/database';
import QRCode from 'qrcode';
import {createHmac,randomInt,randomUUID,timingSafeEqual} from 'node:crypto';
import {operatorAuth,runtimeEnv,ApiError} from './operator-auth.mjs';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const values={gesture:['wave','laugh','shy','surprise'],gaze:['left','right','center'],audience:['little','family','big'],loop:['on','off'],blackout:['on','off'],stop:[null]};
const equal=(a,b)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)};
const at=t=>new Date(t),ms=value=>value?new Date(value).getTime():0;
const safeSeq=value=>String(value); // BIGSERIAL must never lose precision in JSON.
export function cloudRemote({database,env=runtimeEnv,now=()=>Date.now()}={}){
 let runtimeDb;
 const auth=operatorAuth(env,now),db=()=>database||(runtimeDb ||= getDatabase()),secret=()=>env('HAUNT_SESSION_SECRET')||'';
 const mac=(prefix,value)=>createHmac('sha256',secret()).update(prefix+value).digest('base64url');
 const codeHash=(room,code)=>mac('phone-code:',room+':'+code);
 function phoneToken(payload){const raw=Buffer.from(JSON.stringify(payload)).toString('base64url');return raw+'.'+mac('phone:',raw)}
 function readPhone(req){
  if(secret().length<32)throw new ApiError(503,'Cloud phone pairing has not been configured.');
  const raw=(req.headers.get('authorization')||'').replace(/^Bearer /,'');
  if(raw.length>1024)throw new ApiError(401,'Pair this phone again.');
  const [payload,sig,...rest]=raw.split('.');
  if(!payload||!sig||rest.length||!equal(mac('phone:',payload),sig))throw new ApiError(401,'Pair this phone again.');
  let data;try{data=JSON.parse(Buffer.from(payload,'base64url'));}catch{throw new ApiError(401,'Pair this phone again.');}
  if(data.v!==1||!UUID.test(data.room)||!UUID.test(data.sid)||!Number.isInteger(data.g)||!Number.isFinite(data.exp)||data.exp<=now())throw new ApiError(401,'Pair this phone again.');
  return data;
 }
 async function transaction(fn){
  const client=await db().pool.connect();
  try{await client.query('BEGIN');await client.query("SET LOCAL statement_timeout = '4000ms'");const result=await fn(client);await client.query('COMMIT');return result;}
  catch(e){await client.query('ROLLBACK').catch(()=>{});if(e.code==='23505')throw new ApiError(409,'Duplicate command ID.');throw e;}finally{client.release();}
 }
 async function room(client,id,create=false){
  if(create)await client.query('INSERT INTO haunt_remote_rooms(id) VALUES($1) ON CONFLICT(id) DO NOTHING',[id]);
  const {rows}=await client.query('SELECT * FROM haunt_remote_rooms WHERE id=$1 FOR UPDATE',[id]);return rows[0];
 }
 function owned(r,clientId,t){if(!r?.enabled)throw new ApiError(409,'Enable the phone remote on this desk first.');if(r.owner_client!==clientId)throw new ApiError(409,'This desk does not own the phone remote. Enable it here after the other desk closes.');}
 async function refreshLease(c,r,t){await c.query('UPDATE haunt_remote_rooms SET owner_until=$2,updated_at=$3 WHERE id=$1',[r.id,at(t+5000),at(t)]);}
 async function expire(c,r,t){
  await c.query("UPDATE haunt_remote_commands SET status='expired' WHERE room_id=$1 AND generation=$2 AND ((status='queued' AND expires_at<$3) OR (status='claimed' AND created_at<$4))",[r.id,r.generation,at(t),at(t-120000)]);
  await c.query('DELETE FROM haunt_remote_phones WHERE room_id=$1 AND expires_at<$2',[r.id,at(t)]);
  await c.query('DELETE FROM haunt_remote_attempts WHERE room_id=$1 AND window_start<$2',[r.id,at(t-120000)]);
 }
 async function status(c,r,clientId,t){
  const {rows}=await c.query('SELECT count(*)::int AS count FROM haunt_remote_phones WHERE room_id=$1 AND generation=$2 AND expires_at>$3',[r.id,r.generation,at(t)]);
  return {enabled:r.enabled,owner:r.enabled&&r.owner_client===clientId,ownerActive:r.enabled&&ms(r.owner_until)>t,pairedPhones:rows[0].count,room:r.id,cloud:true};
 }
 async function operator(action,data,session,origin){
  const clientId=data.clientId;if(typeof clientId!=='string'||!UUID.test(clientId))throw new ApiError(400,'Phone desk identity is required. Refresh this desk.');
  const t=now(),id=session.sid;
  const result=await transaction(async c=>{
   const r=await room(c,id,true);await expire(c,r,t);
   if(action==='status')return status(c,r,clientId,t);
   if(action==='enable'){
    if(r.enabled&&r.owner_client!==clientId&&ms(r.owner_until)>t)throw new ApiError(409,'Another laptop desk owns the phone remote. Close it or wait until it disconnects.');
    if(r.enabled&&r.owner_client!==clientId){await c.query("UPDATE haunt_remote_commands SET status='cancelled' WHERE room_id=$1 AND status IN ('queued','claimed')",[id]);}
    await c.query('UPDATE haunt_remote_rooms SET enabled=true,owner_client=$2,owner_until=$3,heartbeat_at=NULL,state_at=NULL,preview=NULL,updated_at=$4 WHERE id=$1',[id,clientId,at(t+5000),at(t)]);
    return status(c,{...r,enabled:true,owner_client:clientId,owner_until:at(t+5000)},clientId,t);
   }
   owned(r,clientId,t);await refreshLease(c,r,t);
   if(action==='disable'||action==='revoke'){
    await c.query("UPDATE haunt_remote_commands SET status='cancelled' WHERE room_id=$1 AND status IN ('queued','claimed')",[id]);
    await c.query('DELETE FROM haunt_remote_phones WHERE room_id=$1',[id]);
    await c.query('UPDATE haunt_remote_rooms SET generation=generation+1,pairing_hash=NULL,pairing_until=NULL,enabled=$2,preview=NULL,state_at=NULL,heartbeat_at=NULL WHERE id=$1',[id,action==='revoke']);
    return action==='disable'?{enabled:false,owner:false,pairedPhones:0,room:id,cloud:true}:{ok:true};
   }
   if(action==='pairing'){
    const code=String(randomInt(1000000)).padStart(6,'0');
    await c.query('UPDATE haunt_remote_rooms SET pairing_hash=$2,pairing_until=$3 WHERE id=$1',[id,codeHash(id,code),at(t+90000)]);
    return {...await status(c,r,clientId,t),code,expiresIn:90,url:origin+'/phone_remote/?room='+id};
   }
   if(action==='poll'){
    await c.query('UPDATE haunt_remote_rooms SET heartbeat_at=$2 WHERE id=$1',[id,at(t)]);
    const {rows}=await c.query("UPDATE haunt_remote_commands SET status='claimed' WHERE status='queued' AND seq IN (SELECT seq FROM haunt_remote_commands WHERE room_id=$1 AND generation=$2 AND status='queued' ORDER BY CASE WHEN command='stop' OR (command='blackout' AND value='\"on\"'::jsonb) THEN 0 ELSE 1 END,seq LIMIT 64) RETURNING seq,command_id,command,value",[id,r.generation]);
    rows.sort((a,b)=>BigInt(a.seq)<BigInt(b.seq)?-1:1);return {commands:rows.map(row=>({seq:safeSeq(row.seq),id:row.command_id,command:row.command,value:row.value}))};
   }
   if(action==='state'){
    const state={};for(const k of ['mood','audience','loop','blackout','volume','status','gesture','gaze']){const v=data.state?.[k];if(typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v)||typeof v==='string'&&v.length<=120)state[k]=v;}
    const cues=data.cues||[];if(!Array.isArray(cues)||cues.length>40||cues.some(x=>typeof x!=='string'||x.length>64))throw new ApiError(400,'Invalid prepared cues.');
    const preview=data.preview??null;
    if(preview!==null){if(typeof preview!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]*={0,2}$/.test(preview))throw new ApiError(400,'Invalid preview.');const raw=Buffer.from(preview.split(',')[1],'base64');if(raw.length>100000||raw.length<3||raw[0]!==255||raw[1]!==216||raw[2]!==255)throw new ApiError(400,'Invalid JPEG preview.');}
    await c.query('UPDATE haunt_remote_rooms SET state=$2::jsonb,cues=$3::jsonb,preview=$4,state_at=$5,heartbeat_at=$5 WHERE id=$1',[id,JSON.stringify(state),JSON.stringify(cues),preview,at(t)]);return {ok:true};
   }
   if(action==='ack'){
    if(!/^\d{1,19}$/.test(String(data.seq))||!['applied','failed'].includes(data.status))throw new ApiError(400,'Invalid acknowledgement.');
    const {rowCount}=await c.query("UPDATE haunt_remote_commands SET status=$4 WHERE seq=$1 AND room_id=$2 AND generation=$3 AND status='claimed'",[String(data.seq),id,r.generation,data.status]);
    if(!rowCount)throw new ApiError(409,'The command expired, was cancelled, or belongs to another room.');return {ok:true};
   }
   throw new ApiError(404,'Unknown phone remote action.');
  });
  if(action==='pairing')result.qrSvg=await QRCode.toString(result.url,{type:'svg',margin:4,errorCorrectionLevel:'M'});
  return result;
 }
 async function pair(data,source){
  if(secret().length<32)throw new ApiError(503,'Cloud phone pairing has not been configured.');
  const id=data.room;if(!UUID.test(id||'')||typeof data.code!=='string'||!/^\d{6}$/.test(data.code))throw new ApiError(400,'Enter the six-digit pairing code.');
  const t=now();const result=await transaction(async c=>{
   const r=await room(c,id);if(!r?.enabled)return {error:new ApiError(403,'This room is not accepting phones.')};await expire(c,r,t);
   const sourceHash=mac('phone-source:',String(source||'unknown').slice(0,200));
   const {rows}=await c.query('SELECT * FROM haunt_remote_attempts WHERE room_id=$1 AND source_hash=$2',[id,sourceHash]);
   const prior=rows[0],sameWindow=prior&&ms(prior.window_start)>t-60000,start=sameWindow?ms(prior.window_start):t,count=sameWindow?prior.attempts:0;
   if(count>=5)return {error:new ApiError(429,'Too many pairing attempts. Wait one minute.')};
   await c.query('INSERT INTO haunt_remote_attempts(room_id,source_hash,window_start,attempts) VALUES($1,$2,$3,$4) ON CONFLICT(room_id,source_hash) DO UPDATE SET window_start=$3,attempts=$4',[id,sourceHash,at(start),count+1]);
   if(!r.pairing_hash||ms(r.pairing_until)<=t||!equal(codeHash(id,data.code),r.pairing_hash))return {error:new ApiError(403,'Pairing code is incorrect or expired. Get a new code from the laptop.')};
   const phones=await c.query('SELECT count(*)::int AS count FROM haunt_remote_phones WHERE room_id=$1 AND generation=$2',[id,r.generation]);if(phones.rows[0].count>=8)return {error:new ApiError(409,'Phone limit reached. Revoke an old phone on the laptop.')};
   const claim=await c.query('UPDATE haunt_remote_rooms SET pairing_hash=NULL,pairing_until=NULL WHERE id=$1 AND generation=$2 AND pairing_hash=$3 AND pairing_until>$4 AND enabled=true RETURNING id',[id,r.generation,codeHash(id,data.code),at(t)]);
   if(!claim.rowCount)return {error:new ApiError(403,'Pairing code was already used. Get a new code from the laptop.')};
   const sid=randomUUID(),exp=t+28800000;
   await c.query('INSERT INTO haunt_remote_phones(id,room_id,generation,expires_at,seen_at) VALUES($1,$2,$3,$4,$5)',[sid,id,r.generation,at(exp),at(t)]);
   return {token:phoneToken({v:1,room:id,sid,g:r.generation,exp}),expiresIn:28800};
  });if(result.error)throw result.error;return result;
 }
 async function guest(action,data,req){
  const p=readPhone(req),t=now();
  if(data.room&&data.room!==p.room)throw new ApiError(403,'This phone belongs to a different room.');
  return transaction(async c=>{
   const r=await room(c,p.room);if(!r?.enabled||r.generation!==p.g)throw new ApiError(401,'Pairing ended. Get a new code from the laptop.');await expire(c,r,t);
   const {rows}=await c.query('SELECT * FROM haunt_remote_phones WHERE id=$1 AND room_id=$2 AND generation=$3 FOR UPDATE',[p.sid,p.room,p.g]);const phone=rows[0];if(!phone||ms(phone.expires_at)<=t)throw new ApiError(401,'Pair this phone again.');
   await c.query('UPDATE haunt_remote_phones SET seen_at=$2 WHERE id=$1',[p.sid,at(t)]);
   const connected=ms(r.owner_until)>t&&ms(r.heartbeat_at)>t-4500&&ms(r.state_at)>t-4500;
   if(action==='state'){
    const acks=await c.query('SELECT seq,status FROM haunt_remote_commands WHERE phone_id=$1 AND created_at>$2 ORDER BY seq DESC LIMIT 256',[p.sid,at(t-120000)]);
    return {connected,state:connected?r.state:{},cues:connected?r.cues:[],preview:connected?r.preview:null,stateAge:Math.max(0,(t-ms(r.state_at))/1000),acks:acks.rows.map(row=>({seq:safeSeq(row.seq),status:row.status==='claimed'?'queued':row.status}))};
   }
   if(action!=='command')throw new ApiError(404,'Unknown phone command.');
   const {id,command,value=null}=data;if(!UUID.test(id||''))throw new ApiError(400,'Invalid command ID.');
   const duplicate=await c.query('SELECT seq FROM haunt_remote_commands WHERE room_id=$1 AND generation=$2 AND phone_id=$3 AND command_id=$4',[p.room,p.g,p.sid,id]);if(duplicate.rows.length)throw new ApiError(409,'Duplicate command ID.');
   const valid=values[command]?.includes(value)||(command==='volume'&&typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=1)||(command==='cue'&&typeof value==='string'&&r.cues.includes(value));if(!valid)throw new ApiError(400,'Unsupported command or value.');
   const emergency=command==='stop'||command==='blackout'&&value==='on';if(!connected&&!emergency)throw new ApiError(503,'Laptop bridge is disconnected.');
   const sameWindow=ms(phone.rate_start)>t-1000,count=sameWindow?phone.rate_count:0;
   if(count>=12&&!emergency)throw new ApiError(429,'Controls are arriving too quickly.');
   if(emergency)await c.query("UPDATE haunt_remote_commands SET status='cancelled' WHERE room_id=$1 AND generation=$2 AND status IN ('queued','claimed')",[p.room,p.g]);
   const queued=await c.query("SELECT count(*)::int AS count FROM haunt_remote_commands WHERE room_id=$1 AND generation=$2 AND status IN ('queued','claimed')",[p.room,p.g]);if(queued.rows[0].count>=64)throw new ApiError(503,'Command queue is full.');
   const rate=await c.query('UPDATE haunt_remote_phones SET rate_start=CASE WHEN rate_start>$2 THEN rate_start ELSE $3 END,rate_count=CASE WHEN rate_start>$2 THEN rate_count+1 ELSE 1 END WHERE id=$1 AND (rate_start IS NULL OR rate_start<=$2 OR rate_count<12 OR $4) RETURNING id',[p.sid,at(t-1000),at(t),emergency]);
   if(!rate.rowCount)throw new ApiError(429,'Controls are arriving too quickly.');
   const added=await c.query("INSERT INTO haunt_remote_commands(room_id,generation,phone_id,command_id,command,value,status,created_at,expires_at) VALUES($1,$2,$3,$4,$5,$6::jsonb,'queued',$7,$8) RETURNING seq",[p.room,p.g,p.sid,id,command,JSON.stringify(value),at(t),at(t+3000)]);
   return {seq:safeSeq(added.rows[0].seq),status:'queued'};
  });
 }
 async function handle(req,context={}){
  const headers={'Cache-Control':'no-store','Content-Type':'application/json','X-Content-Type-Options':'nosniff'};
  try{
   const url=new URL(req.url),owner=url.pathname.startsWith('/api/phone/'),action=url.pathname.split('/').pop();
   if(!owner&&!url.pathname.startsWith('/api/remote/'))throw new ApiError(404,'Not found.');
   if(owner&&req.method!=='POST'||!owner&&(action==='state'?req.method!=='GET':req.method!=='POST'))throw new ApiError(405,'Method not allowed.');
   const origin=req.headers.get('origin');if(origin&&origin!==url.origin||req.headers.get('sec-fetch-site')==='cross-site')throw new ApiError(403,'Open the phone controls on this site.');
   if(req.method==='POST'&&origin!==url.origin)throw new ApiError(403,'Open the phone controls on this site.');
   let data={};if(req.method==='POST'){const raw=await req.text(),limit=owner&&action==='state'?150000:4096;if(Buffer.byteLength(raw)>limit)throw new ApiError(413,'Request is too large.');try{data=JSON.parse(raw);}catch{throw new ApiError(400,'Invalid JSON request.');}if(!data||typeof data!=='object'||Array.isArray(data))throw new ApiError(400,'Invalid request.');}
   else data.room=url.searchParams.get('room');
   const result=owner?await operator(action,data,auth.requireSession(req),url.origin):action==='pair'&&req.method==='POST'?await pair(data,context.ip):await guest(action,data,req);
   return new Response(JSON.stringify(result),{status:!owner&&action==='command'?202:200,headers});
  }catch(e){return new Response(JSON.stringify({error:e instanceof ApiError?e.message:'Cloud phone control is unavailable. Check the database setup and migrations.'}),{status:e instanceof ApiError?e.status:503,headers});}
 }
 return {handle};
}
