/** Small position-based area constraint for the experimental painted surface.
 * Prevents local inverted triangles; does not establish volume or global nonintersection.
 */
export function constrainAreas(vertices,indices,{minimum=.02,maxIterations=128}={}){
 const original=vertices.slice();let iterations=0,minArea=Infinity,remaining=0;
 for(;iterations<maxIterations;iterations++){
  let repairs=0;
  for(let k=0;k<indices.length;k+=3){const a=indices[k]*2,b=indices[k+1]*2,c=indices[k+2]*2,ax=vertices[a],ay=vertices[a+1],bx=vertices[b],by=vertices[b+1],cx=vertices[c],cy=vertices[c+1],area=(bx-ax)*(cy-ay)-(by-ay)*(cx-ax);if(area>=minimum)continue;
   const g=[by-cy,cx-bx,cy-ay,ax-cx,ay-by,bx-ax],den=g.reduce((n,x)=>n+x*x,0);if(den<1e-12)continue;const lambda=(minimum-area)/den;for(let i=0;i<3;i++){const at=[a,b,c][i];vertices[at]+=lambda*g[i*2];vertices[at+1]+=lambda*g[i*2+1];}repairs++;
  }if(!repairs)break;
 }
 for(let k=0;k<indices.length;k+=3){const a=indices[k]*2,b=indices[k+1]*2,c=indices[k+2]*2,area=(vertices[b]-vertices[a])*(vertices[c+1]-vertices[a+1])-(vertices[b+1]-vertices[a+1])*(vertices[c]-vertices[a]);minArea=Math.min(minArea,area);if(area<=0)remaining++;}
 let maxCorrection=0;for(let k=0;k<vertices.length;k+=2)maxCorrection=Math.max(maxCorrection,Math.hypot(vertices[k]-original[k],vertices[k+1]-original[k+1]));return{iterations,minArea,remaining,maxCorrection};
}
