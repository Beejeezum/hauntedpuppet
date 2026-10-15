'use strict';
function savedToken(){try{return sessionStorage.getItem(tokenKey);}catch{return null;}}
function saveToken(value){try{if(value)sessionStorage.setItem(tokenKey,value);else sessionStorage.removeItem(tokenKey);}catch{/* Keep controls usable for this page when browser storage is blocked. */}}
const hostedWithoutRoom=location.protocol==='https:'&&location.pathname.startsWith('/phone_remote/')&&!new URLSearchParams(location.search).has('room');
const room=new URLSearchParams(location.search).get('room'),cloud=!!room,tokenKey=cloud?'wispRemoteToken:'+room:'wispRemoteToken';
let token=savedToken(), connected=false, pending=new Map(), lastSeen=0, polling=false, lastCues='', latestCommand='0',volumeDraftUntil=0,pairing=false;
const $=id=>document.getElementById(id), text=(id,value)=>$(id).textContent=value;
function paired(){ $('pairPanel').hidden=!!token; $('controls').hidden=!token; $('safety').hidden=!token; }
function connectivity(ok,message){connected=ok;document.body.dataset.connected=String(ok);if(!ok){$('preview').hidden=true;$('preview').removeAttribute('src');text('previewFreshness','Preview paused');text('showState','Wisp status unavailable');text('showAudience','');}text('connection',message);document.querySelectorAll('#controls button[data-command],#volume').forEach(b=>b.disabled=!ok);}
async function api(path,body){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),3500);
 try{
  const target=cloud?path.replace('/api/','/api/remote/')+(body?'':'?room='+encodeURIComponent(room)):path;
  const response=await fetch(target,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{'Authorization':'Bearer '+token}:{})},body:body?JSON.stringify(cloud?{...body,room}:body):undefined,signal:controller.signal});
  const data=await response.json();
  if(!response.ok){if(response.status===401){token=null;saveToken(null);pending.clear();paired();}throw Error(data.error||'Request failed');}
  return data;
 }catch(e){if(controller.signal.aborted)throw Error('The laptop did not reply. Check Wi-Fi, then try again.');throw e;}finally{clearTimeout(timer);}
}
$('pairForm').addEventListener('submit',async e=>{e.preventDefault();if(pairing)return;pairing=true;const button=e.submitter||e.target.querySelector('button');button.disabled=true;text('connection','Pairing with the laptop…');try{const d=await api('/api/pair',{code:$('code').value});token=d.token;saveToken(token);paired();poll();}catch(e){text('connection',e.message);}finally{pairing=false;button.disabled=false;}});
async function command(kind,value){const id=crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;try{const d=await api('/api/command',{id,command:kind,value});const seq=String(d.seq);pending.set(seq,{at:Date.now(),kind});if(BigInt(seq)>BigInt(latestCommand))latestCommand=seq;setTimeout(poll,cloud?800:250);if(BigInt(seq)>=BigInt(latestCommand))text('actionStatus',kind==='cue'?'Cue sent — waiting for the performance to finish.':'Sent — waiting for the laptop.');}catch(e){text('actionStatus',e.message);}}
document.addEventListener('click',e=>{const b=e.target.closest('button[data-command]');if(!b)return;let v=b.dataset.value;if(v===undefined)v=null;command(b.dataset.command,v);});
$('volume').addEventListener('input',e=>{volumeDraftUntil=Date.now()+2000;const value=Number(e.target.value);text('volumeLabel',value+'%');e.target.setAttribute('aria-valuetext',value+' percent');});
$('volume').addEventListener('change',e=>{volumeDraftUntil=Date.now()+2000;command('volume',Number(e.target.value)/100);});
$('unpair').addEventListener('click',()=>{token=null;saveToken(null);pending.clear();paired();text('connection','Phone forgotten. Pair again to control Wisp.');});
async function poll(){if(polling||!token)return;polling=true;try{const d=await api('/api/state');lastSeen=Date.now();connectivity(d.connected,d.connected?'Connected to the laptop':'Laptop disconnected — controls paused.');
 for(const ack of d.acks||[]){if(pending.has(String(ack.seq))&&ack.status!=='queued'){pending.delete(String(ack.seq));if(BigInt(ack.seq)>=BigInt(latestCommand))text('actionStatus',ack.status==='applied'?'Applied on the laptop.':ack.status==='expired'?'Command expired. Try again once connected.':ack.status==='cancelled'?'Cancelled by Stop or Blackout.':'The laptop could not apply that command.');}}
 for(const [seq,p] of pending){if(Date.now()-p.at>(p.kind==='cue'?35000:5000)){pending.delete(seq);if(BigInt(seq)>=BigInt(latestCommand))text('actionStatus','No confirmation from the laptop. Check the show before retrying.');}}
 const state=d.state||{};
 if(d.connected){const labels={idle:'Wisp is waiting',listening:'Wisp is listening',thinking:'Wisp is thinking',speaking:'Wisp is speaking',goodbye:'Wisp is saying goodbye',hidden:'Picture is blacked out'};text('showState',state.blackout?'Picture is blacked out':labels[state.status]||'Wisp is ready');text('showAudience',{little:'Little kids',family:'Family audience',big:'Older guests'}[state.audience]||'');}
document.querySelectorAll('button[data-command]').forEach(b=>{const kind=b.dataset.command;if(['audience','loop','gaze'].includes(kind))b.setAttribute('aria-pressed',String(state[kind]===b.dataset.value));});
 if(Date.now()>volumeDraftUntil&&document.activeElement!==$('volume')&&typeof state.volume==='number'){$('volume').value=Math.round(state.volume*100);text('volumeLabel',Math.round(state.volume*100)+'%');$('volume').setAttribute('aria-valuetext',Math.round(state.volume*100)+' percent');}
 $('blackout').dataset.value=state.blackout?'off':'on';$('blackout').textContent=state.blackout?'Restore picture':'Blackout';
 if(d.connected&&d.preview){$('preview').src=d.preview;$('preview').hidden=false;text('previewFreshness','Live laptop preview · updates about once a second');}else {$('preview').hidden=true;text('previewFreshness',d.connected?'Laptop preview unavailable':'Preview paused');}
 const cues=JSON.stringify(d.cues||[]);if(cues!==lastCues){lastCues=cues;$('cues').replaceChildren();for(const cue of d.cues||[]){const b=document.createElement('button');b.textContent=cue.replace(/[-_]/g,' ');b.dataset.command='cue';b.dataset.value=cue;b.disabled=!connected;$('cues').append(b);}if(!d.cues?.length)$('cues').textContent='No prepared cues enabled on the laptop.';}
}catch(e){connectivity(false,token?'Connection lost. Check Wi-Fi and the laptop.':'Pairing ended. Get a new code from the laptop.');}finally{polling=false;}}
if(hostedWithoutRoom){token=null;text('pairHelp','Scan the phone remote QR from the laptop desk to join its show.');$('pairForm').hidden=true;}
paired();connectivity(false,hostedWithoutRoom?'Join from the laptop’s phone remote QR.':token?'Connecting to the laptop…':'Pair with the laptop to begin.');setInterval(()=>{if(token)poll();if(token&&Date.now()-lastSeen>4500)connectivity(false,'Connection lost. Check Wi-Fi and the laptop.');},1000);poll();

window.addEventListener("offline",()=>connectivity(false,"Wi-Fi is offline. Reconnect to the laptop’s network."));
window.addEventListener("online",()=>poll());
document.addEventListener("visibilitychange",()=>{if(!document.hidden)poll();});
