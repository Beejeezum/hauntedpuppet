/** Similarity moving-least-squares cage for small deviations around an authored pose.
 * Preserves a global rotation/translation/uniform scale exactly; does not promise
 * injectivity for arbitrary folded targets. Validate painted triangles separately.
 */
export function bindPoseCage(anchors,point){
 if(anchors.length<2||anchors.some(p=>p.length!==2||!p.every(Number.isFinite))||point.length!==2||!point.every(Number.isFinite))throw Error('Invalid pose cage');
 const distances=anchors.map(p=>(p[0]-point[0])**2+(p[1]-point[1])**2),exact=distances.findIndex(d=>d<1e-12);
 if(exact>=0)return{exact,count:anchors.length};
 const weights=distances.map(d=>1/(d*d)),total=weights.reduce((a,b)=>a+b,0),center=[0,1].map(k=>anchors.reduce((v,p,i)=>v+p[k]*weights[i],0)/total),relative=anchors.map(p=>[p[0]-center[0],p[1]-center[1]]),metric=relative.reduce((v,p,i)=>v+weights[i]*(p[0]*p[0]+p[1]*p[1]),0);
 if(metric<1e-12)throw Error('Degenerate pose cage');
 return{count:anchors.length,weights,total,relative,metric,delta:[point[0]-center[0],point[1]-center[1]]};
}
export function mapPoseCage(binding,targets){
 if(targets.some(p=>p.length!==2||!p.every(Number.isFinite)))throw Error('Invalid pose targets');
 if(targets.length!==binding.count)throw Error('Pose cage target count mismatch');
 if(binding.exact!==undefined)return targets[binding.exact].slice();
 const {weights,total,relative,metric,delta}=binding,center=[0,1].map(k=>targets.reduce((v,p,i)=>v+p[k]*weights[i],0)/total);
 let a=0,b=0;for(let i=0;i<targets.length;i++){const p=relative[i],q=[targets[i][0]-center[0],targets[i][1]-center[1]];a+=weights[i]*(p[0]*q[0]+p[1]*q[1]);b+=weights[i]*(p[0]*q[1]-p[1]*q[0]);}
 return[center[0]+(a*delta[0]-b*delta[1])/metric,center[1]+(b*delta[0]+a*delta[1])/metric];
}
