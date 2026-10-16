// Local position-based signed-area corrective for painted triangles.
// This prevents local inside-out deformation; it does not guarantee global
// nonintersection, preserve anatomy or replace corrective pose artwork.
const signed=(p,a,b,c)=>((p[b]-p[a])*(p[c+1]-p[a+1])-(p[b+1]-p[a+1])*(p[c]-p[a]))*.5;
export function paintedAreaConstraints(g,image){
 const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
 const x=c.getContext('2d');x.drawImage(image,0,0);const d=x.getImageData(0,0,c.width,c.height).data;
 const alpha=(u,v)=>d[(Math.max(0,Math.min(c.height-1,Math.floor(v*c.height)))*c.width+Math.max(0,Math.min(c.width-1,Math.floor(u*c.width))))*4+3];
 const constraints=[];
 for(let k=0;k<g.indices.length;k+=3){const ids=[...g.indices.slice(k,k+3)],uv=ids.map(i=>[g.uvs[i*2],g.uvs[i*2+1]]);
  const probes=[...uv,[(uv[0][0]+uv[1][0])/2,(uv[0][1]+uv[1][1])/2],[(uv[1][0]+uv[2][0])/2,(uv[1][1]+uv[2][1])/2],[(uv[2][0]+uv[0][0])/2,(uv[2][1]+uv[0][1])/2],[(uv[0][0]+uv[1][0]+uv[2][0])/3,(uv[0][1]+uv[1][1]+uv[2][1])/3]];
  if(!probes.some(p=>alpha(...p)>8))continue;
  const [a,b,cc]=ids.map(i=>i*2),rest=signed(g.vertices,a,b,cc);
  if(Math.abs(rest)>1e-7)constraints.push({a,b,c:cc,sign:Math.sign(rest),minimum:Math.abs(rest)*.08});
 }
 return constraints;
}
export const correctiveTimings=[];
export function correctAreas(p,constraints,iterations=64){
 const started=performance.now();
 for(let iteration=0;iteration<iterations;iteration++)for(const q of constraints){
  const {a,b,c,sign,minimum}=q,value=signed(p,a,b,c)*sign;if(value>=minimum)continue;
  const gradients=[[(p[b+1]-p[c+1])*.5*sign,(p[c]-p[b])*.5*sign],[(p[c+1]-p[a+1])*.5*sign,(p[a]-p[c])*.5*sign],[(p[a+1]-p[b+1])*.5*sign,(p[b]-p[a])*.5*sign]];
  const denominator=gradients.reduce((s,g)=>s+g[0]*g[0]+g[1]*g[1],0);if(denominator<1e-12)continue;
  const lambda=(minimum-value)/denominator;
  [a,b,c].forEach((i,k)=>{p[i]+=lambda*gradients[k][0];p[i+1]+=lambda*gradients[k][1];});
 }
 correctiveTimings.push(performance.now()-started);if(correctiveTimings.length>256)correctiveTimings.shift();
 return p;
}
