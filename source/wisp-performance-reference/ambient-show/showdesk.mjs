import {PlaylistRunner,mountPlaylists} from './saved-playlists.mjs';
import {StageCompositor} from '/assets/stage-compositor.js';
import {CueDirector} from './cue-director.mjs';
import {FilmTransport} from './film-transport.mjs';
import {createFilmRemote} from './film-remote.mjs';
import {mountPhoneControls} from '/assets/phone-bridge.js';
import {mountOwnerSound} from './owner-sound-controls.mjs';
import {mountOperatorAccess} from './operator-access.mjs';
import {mountFilmOutput} from '../runway-pilots/wisp-film-output.js';
const $=id=>document.getElementById(id),clips=[
 {id:'cute',title:'Friendly Wisp',detail:'Fuller living motion · approved direction',loop:true,src:'../runway-pilots/continuous-loop-study/wisp-continuous-loop-v28.mp4'},
 {id:'scary',title:'Menacing Wisp',detail:'Full-body motion study · exits through black',loop:false,src:'../runway-pilots/motion-transfer-study/wisp-scary-motion-transfer-v35.mp4'}
];
const compositor=new StageCompositor($('stage'),{onLayerError:id=>$('status').textContent='Layer unavailable: '+id});
const transport=new FilmTransport(compositor,clips,{mediaHost:$('mediaSources')}),overlays=new Map();let disposed=false,raf,mode='manual',formSince=0,lastForm=null,activity=0,lastTime=-1,lastVideo=null,lastFresh=performance.now(),stale=false;
let soundControls,operatorControls;const playlist=new PlaylistRunner();
const labels={stopped:'Stage black',preparing:'Preparing next cue',exiting:'Planned exit','empty-stage':'Empty stage · planned transition',entering:'Planned entrance',playing:'On stage',unavailable:'Film unavailable · stage black'};
const director=new CueDirector(transport,{fadeMs:900,onState:s=>{
 if(s.phase!=='playing')soundControls?.cancel();
 $('status').textContent=labels[s.phase]+(s.current?' · '+clips.find(c=>c.id===s.current)?.title:'');$('queue').textContent=s.queued?'Queued · '+clips.find(c=>c.id===s.queued)?.title:'No cue queued';
 for(const b of $('cues').querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.cue===s.current));
 if(s.phase==='playing'&&s.current!==lastForm){lastForm=s.current;formSince=performance.now();}
}});
const activate=transport.activate.bind(transport);transport.activate=async(prepared,live)=>{await activate(prepared,live);if(live())for(const {source}of overlays.values())if(source.tagName==='VIDEO')source.play().catch(()=>{});};
const output=mountFilmOutput($('stage'),()=>({black:compositor.black||stale||!transport.active,paused:transport.active?.paused??true,disposed,metrics:{draws:activity}}));
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
function release(id){const item=overlays.get(id);if(!item)return;if(item.source.tagName==='VIDEO'){item.source.pause();item.source.removeAttribute('src');item.source.load();item.source.remove();}else item.source.src='';URL.revokeObjectURL(item.url);overlays.delete(id);compositor.remove(id);}
let nextLayer=0;
$('addEffect').onclick=()=>$('effectFile').click();
$('effectFile').onchange=async event=>{
 const file=event.target.files[0];event.target.value='';if(!file)return;
 if(overlays.size>=11){$('status').textContent='Layer limit reached · remove an effect first';return;}
 const isVideo=['video/mp4','video/webm'].includes(file.type),isImage=['image/png','image/jpeg','image/webp'].includes(file.type);if(!isVideo&&!isImage){$('status').textContent='Choose PNG, JPEG, WebP, MP4 or WebM';return;}
 const url=URL.createObjectURL(file),source=document.createElement(isVideo?'video':'img'),id='effect-'+(++nextLayer);if(isVideo){source.muted=true;source.loop=true;source.playsInline=true;source.className='source-preview';source.setAttribute('aria-hidden','true');source.title=file.name;$('mediaSources').append(source);}
 try{source.src=url;if(isVideo){await transport.frame(source);if(!transport.active)source.pause();}else await source.decode();if(disposed){source.pause?.();source.removeAttribute('src');if(isVideo){source.load();source.remove();}URL.revokeObjectURL(url);return;}overlays.set(id,{url,source,name:file.name,lastTime:-1});compositor.add({id,source,opacity:.4,blend:'screen'});activity++;refreshLayers();}
 catch{source.pause?.();source.removeAttribute('src');source.remove();URL.revokeObjectURL(url);$('status').textContent='Effect could not load';}
};
function stop(){playlist.stop();mode='manual';$('mode').value=mode;timing();director.stop();for(const {source}of overlays.values())source.pause?.();output.blackout();lastForm=null;}
for(const clip of clips){const b=document.createElement('button');b.dataset.cue=clip.id;b.innerHTML='<strong></strong><small></small>';b.querySelector('strong').textContent=clip.title;b.querySelector('small').textContent=clip.detail;b.onclick=()=>chooseCue(clip.id);$('cues').append(b);}
function chooseCue(id){playlist.stop();mode='manual';$('mode').value=mode;timing();if(director.current===id&&director.phase==='playing')return Promise.resolve();return director.request(id);}
function startProgram(selected){playlist.stop();mode=selected;$('mode').value=mode;timing();lastForm=null;formSince=performance.now();const id=['scary','mostly-scary'].includes(mode)?'scary':'cute';if(director.current===id&&director.phase==='playing')return Promise.resolve();return director.request(id);}
mountPlaylists(document.querySelector('main>aside'),{clips,onRun:p=>{const id=playlist.start(p,clips.map(c=>c.id));mode='playlist';$('mode').value='playlist';$('programTiming').textContent='Repeating playlist · '+p.name;lastForm=null;formSince=performance.now();director.request(id);}});
$('start').onclick=()=>{$('mode').value==='playlist'?document.querySelector('[data-run]').click():startProgram($('mode').value);};
function timing(){const n=Number($('dwell').value),selected=$('mode').value;$('dwellValue').textContent=n+'s';$('programTiming').textContent=selected==='playlist'?'Repeating playlist · '+(playlist.inspect().name||'saved show'):selected==='manual'?'Manual cueing · no automatic form changes':selected==='mostly-scary'?`Scary ${n*3}s · cute ${n*.5}s`:selected==='alternate'?`Cute ${n}s · scary ${n}s`:`${selected==='cute'?'Friendly':'Scary'} only · no automatic form changes`;}
$('dwell').oninput=timing;$('mode').onchange=timing;$('pace').onchange=()=>{director.fadeMs=Number($('pace').value);};
$('blackout').onclick=stop;document.addEventListener('keydown',e=>{if(e.key==='Escape')stop();});$('puppet').onclick=stop;
function nextForm(){if(mode==='playlist')return playlist.current().cue;if(mode==='cute')return'cute';if(mode==='scary')return'scary';return director.current==='cute'?'scary':'cute';}
function tick(now){
 if(disposed)return;const v=transport.active;if(v&&(v!==lastVideo||v.currentTime!==lastTime)){activity++;lastVideo=v;lastTime=v.currentTime;lastFresh=now;}
 const wasStale=stale;stale=!!v&&now-lastFresh>1200;if(stale&&!wasStale)soundControls?.cancel();compositor.suspend(stale);
 for(const item of overlays.values())if(item.source.tagName==='VIDEO'&&item.source.currentTime!==item.lastTime){item.lastTime=item.source.currentTime;activity++;}
 if(mode==='playlist'&&director.phase==='playing'){playlist.observe(director.current,now);if(playlist.due(now))director.request(playlist.advance());}
 if(v&&!v.loop&&v.ended&&director.phase==='playing'){compositor.blackout();director.request(mode==='manual'?'cute':nextForm());}
 else if(v&&director.phase==='playing'){
  const seconds=Number($('dwell').value)*(mode==='mostly-scary'?(director.current==='scary'?3:.5):1),due=now-formSince>=seconds*1000;
  const exitDue=!v.loop&&Number.isFinite(v.duration)&&v.currentTime>=v.duration-director.fadeMs/1000-.65;
  if(exitDue){director.request(mode==='manual'?'cute':due?nextForm():director.current);}
  else if(mode!=='manual'&&mode!=='playlist'&&due){const next=nextForm();if(next===director.current)formSince=now;else director.request(next);}
 }
 compositor.render();raf=requestAnimationFrame(tick);
}
refreshLayers();tick(performance.now());
soundControls=mountOwnerSound(document.querySelector('main>aside'),{canPlay:()=>!disposed&&!stale&&!compositor.black&&director.phase==='playing'});
const inspectDesk=()=>({director:director.inspect(),composition:compositor.inspect(),mode,playlist:playlist.inspect(),media:transport.videos.map(v=>({muted:v.muted,paused:v.paused,cue:v.dataset.cue||null,currentTime:v.currentTime,loop:v.loop})),effects:overlays.size,sound:soundControls.inspect(),operator:operatorControls?.inspect()||null});
const remote=createFilmRemote({chooseCue,startProgram,stop,inspect:inspectDesk});
window.WispDesk={inspect:inspectDesk,...remote};
const phoneRemote={remoteState:remote.remoteState,remoteCommand:(...args)=>{const access=operatorControls?.inspect();if(access?.cloud&&(!access.authenticated||access.busy||access.disposed))return Promise.reject(Object.assign(Error('Operator sign-in required'),{cancelled:true}));return remote.remoteCommand(...args);}};
mountPhoneControls({controller:()=>phoneRemote,previewCanvas:()=>$('stage')});
operatorControls=mountOperatorAccess(document.querySelector('main>aside'),{onSignedOut:stop,beforeSignOut:async()=>{if(window.HauntPhone?.inspect().enabled)await window.HauntPhone.disable();},onSignedIn:async()=>{try{await window.HauntPhone?.refresh();}catch(error){$('phoneStatus').textContent='Signed in. '+error.message;}}});
window.addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(raf);director.dispose();operatorControls.dispose();soundControls.dispose();for(const id of [...overlays.keys()])release(id);compositor.dispose();output.dispose();},{once:true});
