/** Two-link cartoon arm solver and painted-surface skinning. No timers or rendering. */
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export const distance=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
export function solveArm(shoulder,palm,{upper,lower,hand,side,handAngle,maxStretch=1.75}){
 const finger=[Math.cos(handAngle)*hand,Math.sin(handAngle)*hand];
 const desired=[palm[0]-finger[0],palm[1]-finger[1]];
 let dx=desired[0]-shoulder[0],dy=desired[1]-shoulder[1],raw=Math.hypot(dx,dy);
 if(raw<1e-6){dx=side==='left'?-1:1;dy=0;raw=1e-6;}
 const ux=dx/Math.hypot(dx,dy),uy=dy/Math.hypot(dx,dy);
 // Stretch before the chain becomes straight, preserving a readable bent elbow.
 // In a tight fold, extend the shorter ghost segment instead of snapping wrist orientation.
 // The extension fades continuously as the wrist leaves the shoulder; both bones stay bounded.
 let a=upper,b=lower;if(a>b)b=clamp(a-raw*.98,b,lower*maxStretch);else a=clamp(b-raw*.98,a,upper*maxStretch);
 const shared=clamp(raw/((a+b)*.92),1,maxStretch);a=Math.min(upper*maxStretch,a*shared);b=Math.min(lower*maxStretch,b*shared);
 const upperStretch=a/upper,lowerStretch=b/lower,stretch=Math.max(upperStretch,lowerStretch);
 const d=clamp(raw,Math.abs(a-b)+.000001,(a+b)*.97),along=(a*a-b*b+d*d)/(2*d);
 const height=Math.sqrt(Math.max(0,a*a-along*along)),bend=side==='left'?-1:1;
 const elbow=[shoulder[0]+ux*along-uy*height*bend,shoulder[1]+uy*along+ux*height*bend];
 const wrist=[shoulder[0]+ux*d,shoulder[1]+uy*d],actualPalm=[wrist[0]+finger[0],wrist[1]+finger[1]];
 return{joints:[shoulder,elbow,wrist,actualPalm],stretch,upperStretch,lowerStretch,handAngle,reachError:distance(palm,actualPalm)};
}
export function boneTransform(a,b,c,d,{preserveVolume=true}={}){
 const length=Math.max(1e-6,distance(a,b)),targetLength=distance(c,d),sx=(b[0]-a[0])/length,sy=(b[1]-a[1])/length;
 const tx=(d[0]-c[0])/Math.max(1e-6,targetLength),ty=(d[1]-c[1])/Math.max(1e-6,targetLength);
 const scale=targetLength/length,width=preserveVolume?1/Math.sqrt(Math.max(.5,scale)):scale;
 return{source:a,target:c,sx,sy,tx,ty,scale,width,
  m00:tx*scale*sx+ty*width*sy,m01:tx*scale*sy-ty*width*sx,
  m10:ty*scale*sx-tx*width*sy,m11:ty*scale*sy+tx*width*sx};
}
export function transformPoint(x,y,bone){
 const dx=x-bone.source[0],dy=y-bone.source[1],along=(dx*bone.sx+dy*bone.sy)*bone.scale,across=(-dx*bone.sy+dy*bone.sx)*bone.width;
 return[bone.target[0]+along*bone.tx-across*bone.ty,bone.target[1]+along*bone.ty+across*bone.tx];
}
export function bindArmPoint(x,y,joints){
 let best=Infinity,position=0;
 for(let i=0;i<3;i++){
  const a=joints[i],b=joints[i+1],dx=b[0]-a[0],dy=b[1]-a[1],u=clamp(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy));
  const d=(x-a[0]-dx*u)**2+(y-a[1]-dy*u)**2;
  if(d<best){best=d;position=i+u;}
 }
 if(position<.8)return[1,0,0];
 if(position<1.2){const t=smooth((position-.8)/.4);return[1-t,t,0];}
 if(position<1.8)return[0,1,0];
 if(position<2.2){const t=smooth((position-1.8)/.4);return[0,1-t,t];}
 return[0,0,1];
}
export function skinArmPoint(x,y,weights,bones){
 let px=0,py=0,a=0,b=0,c=0,d=0,area=0,count=0,last=0;
 for(let i=0;i<3;i++){
  const w=weights[i];if(!w)continue;const bone=bones[i],dx=x-bone.source[0],dy=y-bone.source[1];
  px+=(bone.target[0]+bone.m00*dx+bone.m01*dy)*w;py+=(bone.target[1]+bone.m10*dx+bone.m11*dy)*w;
  a+=bone.m00*w;b+=bone.m01*w;c+=bone.m10*w;d+=bone.m11*w;area+=bone.scale*bone.width*w;count++;last=i;
 }
 if(count>1&&area>1e-9){
  // Adjacent transforms share this joint. Compensate bounded blend-area loss
  // around that exact anchor instead of allowing the painted elbow to pinch.
  const anchor=bones[last].target,det=Math.abs(a*d-b*c),gain=Math.max(1,Math.sqrt(area/Math.max(area/(1.35*1.35),det)));
  px=anchor[0]+(px-anchor[0])*gain;py=anchor[1]+(py-anchor[1])*gain;
 }
 return[px,py];
}
