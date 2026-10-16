import * as THREE from './vendor/three/three.module.js';
/** Conservative LBS/morph envelope, grouped by rest-space cell and influence bins.
 * No vertex sampling or changes to the mesh/rig. Rebuild after geometry, morph data or skin weights change.
 * Weighted rest offsets and morph intervals retain all nonzero influences.
 */
export class SkinnedEnvelopeBounds {
 constructor(root,{cellSize=.18,weightBins=8}={}){
  this.entries=[];this.fallback=[];this.box=new THREE.Box3();this.reference=new Float64Array(3);this.low=new Float64Array(3);this.high=new Float64Array(3);this.buildMs=performance.now();
  root.traverse(mesh=>{
   if(!mesh.isMesh)return;
   const geometry=mesh.geometry,p=geometry.attributes.position,si=geometry.attributes.skinIndex,sw=geometry.attributes.skinWeight;
   if(!mesh.isSkinnedMesh||!p||!si||!sw){this.fallback.push(mesh);return;}
   const morph=geometry.morphAttributes.position||[],groups=new Map(),used=new Map();
   for(let vertex=0;vertex<p.count;vertex++){
    const point=[p.getX(vertex),p.getY(vertex),p.getZ(vertex)],influences=[];
    for(let k=0;k<4;k++){const weight=sw.getComponent(vertex,k);if(weight>0)influences.push([si.getComponent(vertex,k),weight]);}
    influences.sort((a,b)=>a[0]-b[0]);
    const key=point.map(x=>Math.floor(x/cellSize)).join(',')+'|'+influences.map(([i,w])=>i+':'+Math.floor(w*weightBins)).join(',');
    let group=groups.get(key);
    if(!group){
     const n=influences.length;group={center:point,joints:influences.map(x=>x[0]),min:new Float64Array(n*3).fill(Infinity),max:new Float64Array(n*3).fill(-Infinity),wmin:new Float64Array(n).fill(Infinity),wmax:new Float64Array(n).fill(-Infinity),sumMin:Infinity,sumMax:-Infinity,mmin:new Float64Array(morph.length*n*3).fill(Infinity),mmax:new Float64Array(morph.length*n*3).fill(-Infinity)};
     groups.set(key,group);for(const[index]of influences)if(!used.has(index))used.set(index,new THREE.Matrix4());
    }
    const sum=influences.reduce((n,x)=>n+x[1],0);group.sumMin=Math.min(group.sumMin,sum);group.sumMax=Math.max(group.sumMax,sum);
    influences.forEach(([joint,weight],i)=>{
     group.wmin[i]=Math.min(group.wmin[i],weight);group.wmax[i]=Math.max(group.wmax[i],weight);
     for(let axis=0;axis<3;axis++){
      const at=i*3+axis,value=weight*(point[axis]-group.center[axis]);group.min[at]=Math.min(group.min[at],value);group.max[at]=Math.max(group.max[at],value);
      morph.forEach((attribute,m)=>{const delta=attribute.getComponent(vertex,axis)-(geometry.morphTargetsRelative?0:point[axis]),index=m*influences.length*3+at,value=delta*weight;group.mmin[index]=Math.min(group.mmin[index],value);group.mmax[index]=Math.max(group.mmax[index],value);});
     }
    });
   }
   this.entries.push({mesh,groups:[...groups.values()],matrices:used,morphCount:morph.length,bindWorld:new THREE.Matrix4(),box:new THREE.Box3()});
  });
  this.buildMs=performance.now()-this.buildMs;
 }
 update(target){
  target.makeEmpty();
  for(const entry of this.entries){
   const{mesh,groups,matrices,box,morphCount}=entry;
   const bindWorld=entry.bindWorld.multiplyMatrices(mesh.matrixWorld,mesh.bindMatrixInverse);
   for(const[index,matrix]of matrices)matrix.copy(bindWorld).multiply(mesh.skeleton.bones[index].matrixWorld).multiply(mesh.skeleton.boneInverses[index]).multiply(mesh.bindMatrix);
   let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
   for(const g of groups){
    const ref=matrices.get(g.joints[0]).elements,c=g.center,reference=this.reference,lo=this.low,hi=this.high;
    for(let axis=0;axis<3;axis++){const value=ref[axis]*c[0]+ref[4+axis]*c[1]+ref[8+axis]*c[2]+ref[12+axis];reference[axis]=value;lo[axis]=Math.min(value*g.sumMin,value*g.sumMax);hi[axis]=Math.max(value*g.sumMin,value*g.sumMax);}
    for(let i=0;i<g.joints.length;i++){
     const matrix=matrices.get(g.joints[i]).elements;
     if(i)for(let axis=0;axis<3;axis++){const delta=matrix[axis]*c[0]+matrix[4+axis]*c[1]+matrix[8+axis]*c[2]+matrix[12+axis]-reference[axis];lo[axis]+=delta*(delta<0?g.wmax[i]:g.wmin[i]);hi[axis]+=delta*(delta<0?g.wmin[i]:g.wmax[i]);}
     for(let k=0;k<3;k++){
      let low=g.min[i*3+k],high=g.max[i*3+k];
      for(let m=0;m<morphCount;m++){const weight=mesh.morphTargetInfluences?.[m]||0,at=m*g.joints.length*3+i*3+k;low+=weight*(weight<0?g.mmax[at]:g.mmin[at]);high+=weight*(weight<0?g.mmin[at]:g.mmax[at]);}
      for(let axis=0;axis<3;axis++){const value=matrix[k*4+axis];lo[axis]+=value*(value<0?high:low);hi[axis]+=value*(value<0?low:high);}
     }
    }
    // The combined world/bind frame avoids an extra rotated-AABB expansion.
    // CPU adds the common frame translation once, GPU adds world translation
    // once after skinning; cover both paths when weights sum imperfectly.
    const error=Math.max(Math.abs(1-g.sumMin),Math.abs(1-g.sumMax)),common=bindWorld.elements,world=mesh.matrixWorld.elements;
    for(let axis=0;axis<3;axis++){const padding=Math.max(Math.abs(common[12+axis]),Math.abs(world[12+axis]))*error+1e-5;lo[axis]-=padding;hi[axis]+=padding;}
    minX=Math.min(minX,lo[0]);minY=Math.min(minY,lo[1]);minZ=Math.min(minZ,lo[2]);maxX=Math.max(maxX,hi[0]);maxY=Math.max(maxY,hi[1]);maxZ=Math.max(maxZ,hi[2]);
   }
   box.min.set(minX,minY,minZ);box.max.set(maxX,maxY,maxZ);target.union(box);
  }
  for(const mesh of this.fallback)target.union(this.box.setFromObject(mesh,true));
  return target;
 }
 inspect(){return{meshes:this.entries.length,groups:this.entries.reduce((n,e)=>n+e.groups.length,0),fallback:this.fallback.length,buildMs:this.buildMs};}
 dispose(){this.entries.length=0;this.fallback.length=0;}
}
