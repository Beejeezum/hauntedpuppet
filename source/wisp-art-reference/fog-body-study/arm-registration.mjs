// Original piecewise-affine texture registration at rig-load time. The source
// PNG remains unchanged; the animation renderer receives a registered canvas.
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
export function triangulate(points){
 const p=points.map(x=>[...x]),n=p.length;let extent=1;for(const v of p)extent=Math.max(extent,Math.abs(v[0]),Math.abs(v[1]));p.push([-20*extent,-20*extent],[20*extent,-20*extent],[0,20*extent]);let tris=[[n,n+1,n+2]];
 const inside=(t,q)=>{const [a,b,c]=t.map(i=>p[i]),ax=a[0]-q[0],ay=a[1]-q[1],bx=b[0]-q[0],by=b[1]-q[1],cx=c[0]-q[0],cy=c[1]-q[1];const det=(ax*ax+ay*ay)*(bx*cy-by*cx)-(bx*bx+by*by)*(ax*cy-ay*cx)+(cx*cx+cy*cy)*(ax*by-ay*bx);return det*cross(a,b,c)>1e-7;};
 for(let i=0;i<n;i++){const bad=tris.filter(t=>inside(t,p[i])),edges=new Map();for(const t of bad)for(let j=0;j<3;j++){const a=t[j],b=t[(j+1)%3],key=[Math.min(a,b),Math.max(a,b)].join(':');if(edges.has(key))edges.delete(key);else edges.set(key,[a,b]);}tris=tris.filter(t=>!bad.includes(t));for(const [a,b]of edges.values())if(Math.abs(cross(p[a],p[b],p[i]))>1e-7)tris.push([a,b,i]);}
 return tris.filter(t=>t.every(i=>i<n));
}
export function affine(source,target){
 const [a,b,c]=source,[A,B,C]=target,x=b[0]-a[0],y=b[1]-a[1],u=c[0]-a[0],v=c[1]-a[1],det=x*v-y*u;if(Math.abs(det)<1e-8)throw Error('Degenerate registration triangle');
 const dx=B[0]-A[0],dy=B[1]-A[1],ex=C[0]-A[0],ey=C[1]-A[1],m00=(dx*v-ex*y)/det,m01=(ex*x-dx*u)/det,m10=(dy*v-ey*y)/det,m11=(ey*x-dy*u)/det;
 return[m00,m10,m01,m11,A[0]-m00*a[0]-m01*a[1],A[1]-m10*a[0]-m11*a[1]];
}
export function registerPainting(image,source,target){
 if(image.width!==1024||image.height!==1536||source.length!==target.length)throw Error('Unsupported arm registration source');
 const triangles=triangulate(target),canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1536;const ctx=canvas.getContext('2d');ctx.globalCompositeOperation='lighter';let minimumAreaRatio=Infinity;
 for(const triangle of triangles){const from=triangle.map(i=>source[i]),to=triangle.map(i=>target[i]),ratio=cross(...from)/cross(...to);if(ratio<=0)throw Error('Registration folds triangle '+triangle.join(','));minimumAreaRatio=Math.min(minimumAreaRatio,ratio);ctx.save();ctx.beginPath();ctx.moveTo(...to[0]);ctx.lineTo(...to[1]);ctx.lineTo(...to[2]);ctx.closePath();ctx.clip();ctx.setTransform(...affine(from,to));ctx.drawImage(image,0,0);ctx.restore();}
 canvas.registrationReport={triangles:triangles.length,minimumAreaRatio,landmarks:target.length};return canvas;
}
export const CUTE_POINTS=[[0,0],[1024,0],[1024,1536],[0,1536],[512,0],[1024,768],[512,1536],[0,768],[735,1020],[500,1000],[435,741],[428,605],[340,554],[272,507],[402,524],[381,422],[486,548],[522,477],[505,630],[601,631]];
export const EVIL_POINTS=[[0,0],[1024,0],[1024,1536],[0,1536],[512,0],[1024,768],[512,1536],[0,768],[830,1180],[510,1110],[450,790],[420,610],[290,560],[115,505],[400,520],[265,305],[500,540],[505,365],[530,640],[665,550]];
