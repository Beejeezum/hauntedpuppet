import {YardScene} from './yard-scene.mjs';
import {WatchfulEyes} from './watchful-eyes.mjs';
import {SilkSpider} from './silk-spider.mjs';
import {StagehandRehearsal} from './rehearsal-player.mjs';
import {validateScene} from './scene-settings.mjs';
import {NightWatch, nightGhostAction} from './night-watch.mjs';
import {SceneFade} from './scene-fade.mjs';
import {AfterDarkSound} from './after-dark-sound.mjs';
import {AfterDarkRemote} from './after-dark-remote.mjs';
import {mountPhoneControls} from '../../../assets/phone-bridge.js';
import {mountFilmOutput} from '../../wisp-performance-reference/runway-pilots/wisp-film-output.js';
import {PICTURE_ONLY, mountPreviewNotice} from './yard-environment.mjs';
mountPreviewNotice();
const $=id=>document.getElementById(id),canvas=$('stage'),film=$('film'),scene=new YardScene(canvas),eyes=new WatchfulEyes(),spider=new SilkSpider();
let player,output,remote,phoneMounted=false,phoneMounting=false,program='eyes',running=false,loading=false,disposed=false,epoch=0,frame,started=0,lastBeat=-1,switchSerial=0;
const sound=new AfterDarkSound({onChange:syncSound});
function syncSound(){const s=sound.inspect();$('sound').textContent=s.loading?'Preparing effects…':s.enabled?'Effects on':'Effects off';$('sound').setAttribute('aria-pressed',String(s.enabled));$('sound').disabled=!running||s.loading;$('sound-level').disabled=!s.enabled;$('sound-status').textContent=s.error||'';}
const night=new NightWatch(),fade=new SceneFade(),available={eyes:false,apparitions:false,spider:false},failures={};
let placement=scene.settings;try{placement=validateScene(JSON.parse(localStorage.getItem('wisp-yard-scene-v1')))}catch{}
function status(text){if($('loop-status').textContent!==text)$('loop-status').textContent=text;}
function playingStatus(){return program==='eyes'?'Pairs of eyes look out, disappear, then return somewhere else.':program==='spider'?'A spider lowers on silk, tests the air, then climbs into the dark.':'Wisp drifts through the yard, slips away, then returns.';}
function selectProgram(next){program=next;document.querySelectorAll('[data-program]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.program===next));$('start').disabled=!available[program];}
function stop({preserveSequence=false,preserveEffects=false}={}){sound.clear({disable:!preserveEffects});if(!preserveSequence){night.stop();$('night-status').textContent='Night watch is stopped. Start to begin again with the eyes.';}$('cycle').disabled=false;epoch++;switchSerial++;fade.reset(0,performance.now()/1000);running=loading=false;player?.stop();eyes.stop();spider.stop();scene.stop();output?.blackout();output?.releasePictures();$('start').disabled=!available[program];$('start').textContent=$('cycle').checked?'Start Night watch':'Start loop';status('Blackout. Both output windows are clear.');syncSound();}
async function start({sequenceHop=false}={}){stop({preserveSequence:sequenceHop,preserveEffects:true});if($('cycle').checked&&!sequenceHop){try{selectProgram(night.start(available));}catch(error){status(error.message);return;}}const own=epoch;loading=true;$('cycle').disabled=true;$('start').disabled=true;status('Preparing the loop…');
 try{if(!available[program])throw Error('This loop is unavailable. Choose another program.');scene.set({...placement,ghost:{...placement.ghost,visible:program==='apparitions'},eyes:{...placement.eyes,visible:false}});
  if(program==='apparitions'){if(!await player.start())throw Error(player.error||'Ghost film could not start');player.plan.setMode('host');}
  if(own!==epoch)return false;started=performance.now()/1000;lastBeat=-1;if(night.running)night.enter(started);fade.reset(0,started);fade.to(1,started);if(program==='eyes')eyes.start(started);if(program==='spider')spider.start(started);running=true;loading=false;$('start').disabled=false;$('start').textContent=night.running?'Restart Night watch':'Restart loop';status(playingStatus());syncSound();return true;
 }catch(e){if(own===epoch){stop();status(e.message);}return false;}
}
function paint(){if(!running||disposed)return;const t=performance.now()/1000;
 if(program==='apparitions'){
  if(!player.running){stop();status(player.error||'Playback stopped');return;}
  const beat=night.running?nightGhostAction(t-started):Math.floor((t-started)/7)%8;
  if(beat!==lastBeat){lastBeat=beat;const action=night.running?beat:['home','left','far','vanish',null,'appear','right','home'][beat];if(action)scene.motion.request(action,t);}
 }
 scene.render(film,{running:true},{tone:'mischief',opacity:fade.sample(t),overlay:program==='eyes'?(ctx,clock)=>eyes.draw(ctx,clock):program==='spider'?(ctx,clock)=>spider.draw(ctx,clock):null});
 if(scene.error){stop();status(scene.error);return;}
 sound.tick({program,elapsed:t-started,night:night.running,eyes:eyes.inspect().slots},fade.value);
 if(night.running){
  const clear=program==='eyes'?eyes.inspect().clear:program==='spider'?spider.beat?.phase==='empty':scene.motion.value.alpha<.0001&&scene.vapor.particles.length===0;
  const action=night.tick(t,clear);
  if(action?.action==='drain')eyes.finish();
  else if(action?.action==='advance'){selectProgram(action.program);void start({sequenceHop:true});}
  else if(action?.action==='fail'){stop();status(action.message);}
  const state=night.inspect(),names={eyes:'Watching eyes',spider:'Spider on silk',apparitions:'Quiet apparitions'};
  const detail=state.running?`Night watch · ${state.emptyHold?'A quiet pause':'Letting this scene finish'} · next: ${names[state.next]}.`:'Night watch stopped.';
  if($('night-status').textContent!==detail)$('night-status').textContent=detail;
 }
}

function tick(){if(disposed)return;paint();frame=requestAnimationFrame(tick);}
$('stop').onclick=()=>{remote?.invalidate();stop();};$('start').onclick=()=>{remote?.invalidate();void start();};
$('sound').onclick=()=>{if(sound.enabled)sound.clear({disable:true});else if(running)void sound.enable();};
$('sound-level').oninput=()=>{const level=Number($('sound-level').value);sound.setVolume(level/100);$('sound-level-value').textContent=level+'%';};
$('cycle').onchange=()=>{$('start').textContent=$('cycle').checked?'Start Night watch':'Start loop';$('night-status').hidden=!$('cycle').checked;};
async function chooseProgram(next){
 if(!available[next])throw Error('This scene is unavailable.');night.stop();$('cycle').checked=false;$('cycle').disabled=false;$('night-status').hidden=true;
 if(program===next){switchSerial++;fade.to(1,performance.now()/1000);if(running)status(playingStatus());return true;}
 const resume=running,serial=++switchSerial;
 if(resume){fade.to(0,performance.now()/1000);status('Letting the current apparition clear…');await new Promise(r=>setTimeout(r,700));if(serial!==switchSerial||disposed)return false;}
 stop({preserveEffects:true});selectProgram(next);if(resume)return await start();status('Ready. Start the selected loop.');return true;
}
async function runNightWatch(){
 if(night.running&&running)return true;
 const serial=++switchSerial;
 if(running){fade.to(0,performance.now()/1000);await new Promise(r=>setTimeout(r,700));if(serial!==switchSerial||disposed)return false;}
 $('cycle').checked=true;$('night-status').hidden=false;return await start();
}
for(const b of document.querySelectorAll('[data-program]'))b.onclick=()=>{if(!b.disabled){remote?.invalidate();void chooseProgram(b.dataset.program).catch(e=>status(e.message));}};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){remote?.invalidate();stop();}});
window.addEventListener('pagehide',()=>{disposed=true;remote?.dispose();stop();sound.dispose();cancelAnimationFrame(frame);player?.dispose();eyes.dispose();spider.dispose();scene.dispose();output?.dispose();},{once:true});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
$('phone-open').onclick=async()=>{
 if(PICTURE_ONLY)return;
 $('phone-dialog').showModal();if(phoneMounted||phoneMounting)return;phoneMounting=true;
 $('phone-connection').textContent='Checking the laptop connection…';
 try{const response=await fetch('/api/status',{signal:AbortSignal.timeout(5000)});if(!response.ok)throw Error();const s=await response.json();if(!s.yardPhone||!s.token)throw Error();if(disposed)return;
  mountPhoneControls({controller:()=>remote,previewCanvas:()=>canvas,host:$('after-dark-phone-controls')});phoneMounted=true;$('phone-connection').hidden=true;
  const details=$('after-dark-phone-controls').querySelector('details');details.open=true;details.querySelector('summary').textContent='Direct After dark from your phone';details.querySelector('p.help').textContent='Enable on trusted Wi-Fi, then pair your phone. Already paired in Stagehand? Leave that desk closed for five seconds, then enable here; your phone stays paired. Optional effects play only on this laptop; the phone stays silent.';
 }catch{$('phone-connection').textContent='Phone controls need the local laptop console at port8902. This preview can still run the scenes.';}finally{phoneMounting=false;}
};
try{
 let tone='haunted';try{const saved=JSON.parse(localStorage.getItem('wisp-stagehand-rehearsal-v1'));if(['gentle','haunted'].includes(saved?.tone))tone=saved.tone;}catch{}
 document.querySelector('[data-program=apparitions]').textContent=`Quiet apparitions · ${tone==='gentle'?'Friendly':'Evil'}`;
 await Promise.all([scene.load(),(async()=>{await eyes.load();available.eyes=eyes.ready;if(!eyes.ready)failures.eyes=eyes.error;})(),(async()=>{await spider.load();available.spider=spider.ready;if(!spider.ready)failures.spider=spider.error;})(),(async()=>{try{const r=await fetch('./media/manifest.json');if(!r.ok)throw Error('Ghost film package unavailable');player=new StagehandRehearsal(film,await r.json(),{schema:1,tone,pace:'relaxed',sequence:[]});available.apparitions=true;}catch(e){failures.apparitions=e.message;}})()]);
 if(disposed){player?.dispose();eyes.dispose();spider.dispose();scene.dispose();}else{
  for(const name of Object.keys(available)){const b=document.querySelector(`[data-program=${name}]`);b.disabled=!available[name];if(!available[name])b.title=failures[name]||'Unavailable';}
  selectProgram(Object.keys(available).find(name=>available[name])||'eyes');
  output=mountFilmOutput(canvas,()=>({running,black:!running,disposed,metrics:{draws:scene.frames}}),{beforePaint:paint,windowName:'wisp-stagehand-rehearsal-output'});
  const button=canvas.nextElementSibling;button.id='projector';button.textContent='Open projector';$('output-tools').append(button);
  const inspect=()=>({running,loading,program,sound:sound.inspect(),nightWatch:night.inspect(),opacity:fade.value,available:{...available},failures:{...failures},eyes:eyes.inspect(),spider:spider.inspect(),scene:scene.inspect(),player:player?.inspect()||null});
  remote=new AfterDarkRemote({inspect,select:chooseProgram,start,stop,nightWatch:runNightWatch});
  $('phone-open').disabled=PICTURE_ONLY;$('phone-open').hidden=PICTURE_ONLY;
  window.WispAfterDark=Object.freeze({inspect});
  status(Object.values(available).every(Boolean)?'Ready. Choose a loop, then Start.':available[program]?'Some artwork could not load. The available loops are ready.':'No loop could load. Refresh when the media package is available.');tick();
 }
}catch(e){status(e.message);eyes.dispose();spider.dispose();scene.dispose();player?.dispose();}
