import {StageCompositor} from '/assets/stage-compositor.js';
import {FilmTransport} from './film-transport.mjs';
import {PhonePerformanceDirector} from './phone-performance-director.mjs';
import {mountPairedControls} from '../tonight-demo/paired-controls.mjs';
import {mountFilmOutput} from '../runway-pilots/wisp-film-output.js';
const $=id=>document.getElementById(id),clips=[{id:'friendly-drift',character:'friendly',src:'./friendly.mp4',loop:true},{id:'scary-drift',character:'scary',src:'./scary.mp4',loop:false}];
const compositor=new StageCompositor($('stage')),transport=new FilmTransport(compositor,clips,{mediaHost:$('mediaSources')});
let context,source,enabled=false,disposed=false,frame,activeCharacter='friendly';
function silence(){if(source){try{source.stop();}catch{}source.disconnect();source=null;}transport.blackout();}
async function speech(value,{signal,live}){
 if(!enabled||!context||context.state!=='running')throw Error('Enable laptop sound before sending a line');
 if(value.mode!=='exact')throw Error('Improvisation is not connected in this proof. Choose exact words.');
 const status=await fetch('/api/status',{signal,credentials:'same-origin'}).then(r=>r.json());
 if(!status.token)throw Error('Sign in to the laptop voice service first');
 const scary=value.character==='scary';
 const response=await fetch('/api/performance',{method:'POST',credentials:'same-origin',signal,headers:{'Content-Type':'application/json','X-Haunt-Token':status.token},body:JSON.stringify({text:value.text,voice:scary?'cedar':'marin',form:scary?'haunting':'friendly',audience:scary?'big':'family',mood:scary?'sinister':'amused',intensity:.65})});
 const data=await response.json();if(!response.ok)throw Error(data.error||'Voice preparation failed');
 if(typeof data.audio!=='string'||data.audio.length>4800000)throw Error('Voice response is unavailable or too large');
 const bytes=Uint8Array.from(atob(data.audio),c=>c.charCodeAt(0));const buffer=await context.decodeAudioData(bytes.buffer);
 if(signal.aborted||!live())throw Object.assign(Error('Cancelled'),{cancelled:true});
 if(buffer.duration>45)throw Error('Use a shorter line (45 seconds maximum)');
 return{buffer,dispose(){this.buffer=null;}};
}
const director=new PhonePerformanceDirector({animations:clips,prepareSpeech:speech,
 prepareFilm:async(clip,{signal})=>{const abort=()=>transport.cancelPreparation();signal.addEventListener('abort',abort,{once:true});try{return await transport.prepare(clip.id);}finally{signal.removeEventListener('abort',abort);}},
 enter:async(film,ctx)=>{await transport.fade(0,550,ctx.live);if(!ctx.live())return;await transport.activate(film,ctx.live);await transport.fade(1,550,ctx.live);},
 play:async({speech,value},{signal,live})=>{if(!live())return;activeCharacter=value.character;await new Promise((resolve,reject)=>{
  const node=context.createBufferSource();source=node;node.buffer=speech.buffer;node.connect(context.destination);
  const done=()=>{signal.removeEventListener('abort',abort);node.disconnect();if(source===node)source=null;resolve();};
  const abort=()=>{node.onended=null;try{node.stop();}catch{}node.disconnect();if(source===node)source=null;signal.removeEventListener('abort',abort);reject(Object.assign(Error('Cancelled'),{cancelled:true}));};
  node.onended=done;signal.addEventListener('abort',abort,{once:true});if(signal.aborted){abort();return;}node.start();
 });},
 returnAmbient:async ctx=>{if(!ctx.live())return;await transport.fade(0,550,ctx.live);if(!ctx.live())return;const film=await transport.prepare('friendly-drift');if(!ctx.live()){film.dispose();return;}await transport.activate(film,ctx.live);await transport.fade(1,550,ctx.live);},
 stop:silence,onState:s=>{$('status').textContent=s.phase+(s.queued?' · '+s.queued+' queued':'');}
});
function stop(){director.stop();output.blackout();}
function request(value){$('detail').textContent='';return director.request(value).catch(error=>{if(!error.cancelled)$('detail').textContent=error.message;throw error;});}
const remote={remoteState:()=>({state:{workspace:'director',status:director.inspect().phase,form:activeCharacter==='scary'?'haunting':'friendly',blackout:compositor.black},cues:enabled?clips.map(c=>c.id):[]}),remoteCommand:(command,value)=>{
 if(command==='stop'||command==='blackout'&&value==='on'){stop();return Promise.resolve();}
 if(command==='perform')return request(value);
 return Promise.reject(Error('Choose a typed performance in the phone director'));
}};
const paired=mountPairedControls(document.querySelector('aside'),{remote,stop,canvas:$('stage')});
const output=mountFilmOutput($('stage'),()=>({composition:compositor.inspect(),director:director.inspect()}));
$('enable').onclick=async()=>{try{context||=new AudioContext();await context.resume();enabled=context.state==='running';$('send').disabled=!enabled;$('enable').textContent=enabled?'Laptop sound enabled':'Try enabling sound again';}catch(error){$('detail').textContent=error.message;}};
$('stop').onclick=stop;$('lineForm').onsubmit=event=>{event.preventDefault();const character=$('character').value;request({text:$('line').value,mode:'exact',character,animation:character==='friendly'?'friendly-drift':'scary-drift'}).catch(()=>{});};
function tick(){if(disposed)return;compositor.render();frame=requestAnimationFrame(tick);}tick();
window.addEventListener('pagehide',()=>{disposed=true;director.dispose();paired.dispose();output.dispose();transport.dispose();compositor.dispose();cancelAnimationFrame(frame);context?.close();},{once:true});
window.WispPhoneDirector={inspect:()=>director.inspect(),stop};
