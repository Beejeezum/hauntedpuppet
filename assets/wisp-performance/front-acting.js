import {POSES} from './poses.js';
import {actionDuration} from '../wisp-choreography.js';
const fields=['head','chest','tail','left','right'];
const neutral=POSES[0],peak={head:[576,580],chest:[552,925],tail:[545,1370],left:[205,525],right:[900,1010],roll:-.055};
const wave=[
 {at:0,pose:neutral},
 {at:.24,pose:{head:[518,606],chest:[523,940],tail:[540,1380],left:[245,1010],right:[880,995],roll:.035}},
 {at:.67,flow:true,pose:{head:[552,580],chest:[540,925],tail:[540,1370],left:[230,750],right:[900,1010],roll:-.025}},
 {at:1.05,pose:peak},{at:1.78,pose:peak},
 {at:2.35,flow:true,pose:{head:[550,596],chest:[538,935],tail:[535,1375],left:[220,810],right:[890,1005],roll:-.01}},
 {at:2.8,pose:neutral}
];
function value(key,field,axis){return field==='roll'?key.pose.roll:key.pose[field][axis];}
function tangent(i,field,axis){if(!wave[i].flow)return 0;return(value(wave[i+1],field,axis)-value(wave[i-1],field,axis))/(wave[i+1].at-wave[i-1].at);}
/** Keys with flow tangents are breakdowns, not stops. Holds retain zero tangent. */
export function frontActingPose(base,p={}){
 const at=p.action?.at,duration=actionDuration('wave');
 if(p.reduced||p.action?.kind!=='wave'||!Number.isFinite(at)||at<0||at>duration)return base;
 const t=at/duration*2.8;let i=0;while(i<wave.length-2&&t>wave[i+1].at)i++;
 const a=wave[i],b=wave[i+1],span=b.at-a.at,u=Math.max(0,Math.min(1,(t-a.at)/span)),u2=u*u,u3=u2*u;
 const h00=2*u3-3*u2+1,h10=u3-2*u2+u,h01=-2*u3+3*u2,h11=u3-u2;
 const intensity=Math.max(0,Math.min(1.25,(p.motion?.gesture??100)/100)),out={};
 for(const field of [...fields,'roll']){
  const sample=axis=>{const n=field==='roll'?neutral.roll:neutral[field][axis],v=h00*value(a,field,axis)+h10*span*tangent(i,field,axis)+h01*value(b,field,axis)+h11*span*tangent(i+1,field,axis);return n+(v-n)*intensity;};
  out[field]=field==='roll'?sample(0):[sample(0),sample(1)];
 }
 return out;
}
