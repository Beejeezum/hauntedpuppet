/** Private monotone inverse skin warp. Original native paint stays the source.
 * Geometry only; not a renderer, face tracker or accepted character asset.
 */
export function lipCurves(vertices){return{upper:Array.from({length:17},(_,i)=>vertices[64+i]),lower:Array.from({length:17},(_,i)=>vertices[64+(i===0?0:i===16?16:32-i)])};}
export function scanlineLips(vertices){
 const polygon=vertices.slice(64,96),xs=[...new Set(polygon.map(p=>p[0]))].sort((a,b)=>a-b),upper=[],lower=[];
 for(const x of xs){const hits=[];for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],dx=b[0]-a[0];if(Math.abs(dx)<1e-9){if(Math.abs(x-a[0])<1e-8)hits.push(a[1],b[1]);}else if(x>=Math.min(a[0],b[0])-1e-9&&x<=Math.max(a[0],b[0])+1e-9)hits.push(a[1]+(x-a[0])*(b[1]-a[1])/dx);}
  hits.sort((a,b)=>a-b);const ys=hits.filter((y,i)=>i===0||Math.abs(y-hits[i-1])>1e-7);if(!ys.length||ys.length>2)throw Error('Mouth silhouette has multiple vertical spans');upper.push([x,ys[0]]);lower.push([x,ys.at(-1)]);
 }return{upper,lower};
}
export function curveY(points,x){if(x<=points[0][0])return points[0][1];if(x>=points.at(-1)[0])return points.at(-1)[1];for(let i=1;i<points.length;i++)if(x<=points[i][0]){const a=points[i-1],b=points[i],t=(x-a[0])/(b[0]-a[0]);return a[1]+t*(b[1]-a[1]);}throw Error('Invalid lip curve');}
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
export function prepareInverseWarp(binding,weights){
 if(weights.length!==4||weights.some(x=>!Number.isFinite(x)||x<0||x>1)||Math.abs(weights.reduce((s,x)=>s+x,0)-1)>1e-6)throw Error('Invalid mouth weights');
 const [a,b,,,tx,ty]=binding.matrix,den=a*a+b*b,angle=binding.referenceEyeAngle;if(!Number.isFinite(angle))throw Error('Missing reference coordinate plane');const co=Math.cos(angle),si=Math.sin(angle);
 const toLocal=([x,y])=>{const hx=(a*(x-tx)+b*(y-ty))/den,hy=(-b*(x-tx)+a*(y-ty))/den;return[100*(co*hx-si*hy),100*(si*hx+co*hy)]};
 const toWorld=([x,y])=>{const hx=(co*x+si*y)/100,hy=(-si*x+co*y)/100;return[a*hx-b*hy+tx,b*hx+a*hy+ty]};
 const poses=Object.values(binding.poses).map(v=>v.map(toLocal)),vertices=poses[0].map((_,i)=>[0,1].map(k=>weights.reduce((s,w,j)=>s+w*poses[j][i][k],0))),source=scanlineLips(binding.base.map(toLocal)),target=scanlineLips(vertices);
 for(const curve of [source.upper,source.lower,target.upper,target.lower])for(let i=1;i<curve.length;i++)if(curve[i][0]-curve[i-1][0]<=1e-6)throw Error('Lip x controls not strictly ordered');
 const all=poses.flatMap(v=>{const p=lipCurves(v);return[...p.upper,...p.lower]});
 const clip=[Math.min(...all.map(p=>p[0]))-8,Math.min(...all.map(p=>p[1]))-4,Math.max(...all.map(p=>p[0]))+8,Math.max(...all.map(p=>p[1]))+10];
 const sl=source.upper[0][0],sr=source.upper.at(-1)[0],tl=target.upper[0][0],tr=target.upper.at(-1)[0];
 for(let j=0;j<=64;j++){const x=tl+(tr-tl)*j/64;if(curveY(target.lower,x)<curveY(target.upper,x)-1e-6)throw Error('Crossed target lips');}
 const bandTop=Math.min(...source.upper.map(p=>p[1]))-1,bandBottom=Math.max(...source.lower.map(p=>p[1]))+1;
 const mapLocal=([x,y])=>{
  if(x<=clip[0]||x>=clip[2]||y<=clip[1]||y>=clip[3])return[x,y];
  const sx=x<tl?clip[0]+(x-clip[0])*(sl-clip[0])/(tl-clip[0]):x>tr?sr+(x-tr)*(clip[2]-sr)/(clip[2]-tr):sl+(x-tl)*(sr-sl)/(tr-tl);
  const su=curveY(source.upper,sx),sd=curveY(source.lower,sx),tu=curveY(target.upper,x),td=curveY(target.lower,x);
  let sy;if(y<=tu)sy=clip[1]+(y-clip[1])*(su-clip[1])/(tu-clip[1]);else if(y>=td)sy=sd+(y-td)*(clip[3]-sd)/(clip[3]-td);else sy=su+(y-tu)*(sd-su)/Math.max(1e-8,td-tu);
  const side=x<tl?smooth((x-clip[0])/(tl-clip[0])):x>tr?smooth((clip[2]-x)/(clip[2]-tr)):1;
  const mappedY=y+(sy-y)*side;
  // Compose vertical mapping with an x-monotone horizontal map. Let the
  // horizontal fade depend on mappedY, not original y: the composition retains
  // a positive determinant and returns continuously to identity at all edges.
  const horizontal=mappedY<bandTop?smooth((mappedY-clip[1])/(bandTop-clip[1])):mappedY>bandBottom?smooth((clip[3]-mappedY)/(clip[3]-bandBottom)):1;
  return[x+(sx-x)*horizontal,mappedY];
 };
 const map=p=>toWorld(mapLocal(toLocal(p)));return{map,mapLocal,toLocal,toWorld,clip,source,target,vertices};
}
