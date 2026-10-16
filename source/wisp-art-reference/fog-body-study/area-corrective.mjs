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
export const correctiveTimings=[],correctiveDiagnostics=[];
export const correctiveTotals={calls:0,unresolvedCalls:0,maximumRemaining:0,maximumSweeps:0};
export function resetCorrectiveMetrics(){correctiveTimings.length=0;correctiveDiagnostics.length=0;Object.assign(correctiveTotals,{calls:0,unresolvedCalls:0,maximumRemaining:0,maximumSweeps:0});}
export function correctAreas(p,constraints,iterations=256){
 const started=performance.now();let sweeps=0;
 for(;sweeps<iterations;sweeps++){
  let corrections=0;
  // Alternate traversal to avoid always propagating corrections in one direction.
  for(let k=0;k<constraints.length;k++){
   const q=constraints[sweeps%2?constraints.length-1-k:k],{a,b,c,sign,minimum}=q;
   const value=signed(p,a,b,c)*sign;if(value>=minimum*.995)continue;
   const ax=(p[b+1]-p[c+1])*.5*sign,ay=(p[c]-p[b])*.5*sign;
   const bx=(p[c+1]-p[a+1])*.5*sign,by=(p[a]-p[c])*.5*sign;
   const cx=(p[a+1]-p[b+1])*.5*sign,cy=(p[b]-p[a])*.5*sign;
   const denominator=ax*ax+ay*ay+bx*bx+by*by+cx*cx+cy*cy;
   if(denominator<1e-12)continue;
   const lambda=(minimum-value)/denominator;
   p[a]+=lambda*ax;p[a+1]+=lambda*ay;p[b]+=lambda*bx;p[b+1]+=lambda*by;p[c]+=lambda*cx;p[c+1]+=lambda*cy;corrections++;
  }
  if(!corrections){sweeps++;break;}
 }
 const remaining=constraints.reduce((n,q)=>n+(signed(p,q.a,q.b,q.c)*q.sign<=0?1:0),0);
 correctiveTotals.calls++;correctiveTotals.unresolvedCalls+=remaining?1:0;correctiveTotals.maximumRemaining=Math.max(correctiveTotals.maximumRemaining,remaining);correctiveTotals.maximumSweeps=Math.max(correctiveTotals.maximumSweeps,sweeps);
 correctiveTimings.push(performance.now()-started);if(correctiveTimings.length>256)correctiveTimings.shift();
 correctiveDiagnostics.push({sweeps,remaining});if(correctiveDiagnostics.length>256)correctiveDiagnostics.shift();
 return p;
}
