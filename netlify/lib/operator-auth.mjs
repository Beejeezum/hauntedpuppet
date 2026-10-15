import {createHmac,randomUUID,scryptSync,timingSafeEqual} from 'node:crypto';
export class ApiError extends Error{constructor(status,message){super(message);this.status=status}}
export const runtimeEnv=name=>globalThis.Netlify?.env?.get(name);
const COOKIE='__Host-haunt-operator',TTL=30*86400;
const equal=(a,b)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)};
export function operatorAuth(env=runtimeEnv,now=()=>Date.now()){
 const secret=()=>env('HAUNT_SESSION_SECRET')||'',hash=()=>env('HAUNT_OPERATOR_PASSWORD_HASH')||'';
 const configured=()=>secret().length>=32&&(/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(hash())||((env('HAUNT_OPERATOR_PASSWORD')||'').length>=16&&(env('HAUNT_OPERATOR_PASSWORD')||'').length<=256));
 const mac=value=>createHmac('sha256',secret()).update(value).digest('base64url');
 function read(req){if(!configured())return null;const raw=(req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);if(!raw||raw.length>1024)return null;const [payload,sig,...extra]=raw.split('.');if(extra.length||!sig||!equal(mac(payload),sig))return null;try{const data=JSON.parse(Buffer.from(payload,'base64url'));if(data.v!==1||!/^[-a-f0-9]{36}$/.test(data.sid)||!Number.isFinite(data.exp)||data.exp<=now()/1000)return null;return data}catch{return null}}
 function sameOrigin(req){if(req.headers.get('origin')!==new URL(req.url).origin||req.headers.get('sec-fetch-site')==='cross-site')throw new ApiError(403,'Open the operator desk on this site before sending commands.')}
 const csrf=session=>mac('csrf:'+session.sid);
 function requireSession(req){const session=read(req);if(!session)throw new ApiError(401,'Sign in to the operator desk first.');sameOrigin(req);if(!equal(csrf(session),req.headers.get('X-Haunt-Token')||''))throw new ApiError(403,'Operator session changed. Refresh the desk and try again.');return session}
 function login(req,password){sameOrigin(req);if(!configured())throw new ApiError(503,'Cloud operator access has not been configured by the site owner.');if(typeof password!=='string'||password.length<12||password.length>256)throw new ApiError(401,'Incorrect operator password.');const encoded=hash().split(':');const matched=/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(hash())?equal(scryptSync(password,encoded[1],64).toString('hex'),encoded[2]):equal(mac('password:'+password),mac('password:'+env('HAUNT_OPERATOR_PASSWORD')));if(!matched)throw new ApiError(401,'Incorrect operator password.');const session={v:1,sid:randomUUID(),exp:Math.floor(now()/1000)+TTL};const payload=Buffer.from(JSON.stringify(session)).toString('base64url');return{session,cookie:`${COOKIE}=${payload}.${mac(payload)}; Path=/; Max-Age=${TTL}; HttpOnly; Secure; SameSite=Strict`}}
 return{configured,signingConfigured:()=>secret().length>=32,read,csrf,requireSession,sameOrigin,login,logoutCookie:()=>`${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`};
}
