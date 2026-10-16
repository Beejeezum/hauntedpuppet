/** Artist-registered rest curve on bent-cupped-arm-left-v1.png (1536x1024).
 * Project only at load time; the generated painting is never repainted/resampled.
 * Registration is provisional and must be reviewed at silhouette/occlusion extremes.
 */
const control = [[1315,550],[1150,770],[850,745],[600,530]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
const unit=v=>{const n=Math.hypot(...v);return v.map(x=>x/n);};
function curve(t){const q=1-t;return[0,1].map(k=>q*q*q*control[0][k]+3*q*q*t*control[1][k]+3*q*t*t*control[2][k]+t*t*t*control[3][k]);}
const samples=Array.from({length:801},(_,i)=>curve(i/800));
const tangents=samples.map((p,i)=>unit(sub(samples[Math.min(800,i+1)],samples[Math.max(0,i-1)])));
export function bindBentPoint(x,y){
 const p=[x,y],before=dot(sub(p,samples[0]),tangents[0]),after=dot(sub(p,samples[800]),tangents[800]);
 let t,index,point,axis,best=Infinity;
 for(let i=0;i<=800;i++){const d=sub(p,samples[i]),distance=dot(d,d);if(distance<best){best=distance;index=i;}}
 axis=tangents[index];point=samples[index];t=index/800;
 // Extend only the closest endpoint: region heuristics create discontinuous cuts.
 if(index===800&&after>0)t=1+after/870;
 if(index===0&&before<0)t=before/870;
 const delta=sub(p,point),offset=dot(delta,[-axis[1],axis[0]]);
 return {x:320+t*870,y:497-offset,center:497};
}
