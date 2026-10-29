import {loadRuntime,ProgramPicker,cueForm} from './runtime-library.mjs';
import {CatalogCueDirector} from './catalog-director.mjs';
import {PlaylistRunner,mountPlaylists,playlistControls} from './saved-playlists.mjs';
import {StageCompositor} from '/assets/stage-compositor.js';
import {CueDirector} from './cue-director.mjs';
import {FilmTransport} from './film-transport.mjs';
import {SingleFilmTransport} from './single-film-transport.mjs';
const Transport=new URLSearchParams(location.search).get('pipeline')==='single'?SingleFilmTransport:FilmTransport;
import {StageFrameClock} from './frame-clock.mjs';
import {createFilmRemote} from './film-remote.mjs';
import {mountPhoneControls} from '/assets/phone-bridge.js';
import {mountOwnerSound} from './owner-sound-controls.mjs';
import {mountOperatorAccess} from './operator-access.mjs';
import {mountFilmOutput} from '../runway-pilots/wisp-film-output.js';
const $=id=>document.getElementById(id),studies=[
 {id:'cute',form:'friendly',title:'Friendly Wisp',detail:'Fuller living motion · approved direction',loop:true,src:'../runway-pilots/continuous-loop-study/wisp-continuous-loop-v28.mp4'},
 {id:'scary',form:'scary',title:'Menacing Wisp',detail:'Full-body motion study · exits through black',loop:false,src:'../runway-pilots/motion-transfer-study/wisp-scary-motion-transfer-v35.mp4'}
];
let libraryError=null;
const runtime=await loadRuntime(new URL('./playback-library.json',import.meta.url)).catch(error=>{libraryError=error.message;return null;});
const useCatalog=!!runtime?.clips.length,clips=runtime?(useCatalog?runtime.clips.map(c=>({...c,detail:c.manualOnly?'Operator cue · complete performance':'Approved film · planned transitions'})):studies):[];
const picker=useCatalog?new ProgramPicker(runtime):null;
const formOf=id=>cueForm(clips.find(c=>c.id===id));
const showError=error=>{$('status').textContent=error.message;};
if(libraryError){$('status').textContent='Cue library unavailable · stage black';$('start').disabled=true;}
if(useCatalog){$('stageInfo').textContent='Approved character films. Cue changes follow reviewed cuts, full transition performances or planned empty-stage arrivals.';$('filmSoundInfo').textContent='Film sound plays only on this laptop after you enable it. Preloads, effect videos, phone and projector remain silent. Blackout turns sound off.';$('studyInfo').hidden=true;for(const mode of ['cute','scary','alternate','mostly-scary']){const option=$('mode').querySelector('[value="'+mode+'"]');option.textContent=option.textContent.replace(' · study','');try{picker.assertMode(mode);}catch{option.disabled=true;}}}
const compositor=new StageCompositor($('stage'),{onLayerError:id=>$('status').textContent='Layer unavailable: '+id});
const frameClock=new StageFrameClock(),transport=new Transport(compositor,clips,{frameClock,mediaHost:$('mediaSources')}),overlays=new Map();let disposed=false,raf,mode='manual',formSince=0,formPausedAt=null,lastForm=null,activity=0,lastTime=-1,lastVideo=null,lastFresh=performance.now(),stale=false;
let soundControls,operatorControls;const playlist=new PlaylistRunner();
const labels={stopped:'Stage black',preparing:'Preparing next cue',exiting:'Planned exit','empty-stage':'Empty stage · planned transition',entering:'Planned entrance',playing:'On stage',bridging:'Transition performance',unavailable:'Film unavailable · stage black'};
const directorOptions={fadeMs:900,onState:s=>{
 if(s.phase!=='playing')soundControls?.cancel();if(['stopped','unavailable'].includes(s.phase))$('filmSound').checked=false;
 $('status').textContent=labels[s.phase]+(s.current?' · '+clips.find(c=>c.id===s.current)?.title:'');$('queue').textContent=s.queued?'Queued · '+clips.find(c=>c.id===s.queued)?.title:'No cue queued';
 for(const b of $('cues').querySelectorAll('button')){b.setAttribute('aria-pressed',String(b.dataset.cue===s.current));if(useCatalog){b.disabled=!!s.current&&s.current!==b.dataset.cue&&!picker.can(s.current,b.dataset.cue);b.title=b.disabled?'This cue needs a transition. Blackout lets you start it on an empty stage.':'';}}
 if(s.phase==='playing'&&mode==='playlist'){const state=playlist.inspect(),steps=playlist.playlist.steps;transport.preload(steps[(state.index+1)%steps.length].cue);}
 if(s.phase==='playing'&&formOf(s.current)!==lastForm){lastForm=formOf(s.current);formSince=performance.now();formPausedAt=null;}
}};
const director=useCatalog?new CatalogCueDirector(transport,runtime,directorOptions):new CueDirector(transport,directorOptions);
const activate=transport.activate.bind(transport);transport.activate=async(prepared,live)=>{await activate(prepared,live);if(live())for(const {source}of overlays.values())if(source.tagName==='VIDEO')source.play().catch(()=>{});};
const output=mountFilmOutput($('stage'),()=>({black:compositor.black||stale||!transport.active&&!transport.heldFrame,paused:transport.active?.paused??!transport.heldFrame,disposed,metrics:{draws:activity}}),{beforePaint:()=>paintDesk(performance.now())});
function refreshLayers(){
 $('layers').replaceChildren();const layers=compositor.inspect().layers;
 layers.forEach((layer,index)=>{
  const row=document.createElement('div');row.className='layer';const title=document.createElement('strong');title.textContent=layer.id==='character'?'Wisp film':overlays.get(layer.id)?.name||layer.id;row.append(title);
  const visibility=document.createElement('button');visibility.textContent=layer.visible?'Hide':'Show';visibility.setAttribute('aria-label',(layer.visible?'Hide ':'Show ')+title.textContent);visibility.onclick=()=>{compositor.update(layer.id,{visible:!layer.visible});activity++;refreshLayers();};
  const label=document.createElement('label');label.textContent='Opacity';const range=document.createElement('input');range.type='range';range.min=0;range.max=100;range.value=layer.opacity*100;range.setAttribute('aria-label',title.textContent+' opacity');range.oninput=()=>{compositor.update(layer.id,{opacity:Number(range.value)/100});activity++;};label.append(range);row.append(label);
  const blend=document.createElement('select');blend.setAttribute('aria-label',title.textContent+' blend');for(const [value,name]of [['source-over','Normal'],['screen','Screen · light on black'],['lighter','Add light'],['multiply','Multiply']]){const option=new Option(name,value);option.selected=value===layer.blend;blend.add(option);}blend.onchange=()=>{compositor.update(layer.id,{blend:blend.value});activity++;};row.append(blend);
  if(layer.id!=='character'){
   for(const [key,name,min,max,factor]of [['scale','Size',10,150,100],['x','Horizontal',-40,40,100],['y','Vertical',-40,40,100]]){
    const placement=document.createElement('label'),slider=document.createElement('input'),value=document.createElement('output');placement.textContent=name+' ';slider.type='range';slider.min=min;slider.max=max;slider.step=1;slider.value=Math.round(layer[key]*factor);slider.setAttribute('aria-label',title.textContent+' '+name.toLowerCase());value.textContent=slider.value+'%';
    slider.oninput=()=>{compositor.update(layer.id,{[key]:Number(slider.value)/factor});value.textContent=slider.value+'%';activity++;};placement.append(value,slider);row.append(placement);
   }
   const reset=document.createElement('button');reset.textContent='Center & fit';reset.onclick=()=>{compositor.update(layer.id,{scale:1,x:0,y:0});activity++;refreshLayers();};row.append(reset);
  }
  const actions=document.createElement('div');actions.className='layer-actions';actions.append(visibility);
  for(const [text,to]of [['Back',index-1],['Front',index+1]]){const b=document.createElement('button');b.textContent=text;b.disabled=to<0||to>=layers.length;b.onclick=()=>{compositor.move(layer.id,to);activity++;refreshLayers();};actions.append(b);}
  if(layer.id!=='character'){const remove=document.createElement('button');remove.textContent='Remove';remove.onclick=()=>{release(layer.id);activity++;refreshLayers();};actions.append(remove);}
  row.append(actions);$('layers').append(row);
 });
}
function decodeEffectImage(source,signal){
 return new Promise((resolve,reject)=>{const abort=()=>{cleanup();reject(Error('Effect import cancelled'));},cleanup=()=>signal.removeEventListener('abort',abort);signal.addEventListener('abort',abort,{once:true});Promise.resolve(source.decode()).then(()=>{cleanup();resolve();},error=>{cleanup();reject(error);});if(signal.aborted)abort();});
}
function disposeEffect(item){
 if(item.retired)return;item.retired=true;item.abort?.abort();const source=item.source;
 source.pause?.();source.removeAttribute('src');if(source.tagName==='VIDEO')source.load();source.remove();URL.revokeObjectURL(item.url);
}
function release(id){const item=overlays.get(id);if(!item)return;overlays.delete(id);compositor.remove(id);disposeEffect(item);}
const pendingEffects=new Set();let effectEpoch=0,nextLayer=0,lastEffectFailure=null;
function cancelPendingEffects(){effectEpoch++;for(const item of pendingEffects)disposeEffect(item);pendingEffects.clear();}
$('addEffect').onclick=()=>$('effectFile').click();
$('effectFile').onchange=async event=>{
 const file=event.target.files[0];event.target.value='';if(!file)return;
 if(overlays.size+pendingEffects.size>=11){$('status').textContent='Layer limit reached · remove an effect first';return;}
 const isVideo=['video/mp4','video/webm'].includes(file.type),isImage=['image/png','image/jpeg','image/webp'].includes(file.type);if(!isVideo&&!isImage){$('status').textContent='Choose PNG, JPEG, WebP, MP4 or WebM';return;}
 const item={url:URL.createObjectURL(file),source:document.createElement(isVideo?'video':'img'),abort:new AbortController(),retired:false,name:file.name,lastTime:-1},source=item.source,id='effect-'+(++nextLayer),epoch=effectEpoch;
 pendingEffects.add(item);
 if(isVideo){source.muted=true;source.preload='auto';source.loop=true;source.playsInline=true;source.className='source-preview';source.setAttribute('aria-hidden','true');source.title=file.name;$('mediaSources').append(source);}
 try{
  source.src=item.url;
  if(isVideo){source.load();await new Promise(resolve=>setTimeout(resolve,0));await transport.frame(source,item.abort.signal);if(!transport.active)source.pause();}
  else await decodeEffectImage(source,item.abort.signal);
  if(disposed||epoch!==effectEpoch||item.retired){disposeEffect(item);return;}
  pendingEffects.delete(item);overlays.set(id,item);compositor.add({id,source,opacity:.4,blend:'screen'});activity++;refreshLayers();
 }catch(error){const cancelled=item.retired||item.abort.signal.aborted||disposed||epoch!==effectEpoch;if(!cancelled){const observed=source._wispFrameReadiness;lastEffectFailure={kind:error?.message==='Film did not deliver a frame'?'frame-timeout':source.error?'media-error':'import-error',video:isVideo,readyState:source.readyState??null,networkState:source.networkState??null,currentTime:source.currentTime??null,paused:source.paused??null,mediaErrorCode:source.error?.code??null,frameCallbacks:observed?.frameCallbacks??null,lastMetadataTime:observed?.lastMetadataTime??null,requestedTime:observed?.requestedTime??null,connected:source.isConnected,rect:{width:source.getBoundingClientRect().width,height:source.getBoundingClientRect().height}};}if(overlays.get(id)===item){overlays.delete(id);compositor.remove(id);}disposeEffect(item);if(!cancelled)$('status').textContent='Effect could not load';}
 finally{pendingEffects.delete(item);}
};
function stop(){cancelPendingEffects();playlist.stop();formPausedAt=null;mode='manual';$('mode').value=mode;timing();director.stop();for(const {source}of overlays.values())source.pause?.();output.blackout();lastForm=null;}
for(const clip of clips){const b=document.createElement('button');b.dataset.cue=clip.id;b.innerHTML='<strong></strong><small></small>';b.querySelector('strong').textContent=clip.title;b.querySelector('small').textContent=clip.detail;b.onclick=()=>{try{chooseCue(clip.id).catch(showError);}catch(error){showError(error);}};$('cues').append(b);}
function chooseCue(id){if(useCatalog)director.resolve(director.current,id);playlist.stop();formPausedAt=null;mode='manual';$('mode').value=mode;timing();if(director.current===id&&director.phase==='playing')return Promise.resolve();return director.request(id);}
function startProgram(selected){
 let id;if(useCatalog){if(selected!=='manual')picker.assertMode(selected);picker.reset();const form=['scary','mostly-scary'].includes(selected)?'scary':'friendly';id=picker.pick(form,director.current);director.resolve(director.current,id);}else{id=['scary','mostly-scary'].includes(selected)?'scary':'cute';if(!clips.length)throw Error('Cue library unavailable');}
 playlist.stop();mode=selected;$('mode').value=mode;timing();lastForm=null;formSince=performance.now();formPausedAt=null;
 if(director.current===id&&director.phase==='playing')return Promise.resolve();return director.request(id);
}
const playlistClips=clips.filter(c=>!c.manualOnly);
const cueAliases=useCatalog?{cute:playlistClips.find(c=>c.form==='friendly')?.id,scary:playlistClips.find(c=>c.form==='scary')?.id}:{};
function validatePlaylistRun(p){
 if(disposed)throw Error('Show desk closed');
 if(useCatalog){for(let i=0;i<p.steps.length;i++){director.resolve(p.steps[i].cue,p.steps[(i+1)%p.steps.length].cue);if(!clips.find(c=>c.id===p.steps[i].cue).loop)director.resolve(p.steps[i].cue,p.steps[i].cue);}director.resolve(director.current,p.steps[0].cue);}
}
const playlists=playlistControls(mountPlaylists(document.querySelector('main>aside'),{clips:playlistClips,cueAliases,description:useCatalog?'Complete performances and reviewed routes are preserved. Manual cues or Blackout stop the playlist.':undefined,onRun:p=>{
 validatePlaylistRun(p);const id=playlist.start(p,playlistClips.map(c=>c.id));mode='playlist';$('mode').value='playlist';$('programTiming').textContent='Repeating playlist · '+p.name;lastForm=null;formSince=performance.now();formPausedAt=null;return director.request(id);
}}));
const selectedSavedPlaylist=()=>{const p=playlists.selected();if(!p)return null;try{validatePlaylistRun(p);return p;}catch{return null;}};
$('filmSound').onchange=()=>transport.setSound($('filmSound').checked,Number($('filmLevel').value)/100);$('filmLevel').oninput=()=>transport.setSound($('filmSound').checked,Number($('filmLevel').value)/100);
$('start').onclick=()=>{try{if($('mode').value==='playlist')document.querySelector('[data-run]').click();else startProgram($('mode').value).catch(showError);}catch(error){showError(error);}};
function timing(){const n=Number($('dwell').value),selected=$('mode').value;$('dwellValue').textContent=n+'s';$('programTiming').textContent=selected==='playlist'?'Repeating playlist · '+(playlist.inspect().name||'saved show'):selected==='manual'?'Manual cueing · no automatic form changes':selected==='mostly-scary'?`Scary ${n*3}s · cute ${n*.5}s`:selected==='alternate'?`Cute ${n}s · scary ${n}s`:`${selected==='cute'?'Friendly':'Scary'} only · no automatic form changes`;}
$('dwell').oninput=timing;$('mode').onchange=timing;$('pace').onchange=()=>{director.fadeMs=Number($('pace').value);};
$('blackout').onclick=stop;document.addEventListener('keydown',e=>{if(e.key==='Escape')stop();});$('puppet').onclick=stop;
function nextForm(){if(mode==='playlist')return playlist.current().cue;if(useCatalog){const form=mode==='cute'?'friendly':mode==='scary'?'scary':formOf(director.current)==='friendly'?'scary':'friendly';return picker.pick(form,director.current);}if(mode==='cute')return'cute';if(mode==='scary')return'scary';return director.current==='cute'?'scary':'cute';}
function idleReturn(){if(!useCatalog)return'cute';const preferred=clips.find(c=>c.id==='friendly-drift'&&!c.manualOnly&&picker.can(director.current,c.id));return preferred?.id||picker.pick('friendly',director.current);}
function autoQueue(select){try{director.request(select()).catch(showError);}catch(error){stop();showError(Error('Program stopped · '+error.message));}}

