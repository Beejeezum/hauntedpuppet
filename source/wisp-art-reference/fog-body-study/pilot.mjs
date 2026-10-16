import {WispPerformanceRuntime} from '/assets/wisp-performance-runtime.js';
import {SpiritAtmosphere} from '/assets/spirit-atmosphere.js';
import {SpiritFrame} from '/assets/spirit-frame.js';
import {createFogStudyKit} from './native-kit.mjs';
import {createNativeBodyMorph} from './front-form-morph.mjs';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const $=s=>document.querySelector(s),kit=await createFogStudyKit({pairedArms:true});
kit.createBodyViews=createNativeBodyMorph;kit.eyeMaterial=t=>{const u=Math.max(0,Math.min(1,(t-.4)/.6));return u*u*(3-2*u);};
const rig=await new WispPerformanceRuntime({frontKit:kit}).load();if(!rig.frontRig?.ready)throw Error(rig.frontError||rig.error);
const fog=await new SpiritAtmosphere().load(),framed=new SpiritFrame(),stage={x:0,y:0,scale:100,margin:15};$('#stage').append(framed.canvas);
let target=0,blend=0,velocity=0,talking=false,blackout=false,action='',actionAt=0,last=performance.now(),clock=0,handle=0,disposed=false,error=null;
const request=value=>{target=Math.max(0,Math.min(1,value));$('#form').value=target;};
for(const b of document.querySelectorAll('[data-form]'))b.onclick=()=>request(Number(b.dataset.form));
for(const b of document.querySelectorAll('[data-action]'))b.onclick=()=>{action=b.dataset.action;actionAt=clock;};
$('#form').oninput=e=>request(Number(e.target.value));
$('#talk').onclick=()=>{$('#talk').setAttribute('aria-pressed',String(talking=!talking));};
$('#blackout').onclick=()=>{$('#blackout').setAttribute('aria-pressed',String(blackout=!blackout));};
function frame(now){if(disposed)return;try{
 const dt=Math.min(.05,Math.max(.001,(now-last)/1000));last=now;clock+=dt;
 const w=9,offset=blend-target,b=velocity+w*offset,e=Math.exp(-w*dt);blend=target+(offset+b*dt)*e;velocity=(velocity-w*b*dt)*e;
 if(clock-actionAt>3.2)action='';const jaw=talking?.2+.6*Math.abs(Math.sin(clock*6)):0;
 const params={clock,dt,reduced:reduced.matches,state:talking?'speaking':'idle',action:{kind:action,at:clock-actionAt},mood:blend>.5?'angry':'amused',jaw,weights:talking?{A:jaw,O:(1-jaw)*.3}:{},gaze:'audience',visible:blackout?0:1,motion:{float:80,gesture:100}};
 rig.render(params,blend);const s=rig.inspect();framed.render(rig.canvas,fog,{clock,visible:params.visible,body:s.bounds,emissionPoints:s.emissionPoints,amount:.55,reduced:reduced.matches},stage);
 $('#status').textContent=blackout?'Blackout':`Live rehearsal · ${Math.round(blend*100)}% spooky`;
 }catch(e){error=e.message;$('#status').textContent='Rehearsal stopped: '+error;return;}handle=requestAnimationFrame(frame);}
handle=requestAnimationFrame(frame);
window.FogPilot={inspect:()=>({ready:rig.ready,blend,target,clock,talking,blackout,error,rig:rig.inspect(),frame:framed.inspect(),fog:fog.inspect()}),dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(handle);rig.dispose();fog.clear();framed.dispose();}};
window.addEventListener('pagehide',()=>window.FogPilot.dispose(),{once:true});
