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
const menace=[
 {at:0,pose:neutral},
 {at:.22,pose:{head:[526,630],chest:[526,965],tail:[530,1390],left:[260,1050],right:[800,1050],roll:.03}},
 {at:.34,flow:true,pose:{head:[526,600],chest:[526,935],tail:[535,1395],left:[150,950],right:[900,950],roll:0}},
 {at:.48,pose:{head:[526,560],chest:[526,900],tail:[530,1400],left:[175,680],right:[875,680],roll:-.025}},
 {at:.9,pose:{head:[536,570],chest:[526,910],tail:[540,1390],left:[185,700],right:[865,700],roll:.02}},
 {at:1.55,flow:true,pose:{head:[526,600],chest:[526,940],tail:[535,1380],left:[320,980],right:[735,980],roll:0}},
 {at:2.6,pose:neutral}
];
function tangent(track,i,field,axis){if(!track[i].flow)return 0;return(value(track[i+1],field,axis)-value(track[i-1],field,axis))/(track[i+1].at-track[i-1].at);}
function sampleTrack(track,t,intensity){
 let i=0;while(i<track.length-2&&t>track[i+1].at)i++;
 const a=track[i],b=track[i+1],span=b.at-a.at,u=Math.max(0,Math.min(1,(t-a.at)/span)),u2=u*u,u3=u2*u;
 const h00=2*u3-3*u2+1,h10=u3-2*u2+u,h01=-2*u3+3*u2,h11=u3-u2,out={};
 for(const field of [...fields,'roll']){
  const sample=axis=>{const n=field==='roll'?neutral.roll:neutral[field][axis],v=h00*value(a,field,axis)+h10*span*tangent(track,i,field,axis)+h01*value(b,field,axis)+h11*span*tangent(track,i+1,field,axis);return n+(v-n)*intensity;};
  out[field]=field==='roll'?sample(0):[sample(0),sample(1)];
 }
 return out;
}
/** Keys with flow tangents are breakdowns, not stops. Form changes blend joint targets. */
export function frontActingPose(base,p={}){
 const at=p.action?.at,kind=p.action?.kind,duration=actionDuration(kind);
 if(p.reduced||!Number.isFinite(at)||at<0||at>duration)return base;
 const intensity=Math.max(0,Math.min(1.25,(p.motion?.gesture??100)/100));
 if(kind==='wave')return sampleTrack(wave,at/duration*2.8,intensity);
 if(kind==='surprise'){
  const blend=Math.max(0,Math.min(1,p.evilBlend||0));if(!blend)return base;
  const target=sampleTrack(menace,at/duration*2.6,intensity),out={};
  for(const field of [...fields,'roll'])out[field]=field==='roll'?base.roll+(target.roll-base.roll)*blend:base[field].map((v,i)=>v+(target[field][i]-v)*blend);
  return out;
 }
 return base;
}
