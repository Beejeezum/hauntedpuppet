/** Experimental 2D joint-centered polar blend; not dual quaternion skinning.
 * Blend rotation separately from positive stretch to avoid matrix cancellation.
 * Only adjacent influences are supported by the painted-arm binding contract.
 */
export function skinArmPointPolar(x,y,weights,bones){
 const active=[];let total=0;
 for(let i=0;i<weights.length;i++)if(weights[i]>0){active.push(i);total+=weights[i];}
 if(!active.length||!(total>0))throw Error('Missing arm influences');
 if(active.length===1){const b=bones[active[0]],dx=x-b.source[0],dy=y-b.source[1];return[b.target[0]+b.m00*dx+b.m01*dy,b.target[1]+b.m10*dx+b.m11*dy];}
 if(active.length!==2||active[1]!==active[0]+1)throw Error('Polar arm blend requires adjacent bones');
 const first=bones[active[0]],last=bones[active[1]],anchor=last.source,target=last.target;
 const angle=b=>Math.atan2(b.ty,b.tx)-Math.atan2(b.sy,b.sx);
 const a=angle(first),delta=Math.atan2(Math.sin(angle(last)-a),Math.cos(angle(last)-a));
 const t=weights[active[1]]/total,theta=a+t*delta,c=Math.cos(theta),s=Math.sin(theta);
 let xx=0,xy=0,yy=0;
 for(const i of active){const b=bones[i],w=weights[i]/total;
  xx+=w*(b.scale*b.sx*b.sx+b.width*b.sy*b.sy);
  xy+=w*(b.scale-b.width)*b.sx*b.sy;
  yy+=w*(b.scale*b.sy*b.sy+b.width*b.sx*b.sx);
 }
 const dx=x-anchor[0],dy=y-anchor[1],u=xx*dx+xy*dy,v=xy*dx+yy*dy;
 return[target[0]+c*u-s*v,target[1]+s*u+c*v];
}
