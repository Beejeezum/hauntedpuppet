import {WispPerformanceRuntime} from '../wisp-performance-runtime.js';
import {performanceFrame,REEL_DURATION} from './reel.js';
const $=s=>document.querySelector(s),rig=await new WispPerformanceRuntime({layered:new URLSearchParams(location.search).get('rig')!=='poses'}).load();
if(rig.ready)$('#stage').append(rig.canvas);
let frameHandle=0;
let customClockOffset=0,customResumeClock=0;
let original=null,mode='custom',kind='',state='idle',actionStart=0,reelStart=0,heldAt=0,last=performance.now(),phase='Idle';
$('#compare').onclick=async()=>{
 const button=$('#compare');
 if(!original){button.disabled=true;try{const{PaintedWisp}=await import('../painted-wisp.js');original=await new PaintedWisp().load();$('#comparison').append(original.canvas);}catch{button.textContent='Comparison unavailable';button.disabled=false;return;}button.disabled=false;}
 const visible=$('main').classList.toggle('compare');button.textContent=visible?'Hide original':'Compare original';button.setAttribute('aria-pressed',String(visible));
};
function resumeCustom(){const now=performance.now()/1000;customResumeClock=rig.lastClock??now;customClockOffset=now-customResumeClock;mode='custom';}
function stop(){resumeCustom();kind='';state='idle';$('#talk').checked=false;phase='Idle';$('#reel').textContent='Play 15-second performance';}
function play(){mode='reel';reelStart=performance.now()/1000;$('#talk').checked=false;$('#reel').textContent='Restart performance';}
function seek(seconds){mode='hold';heldAt=Math.max(0,Math.min(REEL_DURATION,Number(seconds)||0));$('#talk').checked=false;$('#reel').textContent='Play 15-second performance';}
document.querySelectorAll('[data-kind]').forEach(button=>button.onclick=()=>{resumeCustom();kind=button.dataset.kind;state=kind==='listen'?'listening':'idle';phase=button.textContent;actionStart=performance.now()/1000;$('#reel').textContent='Play 15-second performance';});
$('#reel').onclick=play;$('#stop').onclick=stop;
$('#timeline').oninput=e=>seek(e.target.value);
$('#evil').oninput=()=>{if(mode!=='custom')stop();};
$('#talk').onchange=()=>{if(mode!=='custom'){resumeCustom();kind='';state='idle';phase='Speech rehearsal';$('#reel').textContent='Play 15-second performance';}};
function frame(now){
 const t=now/1000,dt=Math.min(.05,Math.max(0,(now-last)/1000));let params,evil;
 if(mode==='reel'||mode==='hold'){
  const seconds=mode==='hold'?heldAt:Math.min(REEL_DURATION,t-reelStart),sample=performanceFrame(seconds);
  params={...sample.params,dt};evil=sample.evil;phase=sample.phase;
  $('#timeline').value=seconds;$('#time').value=seconds.toFixed(1)+' / 15 s';$('#evil').value=Math.round(evil*100);
  if(mode==='reel'&&seconds===REEL_DURATION){stop();$('#reel').textContent='Replay performance';}
 }else{
  const speaking=$('#talk').checked,s=speaking?'speaking':state;
  params={clock:t-customClockOffset,dt,state:s,action:{kind,at:t-actionStart},mood:speaking?'amused':'neutral',jaw:speaking?.2+.6*Math.abs(Math.sin(t*6)):0,syncMode:'amplitude-fallback',blink:0,gaze:'audience',visible:1,motion:{float:80,gesture:100}};
  evil=$('#evil').value/100;
 }
 rig.render(params,evil);if(original?.ready&&$('main').classList.contains('compare'))original.render(params);
 last=now;$('#status').textContent=rig.error||phase+' · silent rehearsal; mouth motion is synthetic';
 frameHandle=requestAnimationFrame(frame);
}
frameHandle=requestAnimationFrame(frame);
window.WispPerformanceStudio={rig,inspect:()=>({...rig.inspect(),phase,mode,customResumeClock}),seek,play,stop};
window.addEventListener('pagehide',()=>{cancelAnimationFrame(frameHandle);rig.dispose();original?.rig.destroy();});
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