function paintDesk(now){
 if(disposed)return;frameClock.pulse();const v=transport.active;if(v&&(v!==lastVideo||v.currentTime!==lastTime)){activity++;lastVideo=v;lastTime=v.currentTime;lastFresh=now;}
 const wasStale=stale;stale=!!v&&now-lastFresh>1200;if(stale&&!wasStale)soundControls?.cancel();compositor.suspend(stale);transport.suspendSound(stale);
 for(const item of overlays.values())if(item.source.tagName==='VIDEO'&&item.source.currentTime!==item.lastTime){item.lastTime=item.source.currentTime;activity++;}
 // Automatic pacing counts visible performance, excluding decode/transition/stall time.
 if(mode!=='manual'&&mode!=='playlist'){if(stale||director.phase!=='playing'){if(formPausedAt===null)formPausedAt=now;}else if(formPausedAt!==null){formSince+=Math.max(0,now-formPausedAt);formPausedAt=null;}}
 if(mode==='playlist')playlist.suspend(stale||director.phase!=='playing',now);
 if(mode==='playlist'&&!stale&&director.phase==='playing'){playlist.observe(director.current,now);if(playlist.due(now))autoQueue(()=>playlist.advance());}
 const seconds=Number($('dwell').value)*(mode==='mostly-scary'?(formOf(director.current)==='scary'?3:.5):1),due=now-formSince>=seconds*1000;
 if(v&&!v.loop&&v.ended&&director.phase==='playing'){if(!useCatalog)compositor.blackout();autoQueue(()=>mode==='manual'?idleReturn():mode==='playlist'?playlist.current().cue:useCatalog&&!due?picker.pick(formOf(director.current),director.current):nextForm());}
 else if(v&&!stale&&director.phase==='playing'){
  const exitDue=!v.loop&&Number.isFinite(v.duration)&&v.currentTime>=v.duration-director.fadeMs/1000-.65;
  if(exitDue){autoQueue(()=>mode==='manual'?idleReturn():mode==='playlist'?playlist.current().cue:due?nextForm():useCatalog?picker.pick(formOf(director.current),director.current):director.current);}
  else if(mode!=='manual'&&mode!=='playlist'&&due){try{const next=nextForm();if(next===director.current&&v.loop)formSince=now;else director.request(next);}catch(error){stop();showError(error);}}
 }
 compositor.render();
}
function tick(now){if(disposed)return;paintDesk(now);raf=requestAnimationFrame(tick);}
refreshLayers();tick(performance.now());
soundControls=mountOwnerSound(document.querySelector('main>aside'),{canPlay:()=>!disposed&&!stale&&!compositor.black&&director.phase==='playing'});
const inspectDesk=()=>({director:director.inspect(),composition:compositor.inspect(),frameClock:frameClock.inspect(),mode,library:{approved:useCatalog,count:clips.length,error:libraryError},program:{visibleMs:Math.max(0,(formPausedAt??performance.now())-formSince),paused:formPausedAt!==null},playlist:playlist.inspect(),filmSound:transport.inspectSound(),preparation:{ready:transport.prepared?.id||null,pending:transport.preparing?.id||null},media:transport.videos.map(v=>({muted:v.muted,paused:v.paused,cue:v.dataset.cue||null,currentTime:v.currentTime,loop:v.loop})),effects:overlays.size,pendingEffects:pendingEffects.size,lastEffectFailure:lastEffectFailure?structuredClone(lastEffectFailure):null,sound:soundControls.inspect(),operator:operatorControls?.inspect()||null});
const remote=createFilmRemote({chooseCue,startProgram,stop,inspect:inspectDesk,clips:useCatalog||libraryError?clips:undefined,programModes:libraryError?[]:[...$('mode').options].filter(o=>!o.disabled).map(o=>o.value),savedPlaylist:{selected:selectedSavedPlaylist,run:()=>playlists.run()}});
window.WispDesk={inspect:inspectDesk,...remote};
const phoneRemote={remoteState:remote.remoteState,remoteCommand:(...args)=>{const access=operatorControls?.inspect();if(access?.cloud&&(!access.authenticated||access.busy||access.disposed))return Promise.reject(Object.assign(Error('Operator sign-in required'),{cancelled:true}));return remote.remoteCommand(...args);}};
mountPhoneControls({controller:()=>phoneRemote,previewCanvas:()=>$('stage')});
operatorControls=mountOperatorAccess(document.querySelector('main>aside'),{onSignedOut:stop,beforeSignOut:async()=>{if(window.HauntPhone?.inspect().enabled)await window.HauntPhone.disable();},onSignedIn:async()=>{try{await window.HauntPhone?.refresh();}catch(error){$('phoneStatus').textContent='Signed in. '+error.message;}}});
window.addEventListener('pagehide',()=>{disposed=true;cancelPendingEffects();cancelAnimationFrame(raf);director.dispose();frameClock.dispose();operatorControls.dispose();soundControls.dispose();for(const id of [...overlays.keys()])release(id);compositor.dispose();output.dispose();},{once:true});
