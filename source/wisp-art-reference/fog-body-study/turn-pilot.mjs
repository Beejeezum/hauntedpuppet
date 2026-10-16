import {WispPerformanceRuntime} from '/assets/wisp-performance-runtime.js';
import {SpiritAtmosphere} from '/assets/spirit-atmosphere.js';
import {SpiritFrame} from '/assets/spirit-frame.js';
import {actionDuration} from '/assets/wisp-choreography.js';
import {createTurnStudyKit} from './turn-kit.mjs';
const events=new AbortController();
const $=s=>document.querySelector(s),reduced=matchMedia('(prefers-reduced-motion: reduce)');
let rig,fog,framed,handle=0,disposed=false,error=null,resumePending=false;
let formWanted=0,blend=0,velocity=0,yawWanted=0,talking=false,blackout=false,action='',actionAt=0,clock=0,last=performance.now(),returning=false;
const formRequest=value=>{formWanted=Math.max(0,Math.min(1,value));yawWanted=0;$('#yaw').value=0;$('#form').value=formWanted;};
const rest=()=>{action='';talking=false;$('#talk').setAttribute('aria-pressed','false');formRequest(0);};
function blank(){if(framed&&fog)framed.render(rig.canvas,fog,{clock,visible:0},{x:0,y:0,scale:100,margin:15});}
function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(handle);events.abort();$('#controls').disabled=true;rig?.dispose();fog?.clear();framed?.dispose();}
$('#retry').onclick=()=>location.reload();
try{
 rig=await new WispPerformanceRuntime({frontKit:await createTurnStudyKit()}).load();if(!rig.frontRig?.ready)throw Error(rig.frontError||rig.error);
 fog=await new SpiritAtmosphere().load();framed=new SpiritFrame();$('#stage').append(framed.canvas);$('#controls').disabled=false;last=performance.now();
 for(const b of document.querySelectorAll('[data-form]'))b.onclick=()=>formRequest(Number(b.dataset.form));
 for(const b of document.querySelectorAll('[data-action]'))b.onclick=()=>{action=b.dataset.action;actionAt=clock;};
 $('#form').oninput=e=>formRequest(Number(e.target.value));$('#yaw').oninput=e=>yawWanted=Number(e.target.value);
 $('#talk').onclick=()=>{$('#talk').setAttribute('aria-pressed',String(talking=!talking));};$('#rest').onclick=rest;
 $('#blackout').onclick=()=>{$('#blackout').setAttribute('aria-pressed',String(blackout=!blackout));};
 window.addEventListener('keydown',e=>{if(e.key==='Escape'){rest();blackout=true;$('#blackout').setAttribute('aria-pressed','true');}},{signal:events.signal});
 function frame(now){if(disposed)return;try{
  const dt=Math.max(.001,Math.min(.05,(now-last)/1000));last=now;clock+=dt;
  if(!rig.ready){resumePending=true;rest();$('#controls').disabled=true;blank();$('#status').textContent='Restoring Wisp…';handle=requestAnimationFrame(frame);return;}
  const previousAngle=rig.inspect().frontRig?.viewAngle||0;returning=Math.abs(formWanted-blend)>1e-6&&previousAngle>.0008;
  const target=returning?(blend>.5?1:0):formWanted,w=9,offset=blend-target,b=velocity+w*offset,e=Math.exp(-w*dt);blend=target+(offset+b*dt)*e;velocity=(velocity-w*b*dt)*e;
  const endpoint=(blend<1e-6||blend>1-1e-6)&&Math.abs(blend-formWanted)<1e-6;
  const yawTarget=reduced.matches||!endpoint?0:yawWanted;
  if(resumePending&&blend<1e-6&&previousAngle<.0008){resumePending=false;$('#controls').disabled=false;}
  const hidden=blackout||resumePending;
  $('#yaw').disabled=!endpoint||reduced.matches;
  if(action&&clock-actionAt>actionDuration(action))action='';const jaw=talking?.2+.6*Math.abs(Math.sin(clock*6)):0;
  rig.render({clock,dt,viewAngle:yawTarget,reduced:reduced.matches,state:talking?'speaking':'idle',syncMode:'synthetic-rehearsal',action:{kind:action,at:action?clock-actionAt:100},mood:blend>.5?'angry':'amused',jaw,weights:talking?{A:jaw,O:(1-jaw)*.3}:{},gaze:'audience',visible:hidden?0:1,motion:{float:80,gesture:100}},blend);
  const s=rig.inspect();framed.render(rig.canvas,fog,{clock,visible:hidden?0:1,body:s.bounds,emissionPoints:s.emissionPoints,amount:.55,reduced:reduced.matches},{x:0,y:0,scale:100,margin:15});
  $('#status').textContent=resumePending?'Restoring Wisp…':blackout?'Blackout':returning?'Turning toward you…':`Rehearsing · ${Math.round(blend*100)}% spooky${talking?' · silent speaking motion':''}`;
  handle=requestAnimationFrame(frame);
 }catch(e){error=e.message;blackout=true;rest();blank();dispose();$('#retry').hidden=false;$('#status').textContent='Rehearsal stopped: '+error;}}
 handle=requestAnimationFrame(frame);
 window.TurnPilot={inspect:()=>({ready:rig.ready,error,formWanted,blend,yawWanted,returning,action,talking,blackout,disposed,resumePending,graphicsRecoveryCount:rig.graphicsRecoveryCount||0,rig:rig.inspect(),frame:framed.inspect(),fog:fog.inspect()}),dispose,sourceCanvas:rig.canvas};
 window.addEventListener('pagehide',dispose,{once:true});
}catch(e){error=e.message;$('#status').textContent='Could not load Wisp: '+error;$('#retry').hidden=false;dispose();}
