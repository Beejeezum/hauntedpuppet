import {PaintedArmSurface} from './painted-arm-surface.js';
import {bindBentPoint} from './bent-painting-bind.js';
import {bind} from './digit-field.js';
/** Local left corrective pilot. No evil correspondence or production adoption. */
export class CuppedArmSurface extends PaintedArmSurface {
 async load(url,options={}) {
  if(options.side!=='left')throw Error('This painting is registered only for the left arm');
  await super.load(url,options);
  const uv=this.mesh.geometry.getBuffer('aUV').data;
  const fields=[
   {root:[470,410],tip:[400,200],width:90},
   {root:[380,445],tip:[170,370],width:85},
   {root:[360,505],tip:[230,550],width:80},
   {root:[430,510],tip:[405,610],width:80}
  ].map(d=>{const a=bindBentPoint(...d.root),b=bindBentPoint(...d.tip);return{...d,root:[a.x,a.y],tip:[b.x,b.y]};});
  this.bindings=this.bindings.map((_,i)=>{const p=bindBentPoint(uv[i*2]*1536,uv[i*2+1]*1024);return{...p,digits:bind(p.x,p.y,fields)};});
  const weights=new Float32Array(this.bindings.map(p=>Math.max(0,Math.min(1,(p.x-320)/870)))),rear=[],front=[];
  for(let k=0;k<this.fullIndices.length;k+=3){const tri=Array.from(this.fullIndices.slice(k,k+3)),values=tri.map(i=>weights[i]);if(Math.min(...values)<.70)rear.push(...tri);if(Math.max(...values)>.08)front.push(...tri);}
  this.rearIndices=new Uint32Array(rear);this.frontIndices=new Uint32Array(front);
  for(const [mesh,indices]of [[this.mesh,this.rearIndices],[this.front,this.frontIndices]]){mesh.geometry.getBuffer('aFrontWeight').data=weights;mesh.geometry.indexBuffer.data=indices;}
  return this;
 }
}
