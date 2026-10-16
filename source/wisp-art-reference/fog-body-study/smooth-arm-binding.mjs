// Alternative local binding pipeline: continuous distance-based bone influence,
// then ordinary linear skinning without spatially varying area compensation.
export function bindArmPointSmooth(x,y,joints){
 const lengths=[0,1,2].map(i=>Math.hypot(joints[i+1][0]-joints[i][0],joints[i+1][1]-joints[i][1]));
 const sigma=Math.max(1,Math.min(...lengths)*.28),distances=[];
 for(let i=0;i<3;i++){
  const [ax,ay]=joints[i],[bx,by]=joints[i+1],dx=bx-ax,dy=by-ay;
  const u=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/Math.max(1e-9,dx*dx+dy*dy)));
  distances.push((x-ax-u*dx)**2+(y-ay-u*dy)**2);
 }
 const minimum=Math.min(...distances),weights=distances.map(d=>Math.exp(-(d-minimum)/(2*sigma*sigma))),sum=weights.reduce((a,b)=>a+b,0);
 return weights.map(w=>w/sum);
}
export function skinArmPointLinear(x,y,weights,bones){
 let px=0,py=0;
 for(let i=0;i<3;i++){
  const b=bones[i],dx=x-b.source[0],dy=y-b.source[1],w=weights[i];
  px+=(b.target[0]+b.m00*dx+b.m01*dy)*w;
  py+=(b.target[1]+b.m10*dx+b.m11*dy)*w;
 }
 return[px,py];
}
