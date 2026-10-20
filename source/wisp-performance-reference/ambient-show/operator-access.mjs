/** Existing operator-cookie access for films. No provider keys, audio or capture APIs. */
export function mountOperatorAccess(host,{onSignedOut=()=>{},beforeSignOut=async()=>{},onSignedIn=async()=>{}}={}){
 const card=document.createElement('section');card.className='operator-access';card.hidden=true;
 card.innerHTML='<h2>Operator access</h2><p role="status" id="filmOperatorStatus">Checking operator access…</p><div class="row"><button type="button" id="filmSignIn">Sign in as operator</button><button type="button" id="filmSignOut" hidden>Sign out & stop show</button></div>';
 host.prepend(card);
 const dialog=document.createElement('dialog');dialog.className='film-operator-dialog';dialog.setAttribute('aria-labelledby','filmOperatorHeading');
 dialog.innerHTML='<form><h2 id="filmOperatorHeading">Operator sign-in</h2><label for="filmOperatorPassword">Site operator password</label><input id="filmOperatorPassword" type="password" autocomplete="current-password" required><p role="alert" id="filmOperatorError"></p><div class="row"><button type="submit">Sign in</button><button type="button" id="filmOperatorClose">Close</button></div></form>';
 document.body.append(dialog);
 const $=id=>document.getElementById(id),password=$('filmOperatorPassword'),form=dialog.querySelector('form'),submit=form.querySelector('[type=submit]');
 let status=null,busy=false,disposed=false,refreshing=null,cloud=!['127.0.0.1','localhost'].includes(location.hostname),error='';
 const pending=new Set();
 function apply(){
  if(disposed)return;
  card.hidden=!cloud;
  const authenticated=!!status?.authenticated,setup=status?.operatorSetupRequired||status?.sessionSigningConfigured===false;
  $('filmSignIn').hidden=authenticated;$('filmSignOut').hidden=!authenticated;
  $('filmSignIn').disabled=busy||!status||!!setup;$('filmSignOut').disabled=busy;submit.disabled=busy;password.disabled=busy;
  $('filmOperatorStatus').textContent=error||(setup?'Operator access needs to be configured for this site.':authenticated?'Operator signed in.':'Sign in to pair a phone. Films and local sound effects work without signing in.');
  const phone=document.querySelector('.phone-controls');if(phone)phone.inert=cloud&&(!authenticated||busy);
 }
 async function request(path,{method='GET',data,token}={}){
  if(disposed)throw new DOMException('Workspace closed','AbortError');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),method==='GET'?5000:15000);pending.add(controller);
  try{
   const response=await fetch(path,{method,credentials:'same-origin',headers:{Accept:'application/json',...(data?{'Content-Type':'application/json'}:{}),...(token?{'X-Haunt-Token':token}:{})},...(data?{body:JSON.stringify(data)}:{}),signal:controller.signal});
   let result;try{result=await response.json();}catch{throw Error(response.status===429?'Too many sign-in attempts. Wait a little before trying again.':'Operator access is temporarily unavailable.');}
   if(!response.ok)throw Error(result.error||'Operator request failed.');return result;
  }finally{clearTimeout(timer);pending.delete(controller);}
 }
 function refresh(){
  if(disposed)return Promise.resolve();
  if(refreshing)return refreshing;
  refreshing=(async()=>{
   try{
    const next=await request('/api/status');if(disposed)return;
    const lost=!!status?.authenticated&&!next.authenticated;status=next;cloud=next.mode==='cloud';error='';
    if(lost&&!busy)onSignedOut();apply();
   }catch(e){if(!disposed){error='Operator connection unavailable. Local films still work.';apply();}}
  })().finally(()=>{refreshing=null;});return refreshing;
 }
 $('filmSignIn').onclick=()=>{if(busy||disposed)return;$('filmOperatorError').textContent='';password.value='';dialog.showModal();password.focus();};
 $('filmOperatorClose').onclick=()=>{password.value='';dialog.close();};dialog.addEventListener('cancel',()=>{password.value='';});dialog.addEventListener('close',()=>{if(!dialog.open)password.value='';});
 form.onsubmit=async event=>{
  event.preventDefault();if(busy||disposed)return;const entered=password.value;let signedIn=false;password.value='';busy=true;apply();$('filmOperatorError').textContent='';
  try{
   await refresh();await request('/api/operator/login',{method:'POST',data:{password:entered}});
   if(disposed)return;dialog.close();await refresh();if(status?.authenticated){await onSignedIn();signedIn=true;}
  }catch(e){if(!disposed){$('filmOperatorError').textContent=e.name==='AbortError'?'Sign-in timed out. Try again.':e.message;if(dialog.open)password.focus();}}
  finally{password.value='';busy=false;apply();if(!disposed){if(signedIn)$('filmSignOut').focus();else if(dialog.open)password.focus();}}
 };
 $('filmSignOut').onclick=async()=>{
  if(busy||disposed)return;busy=true;error='';onSignedOut();apply();
  let cleanupFailed=false,signedOut=false;
  try{
   await refresh();try{await beforeSignOut();}catch{cleanupFailed=true;}
   await request('/api/operator/logout',{method:'POST',data:{},token:status?.token});if(disposed)return;
   await refresh();if(cleanupFailed)location.reload();else signedOut=true;
  }catch(e){if(!disposed){error=e.name==='AbortError'?'Sign-out timed out. Try again.':e.message;}}
  finally{busy=false;apply();if(signedOut&&!disposed)$('filmSignIn').focus();}
 };
 const timer=setInterval(()=>{if(!busy)refresh();},20000);refresh();
 function dispose(){if(disposed)return;disposed=true;clearInterval(timer);for(const controller of pending)controller.abort();pending.clear();password.value='';dialog.close();dialog.remove();card.remove();const phone=document.querySelector('.phone-controls');if(phone)phone.inert=false;}
 window.addEventListener('pagehide',dispose,{once:true});
 return{refresh,dispose,inspect:()=>({cloud,authenticated:!!status?.authenticated,busy,disposed,visible:!disposed&&!card.hidden})};
}
