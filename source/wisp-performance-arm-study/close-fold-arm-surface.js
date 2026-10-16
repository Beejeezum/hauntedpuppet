import {PaintedArmSurface} from './painted-arm-surface.js';
import {bindPoseCage,mapPoseCage} from './pose-cage.js';
import {bind,angles,bendDigit} from './digit-field.js';
const ANCHORS=[[900,340],[1050,850],[650,705],[430,620]];
function progress(p){let best=Infinity,result=0;for(let i=0;i<3;i++){const a=ANCHORS[i],b=ANCHORS[i+1],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy))),distance=(p[0]-a[0]-dx*t)**2+(p[1]-a[1]-dy*t)**2;if(distance<best){best=distance;result=(i+t)/2;}}return Math.min(1,result);}
/** Authored CLOSE pose pilot only. Unrestricted targets may fold; no numeric repair hides that. */
export class CloseFoldArmSurface extends PaintedArmSurface {
 async load(url,options={}){
  if(options.side!=='left')throw Error('Close-fold source is registered only for the left arm');
  await super.load(url,options);
  const uv=this.mesh.geometry.getBuffer('aUV').data,fields=[{root:[460,540],tip:[420,390],width:90},{root:[350,570],tip:[210,550],width:85},{root:[390,620],tip:[300,650],width:80},{root:[460,650],tip:[420,730],width:80}];
  this.poseBindings=this.bindings.map((_,i)=>{const point=[uv[i*2]*1254,uv[i*2+1]*1254];return{point,cage:bindPoseCage(ANCHORS,point),digits:bind(...point,fields)};});
  const weights=new Float32Array(this.poseBindings.map(b=>progress(b.point))),rear=[],front=[];
  for(let k=0;k<this.fullIndices.length;k+=3){const tri=Array.from(this.fullIndices.slice(k,k+3)),values=tri.map(i=>weights[i]);if(Math.min(...values)<.70)rear.push(...tri);if(Math.max(...values)>.08)front.push(...tri);}
  this.rearIndices=new Uint32Array(rear);this.frontIndices=new Uint32Array(front);
  for(const[mesh,indices]of[[this.mesh,this.rearIndices],[this.front,this.frontIndices]]){mesh.geometry.getBuffer('aFrontWeight').data=weights;mesh.geometry.indexBuffer.data=indices;}
  return this;
 }
 render(joints,clock,{energy=1,translucency=.9,frontAmount=1}={}){
  const digitAngles=angles(clock+1.7,energy),vertices=this.mesh.vertices;
  this.poseBindings.forEach((b,i)=>{const source=b.digits.length?bendDigit(...b.point,b.digits,digitAngles):b.point,cage=b.digits.length?bindPoseCage(ANCHORS,source):b.cage,p=mapPoseCage(cage,joints);vertices[i*2]=p[0];vertices[i*2+1]=p[1];});
  this.areaConstraint={maxCorrection:0,raw:true};
  const compact=frontAmount>=1;if(compact!==this.rearCompact){this.mesh.geometry.indexBuffer.shrinkToFit=false;this.mesh.geometry.indexBuffer.data=compact?this.rearIndices:this.fullIndices;this.rearCompact=compact;}
  this.mesh.geometry.getBuffer('aPosition').update();this.front.vertices.set(vertices);this.front.geometry.getBuffer('aPosition').update();
  for(const shader of[this.shader,this.frontShader]){shader.resources.spiritUniforms.uniforms.uSpiritTime=clock;shader.resources.spiritUniforms.uniforms.uSpiritStrength=translucency;shader.resources.morphUniforms.uniforms.uFrontAmount=frontAmount;}
 }
}
