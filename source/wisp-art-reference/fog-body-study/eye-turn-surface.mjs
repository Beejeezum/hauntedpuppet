// Local painted-face projection experiment. A rounded face has two eye patches
// whose outward normals are offset from the front; the far patch passes behind
// the head before a profile. This is art direction, not a reconstructed 3D head.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function eyeTurnSurface(degrees,side){
 const yaw=clamp(Number.isFinite(degrees)?degrees:0,0,180);
 const angle=(yaw+(side==='right'?35:-35))*Math.PI/180;
 const projected=Math.cos(angle)/Math.cos(35*Math.PI/180);
 const u=clamp(projected/.25,0,1),visibility=u*u*(3-2*u);
 return {width:clamp(projected,.015,1.12),visibility};
}
