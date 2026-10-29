import {StageCompositor} from '/assets/stage-compositor.js';
import {FilmTransport} from './film-transport.mjs';
import {SingleFilmTransport} from './single-film-transport.mjs';
import {decodePcmVoice} from './pcm-voice.mjs';
const Transport=new URLSearchParams(location.search).get('pipeline')==='single'?SingleFilmTransport:FilmTransport;
import {StageFrameClock} from './frame-clock.mjs';
import {PhonePerformanceDirector} from './phone-performance-director.mjs';
import {DirectorAmbientProgram} from './director-ambient-program.mjs';
import {mountPairedControls} from '../tonight-demo/paired-controls.mjs';
import {mountFilmOutput} from '../runway-pilots/wisp-film-output.js';
const $=id=>document.getElementById(id),clips=[{id:'friendly-drift',character:'friendly',src:'./friendly.mp4',loop:true,exitPolicy:'finish'},{id:'scary-drift',character:'scary',src:'./scary.mp4',loop:false,exitPolicy:'finish'}];
const ownedMouth=new URLSearchParams(location.search).get('mouth')==='owned-native';
let mouthLayer=null,mouthCandidate=null,mouthPreparing=false,mouthEpoch=0,mouthPreparationAbort=null,isolatedReference=false,mouthReferenceState=null;
const frameClock=new StageFrameClock();
const compositor=new StageCompositor($('stage')),transport=new Transport(compositor,clips,{frameClock,mediaHost:$('mediaSources'),characterFilter:raw=>{try{const picture=mouthLayer?.render(raw);return picture||(ownedMouth&&mouthLayer&&raw?.tagName==='VIDEO'?mouthLayer.frameSource.canvas:null)}catch{const failed=mouthLayer;mouthLayer=null;failed?.dispose();$('mouthStudy').checked=false;$('mouthStatus').textContent='Mouth study unavailable; original film retained';return null}}});
let context,source,enabled=false,disposed=false,frame,activeCharacter='friendly',speechStage='idle';
const ambient=new DirectorAmbientProgram(transport,clips,{onState:s=>{if(!s.suspended)activeCharacter=s.character;$('ambientStatus').textContent=s.error||((s.suspended?'Paused':'Between lines')+' · '+s.mode);}});
function resumeAmbient(ctx){
 if(ownedMouth&&mouthPreparing)return Promise.reject(Error('Wait for face preparation or press Stop'));
 // This paused movie was only sampled behind black; it has no visible
 // performance to finish. Retire it before the normal ambient transition.
 if(ownedMouth&&isolatedReference&&transport.active?.paused&&compositor.black){transport.blackout();isolatedReference=false;}
 return ambient.resume(ctx);
}
function silence(){isolatedReference=false;cancelMouthPreparation();ambient.suspend();mouthLayer?.stop();if(source){try{source.stop();}catch{}source.disconnect();source=null;}transport.blackout();}
async function speech(value,{signal,live}){
 signal=AbortSignal.any([signal,AbortSignal.timeout(70000)]);
 if(!enabled||!context||context.state!=='running')throw Error('Enable laptop sound before sending a line');
 const stage=value=>{if(live())speechStage=value;};stage('status');
 const status=await fetch('/api/status',{signal,credentials:'same-origin'}).then(r=>r.json());
 if(!status.token)throw Error('Sign in to the laptop voice service first');
 let words=value.text;
 if(value.mode==='prompt'){
  stage('prompt');const response=await fetch('/api/director/line',{method:'POST',credentials:'same-origin',signal,headers:{'Content-Type':'application/json','X-Haunt-Token':status.token},body:JSON.stringify({text:value.text,mode:'prompt',character:value.character})});
  const line=await response.json();if(!response.ok)throw Error(line.error||'Wisp could not prepare a line');
  if(signal.aborted||!live())throw Object.assign(Error('Cancelled'),{cancelled:true});
  words=line.text;
 }
 stage('voice request');const scary=value.character==='scary';
 const response=await fetch('/api/performance',{method:'POST',credentials:'same-origin',signal,headers:{'Content-Type':'application/json','X-Haunt-Token':status.token},body:JSON.stringify({text:words,voice:scary?'cedar':'marin',form:scary?'haunting':'friendly',audience:scary?'big':'family',mood:scary?'sinister':'amused',intensity:.65})});
 const data=await response.json();if(!response.ok)throw Error(data.error||'Voice preparation failed');
 if(typeof data.audio!=='string'||data.audio.length>4800000)throw Error('Voice response is unavailable or too large');
 const bytes=Uint8Array.from(atob(data.audio),c=>c.charCodeAt(0));stage('PCM decode');const buffer=decodePcmVoice(context,bytes.buffer,{maxSeconds:45,signal});stage('ready');
 if(signal.aborted||!live())throw Object.assign(Error('Cancelled'),{cancelled:true});
 if(buffer.duration>45)throw Error('Use a shorter line (45 seconds maximum)');
 return{buffer,visemes:Array.isArray(data.visemes)&&data.visemes.length<=5000?data.visemes:[],dispose(){this.buffer=null;}};
}
const director=new PhonePerformanceDirector({animations:clips,prepareSpeech:speech,
 prepareFilm:async(clip,{signal})=>{ambient.suspend();if(ownedMouth&&isolatedReference&&clip.loop&&transport.active?.dataset.cue===clip.id&&transport.active.paused&&compositor.black)return{id:clip.id,clip,video:transport.active,alreadyActive:true,revealPrepared:true,dispose(){}};if(clip.loop&&transport.active?.loop&&transport.active?.dataset.cue===clip.id&&!transport.active.paused&&!compositor.black)return{id:clip.id,clip,video:transport.active,alreadyActive:true,dispose(){}};const abort=()=>transport.cancelPreparation();signal.addEventListener('abort',abort,{once:true});try{return await transport.prepare(clip.id);}finally{signal.removeEventListener('abort',abort);}},
 validatePrepared:({speech,film})=>{if(!film.clip.loop&&speech.buffer.duration+.55>(film.duration??film.video.duration))throw Error('This scary film is too short for that line. Use fewer words.');},
 enter:async(film,ctx)=>{if(film.alreadyActive){if(film.revealPrepared){isolatedReference=false;await film.video.play();if(!ctx.live())return;compositor.reveal();await transport.fade(1,550,ctx.live);}return;}await transport.fade(0,550,ctx.live);if(!ctx.live())return;await transport.activate(film,ctx.live);await transport.fade(1,550,ctx.live);},
 play:async({speech,film,value},{signal,live})=>{if(!live())return;activeCharacter=value.character;await new Promise((resolve,reject)=>{
  const node=context.createBufferSource();source=node;node.buffer=speech.buffer;node.connect(context.destination);
  const done=()=>{signal.removeEventListener('abort',abort);node.disconnect();mouthLayer?.stop();if(source===node)source=null;resolve();};
  const abort=()=>{node.onended=null;try{node.stop();}catch{}node.disconnect();mouthLayer?.stop();if(source===node)source=null;signal.removeEventListener('abort',abort);reject(Object.assign(Error('Cancelled'),{cancelled:true}));};
  node.onended=done;signal.addEventListener('abort',abort,{once:true});if(signal.aborted){abort();return;}const startedAt=context.currentTime;if(value.character==='friendly'&&mouthLayer){const mode=mouthLayer.begin({context,source:node,startedAt,duration:speech.buffer.duration,visemes:speech.visemes});$('mouthStatus').textContent='Friendly mouth study: '+mode;}node.start(startedAt);
 });if(live()&&!film.clip.loop)await transport.exit(0,live,{keepPicture:true});},
 returnAmbient:ctx=>resumeAmbient(ctx),
 stop:silence,onState:s=>{$('status').textContent=s.phase+(s.queued?' · '+s.queued+' queued':'');}
});
function stop(){director.stop();output.blackout();}
function request(value){if(ownedMouth&&mouthPreparing){$('detail').textContent='Wait for face preparation or press Stop';return Promise.reject(Error($('detail').textContent));}$('detail').textContent='';return director.request(value).catch(error=>{if(!error.cancelled)$('detail').textContent=error.message;throw error;});}
const remote={remoteState:()=>({state:{workspace:'director',status:director.inspect().phase==='idle'&&!ambient.suspended?'Ambience · '+ambient.mode:director.inspect().phase,form:activeCharacter==='scary'?'haunting':'friendly',blackout:compositor.black},cues:[...(enabled?clips.map(c=>c.id):[]),'Ambient-Cute','Ambient-Scary','Ambient-Alternating','Ambient-Mostly-Scary']}),remoteCommand:(command,value)=>{
 if(command==='stop'||command==='blackout'&&value==='on'){stop();return Promise.resolve();}
 if(command==='blackout'&&value==='off')return ['idle','stopped'].includes(director.inspect().phase)?resumeAmbient():Promise.resolve();
 const modes={'Ambient-Cute':'friendly','Ambient-Scary':'scary','Ambient-Alternating':'alternate','Ambient-Mostly-Scary':'mostly-scary'};
 if(command==='cue'&&Object.hasOwn(modes,value)){$('ambientMode').value=modes[value];configureAmbient();return ['idle','stopped'].includes(director.inspect().phase)?resumeAmbient():Promise.resolve();}
 if(command==='perform')return request(value);
 return Promise.reject(Error('Choose a typed performance in the phone director'));
}};
const paired=mountPairedControls(document.querySelector('aside'),{remote,stop,canvas:$('stage')});
const output=mountFilmOutput($('stage'),()=>({black:compositor.black,disposed,metrics:{draws:compositor.draws}}),{beforePaint:paintDirector});
function cancelMouthPreparation(announce=true){
 if(!mouthPreparing&&!mouthCandidate)return;mouthEpoch++;mouthPreparing=false;mouthPreparationAbort?.abort();mouthPreparationAbort=null;const candidate=mouthCandidate;mouthCandidate=null;candidate?.dispose();if(announce){$('mouthStudy').checked=false;$('mouthStatus').textContent='Mouth study preparation stopped';}
}
$('mouthStudy').onchange=async()=>{
 const requested=$('mouthStudy').checked;cancelMouthPreparation(false);const epoch=++mouthEpoch;mouthLayer?.dispose();mouthLayer=null;$('mouthStudy').checked=requested;
 if(!requested){$('mouthStatus').textContent='Original film view';return;}if(ownedMouth&&!['idle','stopped'].includes(director.inspect().phase)){$('mouthStudy').checked=false;$('mouthStatus').textContent='Stop the current line before preparing this face study';return;}mouthPreparing=true;mouthReferenceState=null;$('mouthStatus').textContent='Preparing mouth study';
 try{
  if(ownedMouth){
   // Retire old movie-backed owner/output canvases while already black,
   // before imports or native decoder release. Never do this per frame.
   ambient.suspend();compositor.blackout();$('stage').width=$('stage').width;compositor.render();output.releasePictures();
   await new Promise(resolve=>setTimeout(resolve,0));if(disposed||epoch!==mouthEpoch)return;isolatedReference=false;transport.blackout();
  }
  const native=ownedMouth||new URLSearchParams(location.search).get('mouth')==='native-surface';const Layer=ownedMouth?(await import('../../wisp-art-reference/painted-speech-study/phone-owned-native-lip-layer.mjs')).PhoneOwnedNativeLipLayer:native?(await import('../../wisp-art-reference/painted-speech-study/phone-native-lip-layer.mjs')).PhoneNativeLipLayer:(await import('../../wisp-art-reference/painted-speech-study/phone-painted-mouth-layer.mjs')).PhonePaintedMouthLayer;
  if(disposed||epoch!==mouthEpoch)return;
  const candidate=new Layer();mouthCandidate=candidate;
  try{await candidate.load();if(disposed||epoch!==mouthEpoch){candidate.dispose();return;}
   if(ownedMouth){
    if(!['idle','stopped'].includes(director.inspect().phase))throw Error('Stop the current line before preparing this face study');
    const abort=new AbortController();mouthPreparationAbort=abort;
    const live=()=>!disposed&&epoch===mouthEpoch&&!abort.signal.aborted;
    const cancelFilm=()=>transport.cancelPreparation();abort.signal.addEventListener('abort',cancelFilm,{once:true});
    try{
     if(!live())return;
     const film=await transport.prepare('friendly-drift');if(!live()){film.dispose();return;}
     await transport.activate(film,live);if(!live())return;
     const video=transport.active;isolatedReference=true;video.pause();compositor.blackout();transport.syncSound();
     const {prepareNativePictureProfile,readCanonicalPictureProfile}=await import('../../wisp-art-reference/painted-speech-study/prepare-native-picture-profile.mjs');
     if(!live())return;
     const referenceSignal=AbortSignal.any([abort.signal,AbortSignal.timeout(10000)]);
     const canonicalProfile=await readCanonicalPictureProfile(new URL('../../wisp-art-reference/painted-speech-study/native-lip-mesh-study/friendly-v28-canonical-head-samples-v1.json',import.meta.url),referenceSignal);if(!live())return;
     const prepared=await prepareNativePictureProfile(video,{canonicalProfile,signal:abort.signal,isStageIsolated:()=>live()&&compositor.black&&transport.active===video&&video.paused,onProgress:({completed,total})=>{if(live()){mouthReferenceState={completed,total};$('mouthStatus').textContent='Preparing painted face '+completed+'/'+total;}},onRelease:state=>{if(epoch===mouthEpoch)mouthReferenceState=state;}});
     if(!live()){prepared.registration?.dispose();return;}candidate.registration=prepared.registration;
    }finally{abort.signal.removeEventListener('abort',cancelFilm);if(mouthPreparationAbort===abort)mouthPreparationAbort=null;}
   }
   if(disposed||epoch!==mouthEpoch){candidate.dispose();return;}mouthLayer=candidate;$('mouthStatus').textContent=(ownedMouth?'Picture-registered painted lips':native?'Native painted lips':'Friendly mouth study')+' ready for the next line · unapproved';}catch(error){candidate.dispose();throw error;}
 }catch(error){if(!disposed&&epoch===mouthEpoch){$('mouthStudy').checked=false;$('mouthStatus').textContent=error.message;}}
 finally{if(epoch===mouthEpoch){mouthPreparing=false;mouthCandidate=null;}}
};
$('enable').onclick=async()=>{try{context||=new AudioContext();await context.resume();enabled=context.state==='running';$('send').disabled=!enabled;$('enable').textContent=enabled?'Laptop sound enabled':'Try enabling sound again';}catch(error){$('detail').textContent=error.message;}};
$('stop').onclick=stop;$('lineForm').onsubmit=event=>{event.preventDefault();const character=$('character').value;request({text:$('line').value,mode:$('lineMode').value,character,animation:character==='friendly'?'friendly-drift':'scary-drift'}).catch(()=>{});};
function configureAmbient(){try{ambient.configure({mode:$('ambientMode').value,seconds:Number($('ambientSeconds').value)});}catch(error){$('detail').textContent=error.message;$('ambientMode').value=ambient.mode;$('ambientSeconds').value=ambient.seconds;return false;}try{localStorage.setItem('hauntedpuppet-director-ambient-v1',JSON.stringify({mode:ambient.mode,seconds:ambient.seconds}));}catch{}return true;}
try{const saved=JSON.parse(localStorage.getItem('hauntedpuppet-director-ambient-v1'));if(saved){ambient.configure(saved);$('ambientMode').value=ambient.mode;$('ambientSeconds').value=ambient.seconds;}}catch{/* Invalid or blocked preferences retain the safe default. */}
$('ambientMode').onchange=configureAmbient;$('ambientSeconds').onchange=configureAmbient;
$('ambientStart').onclick=()=>{if(!configureAmbient())return;if(['idle','stopped'].includes(director.inspect().phase))resumeAmbient().catch(error=>$('detail').textContent=error.message);else $('ambientStatus').textContent='Mode saved for after this line';};
function paintDirector(){if(disposed)return;frameClock.pulse();ambient.tick();compositor.render();}
function tick(){if(disposed)return;paintDirector();frame=requestAnimationFrame(tick);}tick();
window.addEventListener('pagehide',()=>{disposed=true;cancelMouthPreparation(false);ambient.dispose();mouthEpoch++;mouthLayer?.dispose();mouthLayer=null;director.dispose();paired.dispose();output.dispose();transport.dispose();frameClock.dispose();compositor.dispose();cancelAnimationFrame(frame);context?.close();},{once:true});
window.WispPhoneDirector={inspect:()=>({...director.inspect(),speechStage,mouthPreparation:{pending:mouthPreparing,allocated:!!mouthCandidate,isolatedReference,reference:mouthReferenceState},ambient:ambient.inspect(),frameClock:frameClock.inspect(),mouthStudy:mouthLayer?.inspect()||null}),stop};
