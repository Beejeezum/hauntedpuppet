// Painting-led joint transition planes, not nearest-segment assignment.
// The two tangent bisectors define explicit elbow/wrist regions in rest space.
export {skinArmPointLinear} from './smooth-arm-binding.mjs';
const unit=(a,b)=>{const x=b[0]-a[0],y=b[1]-a[1],d=Math.hypot(x,y)||1;return[x/d,y/d,d];};
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function bindArmJointZones(x,y,joints){
 const blend=i=>{
  const a=unit(joints[i-1],joints[i]),b=unit(joints[i],joints[i+1]);
  let nx=a[0]+b[0],ny=a[1]+b[1],n=Math.hypot(nx,ny);
  if(n<1e-6){nx=b[0];ny=b[1];n=1;}
  const signed=((x-joints[i][0])*nx+(y-joints[i][1])*ny)/n;
  const halfWidth=Math.min(a[2],b[2])*.28;
  return smooth(.5+signed/(2*Math.max(1,halfWidth)));
 };
 const elbow=blend(1),wrist=blend(2),weights=[1-elbow,elbow*(1-wrist),elbow*wrist];
 return weights;
}
