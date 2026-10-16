import {WispPerformanceRuntime} from '../../assets/wisp-performance-runtime.js';
import {PaintedArmSurface} from './painted-arm-surface.js';
const r=await new WispPerformanceRuntime().load();if(!r.frontRig?.ready)throw Error(r.frontError||r.error);
const arm=await new PaintedArmSurface(r.P).load('./continuous-arm-v1.png');r.frontRig.container.addChildAt(arm.mesh,0);r.frontRig.container.addChild(arm.front);document.querySelector('#surface').append(r.canvas);
let clock=0,last=performance.now(),playing=true,candidate=true,kind='wave',cueAt=0,disposed=false,frameId=null;
document.querySelector('#toggle').onclick=e=>{candidate=!candidate;e.target.textContent=candidate?'Show original arm':'Show candidate arm'};document.querySelector('#pause').onclick=e=>{playing=!playing;e.target.textContent=playing?'Pause':'Play'};document.querySelectorAll('[data-cue]').forEach(b=>b.onclick=()=>{kind=b.dataset.cue;cueAt=clock});
function render(now){if(disposed)return;if(playing)clock+=Math.min(.04,(now-last)/1000);last=now;const at=clock-cueAt;r.render({clock,dt:1/60,state:'idle',action:{kind,at}},0);const old=r.frontRig.arms.find(a=>a.side==='right');old.mesh.visible=old.front.visible=!candidate;arm.mesh.visible=arm.front.visible=candidate;if(candidate)arm.render(r.frontRig.current.arms.right.joints,clock);r.app.render();frameId=requestAnimationFrame(render);}frameId=requestAnimationFrame(render);
window.addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(frameId);arm.destroy();r.dispose()},{once:true});
