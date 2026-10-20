import {mountPhoneControls} from '/assets/phone-bridge.js';
import {mountOperatorAccess} from '../ambient-show/operator-access.mjs';
/** Existing paired service only; no microphone, sound or credentials reach a phone. */
export function mountPairedControls(host,{remote,stop,canvas}){
 let access,disposed=false,navigating=false;
 const controller={remoteState:()=>remote.remoteState(),remoteCommand:(...args)=>{
  const state=access?.inspect();
  if(disposed||state?.cloud&&(!state.authenticated||state.busy||state.disposed))return Promise.reject(Object.assign(Error('Operator sign-in required'),{cancelled:true}));
  return remote.remoteCommand(...args);
 }};
 mountPhoneControls({controller:()=>controller,previewCanvas:()=>canvas,host});
 access=mountOperatorAccess(host,{onSignedOut:stop,beforeSignOut:async()=>{if(window.HauntPhone?.inspect().enabled)await window.HauntPhone.disable();},onSignedIn:async()=>{try{await window.HauntPhone?.refresh();}catch(e){document.getElementById('phoneStatus').textContent='Signed in. '+e.message;}}});
 // Release the old owner before a normal workspace link opens the next desk.
 // A copied tab still gets a fresh client ID; no ownership token is reused.
 async function navigate(event){
  const link=event.target.closest?.('a[href]');if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.hasAttribute('download')||link.target==='_blank')return;
  const url=new URL(link.href);if(url.origin!==location.origin||url.pathname===location.pathname)return;
  event.preventDefault();if(navigating||disposed)return;navigating=true;stop();
  try{if(window.HauntPhone?.inspect().enabled)await window.HauntPhone.disable();if(!disposed)location.assign(url.href);}
  catch{navigating=false;document.getElementById('phoneStatus').textContent='Phone control could not be released. Try the workspace link again.';}
 }
 document.addEventListener('click',navigate);
 const dispose=()=>{if(disposed)return;disposed=true;document.removeEventListener('click',navigate);access.dispose();};window.addEventListener('pagehide',dispose,{once:true});
 return{dispose,inspect:()=>access.inspect()};
}
