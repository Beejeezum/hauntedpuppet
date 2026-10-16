// Diagnose signed triangle area in the actual painted arm meshes. Inversion is
// geometry evidence; texture alpha/occlusion must still be checked visually.
const area=(v,a,b,c)=>((v[b*2]-v[a*2])*(v[c*2+1]-v[a*2+1])-(v[b*2+1]-v[a*2+1])*(v[c*2]-v[a*2]))*.5;
export function auditMesh(rest,current,indices,uvs,alphaAt=null){
 let inverted=0,paintedInverted=0,collapsed=0,minimumRatio=Infinity;const examples=[];
 for(let k=0;k<indices.length;k+=3){
  const ids=[indices[k],indices[k+1],indices[k+2]],r=area(rest,...ids),q=area(current,...ids);
  if(Math.abs(r)<1e-7)continue;
  const ratio=q/r;minimumRatio=Math.min(minimumRatio,ratio);
  const uv=ids.map(i=>[uvs[i*2],uvs[i*2+1]]);
  const probes=[...uv,[(uv[0][0]+uv[1][0])/2,(uv[0][1]+uv[1][1])/2],[(uv[1][0]+uv[2][0])/2,(uv[1][1]+uv[2][1])/2],[(uv[2][0]+uv[0][0])/2,(uv[2][1]+uv[0][1])/2],[(uv[0][0]+uv[1][0]+uv[2][0])/3,(uv[0][1]+uv[1][1]+uv[2][1])/3]];
  const painted=alphaAt?probes.some(p=>alphaAt(...p)>8):null;
  if(ratio<-.001){inverted++;if(painted)paintedInverted++;}
  if(Math.abs(ratio)<.01)collapsed++;
  if(ratio<-.001&&(painted||!alphaAt)&&examples.length<12)examples.push({triangle:k/3,ratio,uv:ids.map(i=>[uvs[i*2],uvs[i*2+1]]),positions:ids.map(i=>[current[i*2],current[i*2+1]])});
 }
 return {triangles:indices.length/3,inverted,paintedInverted:alphaAt?paintedInverted:null,collapsed,minimumRatio,examples};
}
