/** Deterministic character gaze. Eye intention leads the head; fixation replaces constant oscillation. */
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=v=>{v=clamp(v);return v*v*v*(v*(v*6-15)+10)};
const targets={center:[0,0,3],audience:[0,0,3],left:[-.68,.02,4],right:[.68,.02,4],down:[0,.6,1.5],up:[0,-.45,4]};
const beats=[[0,'center'],[2.35,'left'],[3.12,'center'],[6.7,'down'],[7.55,'center'],[10.8,'right'],[12.15,'center'],[15.4,'left'],[15.78,'center']];
function aim(t,state,gaze){if(gaze&&gaze!=='audience')return {target:targets[gaze]||targets.center,prior:targets.center,age:t};if(['listening','speaking','preparing'].includes(state))return{target:targets.center,prior:targets.center,age:t};const phase=t%18.7;let i=0;while(i<beats.length-1&&phase>=beats[i+1][0])i++;return{target:targets[beats[i][1]],prior:targets[beats[(i+beats.length-1)%beats.length][1]],age:phase-beats[i][0]};}
function sampleAim(t,state,gaze){const a=aim(t,state,gaze),distance=Math.hypot(a.target[0]-a.prior[0],a.target[1]-a.prior[1]),saccade=.055+distance*.045,q=smooth(a.age/saccade);return{x:a.prior[0]+(a.target[0]-a.prior[0])*q,y:a.prior[1]+(a.target[1]-a.prior[1])*q,z:a.target[2],fixating:a.age>=saccade,saccadeSeconds:saccade};}
function closure(t,offset=0){const phase=(t-offset+22.9)%22.9;for(const at of [2.28,6.62,10.72,16.9,17.23,21.4]){const age=phase-at;if(age>=0&&age<.22)return age<.055?smooth(age/.055):age<.085?1:1-smooth((age-.085)/.135);}return 0;}
export function eyeMechanics({clock=0,state='idle',gaze='audience',mood='neutral',blink=0,reduced=false,freeze=false}={}){
 const t=Number.isFinite(clock)?Math.max(0,clock):0,a=sampleAim(t,state,gaze),head=sampleAim(Math.max(0,t-.14),state,gaze),amount=freeze?0:reduced?.25:1;
 const convergence=clamp(.105/a.z,.012,.065),pupil=mood==='curious'?1.1:mood==='sinister'||mood==='angry'?.82:1;
 const eye=(side,delay)=>({x:clamp(a.x+side*convergence,-.8,.8)*amount,y:clamp(a.y,-.65,.65)*amount,blink:freeze?0:clamp(Math.max(clamp(blink),closure(t,delay))),upperFollow:a.y*.16*amount,lowerFollow:a.y*.07*amount,pupilScale:pupil,irisForeshorten:1-Math.abs(a.x)*.16});
 return{left:eye(1,0),right:eye(-1,.012),head:{x:head.x*.18*amount,y:head.y*.16*amount},fixating:a.fixating,saccadeSeconds:a.saccadeSeconds,source:'target-fixation-saccade-lid-follow',clock:t};
}
