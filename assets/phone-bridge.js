/** Laptop-only paired phone bridge. This module is never mounted in projector mode. */
export function mountPhoneControls(){
 const $=id=>document.getElementById(id),card=document.createElement('details');card.className='panel phone-controls';
 card.innerHTML=`<summary>Phone remote · direct Wisp from the room</summary><p class="help">Enable on trusted Wi-Fi, then scan the address and enter the pairing code on your phone. The laptop keeps the microphone and sound.</p><div class="row"><button id="phoneEnable" class="primary">Enable phone remote</button><button id="phoneDisable" disabled>Disable remote</button></div><p id="phoneStatus" role="status" aria-live="polite">Phone remote is off.</p><div id="phonePair" hidden><div id="phoneQr" style="width:176px;background:white;border-radius:8px;padding:8px"></div><p><a id="phoneUrl" target="_blank" rel="noopener"></a></p><p>Pairing code: <strong id="phoneCode" style="font:700 28px monospace;letter-spacing:.12em"></strong> <span id="phoneExpiry" class="help"></span></p><div class="row"><button id="phoneNewCode">New pairing code</button><button id="phoneRevoke">Revoke all phones</button></div><p class="help">Same Wi-Fi required. This HTTP remote is for a trusted local network; do not expose it through your router.</p></div>`;
 document.querySelector('main>aside').append(card);
 let enabled=false,polling=false,lastState=0,closed=false,token='',tokenAt=0,expires=0,statusAt=0,lastSeen=0,failures=0;
 const clientId=crypto.randomUUID(); // A duplicated tab must not inherit command ownership.
 const preview=document.createElement('canvas');preview.width=384;preview.height=216;const ctx=preview.getContext('2d');
 const notice=text=>{$('phoneStatus').textContent=text};
 async function post(action,data={}){
  if(!token||performance.now()-tokenAt>5000){const response=await fetch('/api/status'),status=await response.json();token=status.token;tokenAt=performance.now();}
  const r=await fetch('/api/phone/'+action,{method:'POST',headers:{'Content-Type':'application/json','X-Haunt-Token':token},body:JSON.stringify({...data,clientId})});const result=await r.json();if(!r.ok)throw Error(result.error||'Phone remote request failed.');return result;
 }
 function applyStatus(status){enabled=!!status.enabled&&!!status.owner;$('phoneEnable').disabled=enabled;$('phoneEnable').textContent=status.enabled&&!status.owner?'Take control on this desk':'Enable phone remote';$('phoneDisable').disabled=!status.enabled;$('phonePair').hidden=!enabled;if(!enabled){expires=0;$('phoneQr').replaceChildren();$('phoneCode').textContent='';}if(status.enabled&&!status.owner)notice('Phone remote belongs to another laptop desk. Close it before taking control here.');}
 async function pair(){const d=await post('pairing');applyStatus(d);$('phoneUrl').textContent=d.url;$('phoneUrl').href=d.url;$('phoneCode').textContent=d.code;expires=Date.now()+d.expiresIn*1000;const parsed=new DOMParser().parseFromString(d.qrSvg,'image/svg+xml'),svg=parsed.documentElement;if(svg.localName!=='svg'||svg.querySelector('script,foreignObject'))throw Error('Pairing QR could not be displayed. Use the address.');$('phoneQr').replaceChildren(document.importNode(svg,true));notice('Ready to pair. Scan the address, then enter the six-digit code.');}
 $('phoneEnable').onclick=async()=>{try{$('phoneEnable').disabled=true;applyStatus(await post('enable'));await pair()}catch(e){notice(e.message);$('phoneEnable').disabled=enabled}};
 $('phoneDisable').onclick=async()=>{try{applyStatus(await post('disable'));notice('Remote disabled. All phone permissions revoked.')}catch(e){notice(e.message)}};
 $('phoneNewCode').onclick=()=>pair().catch(e=>notice(e.message));
 $('phoneRevoke').onclick=async()=>{try{await post('revoke');notice('All phones revoked. Create a new code to pair again.');$('phoneCode').textContent='—';expires=0}catch(e){notice(e.message)}};
 async function execute(c){try{if(!window.HauntShow?.remoteCommand)throw Error('Phone show controls are not ready.');await window.HauntShow.remoteCommand(c.command,c.value);await post('ack',{seq:c.seq,status:'applied'});}catch(e){try{await post('ack',{seq:c.seq,status:'failed'})}catch{}notice('A phone command could not be applied: '+e.message)}}
 async function tick(){
  if(closed||polling||!enabled)return;polling=true;
  try{
   const d=await post('poll');lastSeen=performance.now();failures=0;
   // Dispatch without blocking the next poll on a spoken performance; panic can always arrive.
   for(const c of d.commands||[])execute(c);
   const now=performance.now();if(now-lastState>1000){lastState=now;const supplied=window.HauntShow?.remoteState?.()||{state:{status:'idle'},cues:[]};const canvas=$('preview');let image=null;if(canvas){ctx.fillStyle='#000';ctx.fillRect(0,0,384,216);ctx.drawImage(canvas,0,0,384,216);image=preview.toDataURL('image/jpeg',.55);}await post('state',{...supplied,preview:image});}
   if(now-statusAt>4000){statusAt=now;const st=await post('status');applyStatus(st);if(st.pairedPhones>0)notice(`${st.pairedPhones} phone${st.pairedPhones===1?'':'s'} paired · remote ready.`);}
  }catch(e){failures++;if(failures>=3)notice('Phone bridge disconnected. '+e.message);}finally{polling=false;}
 }
 const timer=setInterval(tick,200),expiryTimer=setInterval(()=>{if(expires){const seconds=Math.max(0,Math.ceil((expires-Date.now())/1000));$('phoneExpiry').textContent=seconds?`expires in ${seconds}s`:'expired · create a new code';}},1000);
 post('status').then(st=>{applyStatus(st);if(enabled)notice('Phone service enabled. Create a pairing code.');}).catch(e=>notice(e.message));
 window.addEventListener('pagehide',()=>{closed=true;clearInterval(timer);clearInterval(expiryTimer);},{once:true});
 window.HauntPhone={inspect:()=>({enabled,bridgeFresh:performance.now()-lastSeen<4000,failures}),pair,disable:async()=>{applyStatus(await post('disable'));}};
}
