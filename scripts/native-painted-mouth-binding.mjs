/** Private geometric binding; contours are measured candidates, not landmarks.
 * Every native body picture must be independently identified by the caller.
 */
const kernel=[.0027,.0214,.094,.231,.3018,.231,.094,.0214,.0027];
function smooth(values){return values.map((_,i)=>kernel.reduce((sum,w,j)=>{let at=i+j-4;while(at<0||at>=values.length)at=at<0?-at:2*values.length-2-at;return sum+w*values[at]},0));}
function sample(points,t){const q=t*(points.length-1),i=Math.floor(q),j=Math.min(i+1,points.length-1);return points[i].map((x,k)=>x+(points[j][k]-x)*(q-i));}
export function nativeBinding(mesh,frame){
 if(!mesh.lipRim||mesh.verticesPerPose!==96||!frame.valid||frame.upperInk.length!==frame.lowerInk.length||frame.upperInk.length<28)throw Error('Unexpected native mouth binding input');
 const up=smooth(frame.upperInk.map(p=>p[1])),lo=smooth(frame.lowerInk.map(p=>p[1]));
 const upper=Array.from({length:17},(_,i)=>sample(frame.upperInk.map((p,j)=>[p[0],up[j]]),i/16));
 const lower=Array.from({length:17},(_,i)=>sample(frame.lowerInk.map((p,j)=>[p[0],lo[j]]),i/16));
 upper[0]=upper[0].map((x,k)=>(x+lower[0][k])/2);upper[16]=upper[16].map((x,k)=>(x+lower[16][k])/2);
 const inner=[...upper,...lower.slice(1,-1).reverse()],rest=mesh.poses.rest;
 const sa=rest[64],sb=rest[80],na=inner[0],nb=inner[16],sx=sb[0]-sa[0],sy=sb[1]-sa[1],nx=nb[0]-na[0],ny=nb[1]-na[1],den=sx*sx+sy*sy;
 const a=(nx*sx+ny*sy)/den,b=(ny*sx-nx*sy)/den,tx=na[0]-a*sa[0]+b*sa[1],ty=na[1]-b*sa[0]-a*sa[1];
 if(![a,b,tx,ty].every(Number.isFinite)||Math.hypot(a,b)<30||Math.hypot(a,b)>150)throw Error('Native mouth similarity outside study bounds');
 const delta=p=>[a*p[0]-b*p[1],b*p[0]+a*p[1]],map=p=>{const v=delta(p);return[v[0]+tx,v[1]+ty]};
 const base=rest.map(map);
 for(let j=0;j<32;j++){base[64+j]=inner[j];const rim=delta(rest[32+j].map((x,k)=>x-rest[64+j][k]));base[32+j]=inner[j].map((x,k)=>x+rim[k]);}
 const poses=Object.fromEntries(Object.entries(mesh.poses).map(([key,points])=>[key,points.map((p,i)=>{const d=delta(p.map((x,k)=>x-rest[i][k]));return base[i].map((x,k)=>x+d[k]);})]));
 const left=frame.upperInk[0][0],right=frame.upperInk.at(-1)[0],top=Math.min(...up)-2,bottom=Math.max(...lo)+45;
 return{frame:frame.frame,confidence:frame.confidence,matrix:[a,b,-b,a,tx,ty],base,poses,clip:[left-8,top,right+8,bottom]};
}
export function triangleArea(vertices,triangle){const[a,b,c]=triangle.map(i=>vertices[i]);return(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);}
