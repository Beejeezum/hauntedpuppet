import {sampledSpine} from './sampled-spine.js';
import {constrainAreas} from './mesh-area.js';
import {paintMorphShader} from '../../assets/wisp-performance/paint-morph-shader.js';
import {bind,angles,bendDigit} from './digit-field.js';
function unit(a,b){const x=b[0]-a[0],y=b[1]-a[1],l=Math.hypot(x,y);return[x/l,y/l]}
// Compress cartoon limb lengths in close poses instead of creating a long hairpin elbow.
function artElbow(s,e,w){const upper=Math.hypot(e[0]-s[0],e[1]-s[1]),lower=Math.hypot(w[0]-e[0],w[1]-e[1]),distance=Math.max(.001,Math.hypot(w[0]-s[0],w[1]-s[1])),minimumReach=Math.sqrt(upper*upper+lower*lower+2*upper*lower*Math.cos(110*Math.PI/180)),ratio=distance/Math.max(.001,minimumReach),q=Math.max(0,Math.min(1,(ratio-.8)/.4)),scale=ratio<.8?ratio:ratio>1.2?1:.8+.4*q-.2*q*q,a=upper*scale,b=lower*scale,along=(a*a-b*b+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,a*a-along*along)),dir=unit(s,w),cross=(w[0]-s[0])*(e[1]-s[1])-(w[1]-s[1])*(e[0]-s[0]),sign=cross<0?-1:1;return[s[0]+dir[0]*along-dir[1]*height*sign,s[1]+dir[1]*along+dir[0]*height*sign];}
function hermite(a,b,ta,tb,t){const t2=t*t,t3=t2*t,t4=t3*t,t5=t4*t;return[0,1].map(k=>(1-10*t3+15*t4-6*t5)*a[k]+(t-6*t3+8*t4-3*t5)*ta[k]+(10*t3-15*t4+6*t5)*b[k]+(-4*t3+7*t4-3*t5)*tb[k])}
function path(s,e,w,t,palm=w){
 const upper=Math.hypot(e[0]-s[0],e[1]-s[1]),lower=Math.hypot(w[0]-e[0],w[1]-e[1]),middle=unit(s,w),first=unit(s,e),fore=unit(e,w),foreAngle=Math.atan2(fore[1],fore[0]),target=Math.hypot(palm[0]-w[0],palm[1]-w[1])>.001?Math.atan2(palm[1]-w[1],palm[0]-w[0]):foreAngle,delta=Math.atan2(Math.sin(target-foreAngle),Math.cos(target-foreAngle)),wristAngle=foreAngle+Math.tanh(delta),last=[Math.cos(wristAngle),Math.sin(wristAngle)],tangent=middle.map(x=>x*Math.min((upper+lower)/2,Math.min(upper,lower)*2));
 if(t<0)return s.map((x,k)=>x+first[k]*t*235);if(t>1)return w.map((x,k)=>x+last[k]*(t-1)*235);return t<=.5?hermite(s,e,first.map(x=>x*117.5),tangent,t*2):hermite(e,w,tangent,last.map(x=>x*117.5),(t-.5)*2);
}


/** Local candidate only. Same artwork and mesh used by isolated and full-character comparisons. */
export class PaintedArmSurface{
 constructor(P){this.P=P;}
 async load(url,{side='right'}={}){
  this.side=side;const image=new Image();image.src=url;await image.decode();
  const scan=document.createElement('canvas');scan.width=image.width;scan.height=image.height;
  const ctx=scan.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const rgba=ctx.getImageData(0,0,scan.width,scan.height).data;
  const v=[],uv=[],ix=[],lookup=new Map(),cols=192,rows=72;this.bindings=[];
  const vertex=(x,y)=>{const key=y*(cols+1)+x;if(lookup.has(key))return lookup.get(key);const index=this.bindings.length,rawX=(side==='left'?1-x/cols:x/cols)*1774,px=side==='left'?320+(rawX-230)*870/960:rawX,py=y/rows*887;this.bindings.push({x:px,y:py,digits:bind(px,py)});v.push(0,0);uv.push(x/cols,y/rows);lookup.set(key,index);return index;};
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
   let ink=false;const left=Math.max(0,Math.floor(x/cols*image.width)-2),right=Math.min(image.width,Math.ceil((x+1)/cols*image.width)+2),top=Math.max(0,Math.floor(y/rows*image.height)-2),bottom=Math.min(image.height,Math.ceil((y+1)/rows*image.height)+2);
   for(let yy=top;yy<bottom&&!ink;yy++)for(let xx=left;xx<right;xx++)if(rgba[(yy*image.width+xx)*4+3]>1){ink=true;break;}
   if(!ink)continue;const a=vertex(x,y),b=vertex(x+1,y),c=vertex(x,y+1),d=vertex(x+1,y+1);ix.push(a,b,d,a,d,c);
  }
  scan.width=scan.height=0;this.texture=this.P.Texture.from(image);
  const g={vertices:new Float32Array(v),uvs:new Float32Array(uv),indices:new Uint32Array(ix)},weights=new Float32Array(this.bindings.map(b=>Math.max(0,Math.min(1,(b.x-320)/870))));
  this.shader=paintMorphShader(this.P,this.texture,this.texture);this.frontShader=paintMorphShader(this.P,this.texture,this.texture,true);
  this.mesh=new this.P.MeshSimple({texture:this.texture,shader:this.shader,...g});this.front=new this.P.MeshSimple({texture:this.texture,shader:this.frontShader,...g});
  for(const m of [this.mesh,this.front]){m.autoUpdate=false;m.geometry.addAttribute('aFrontWeight',{buffer:weights,format:'float32'});}return this;
 }

 render(joints,clock,{energy=1,width=.45,translucency=.7}={}){const[s,originalElbow,w,palm]=joints,e=artElbow(s,originalElbow,w),a=angles(clock+(this.side==='left'?1.7:0),energy),v=this.mesh.vertices,spine=sampledSpine(path,s,e,w,palm);this.bindings.forEach((b,i)=>{const q=bendDigit(b.x,b.y,b.digits,a),t=(q[0]-320)/870,offset=(q[1]-470)*width*(this.side==='left'?-1:1),p=spine(t,offset);v[i*2]=p[0];v[i*2+1]=p[1];});this.areaConstraint=constrainAreas(v,this.mesh.geometry.indexBuffer.data);this.mesh.geometry.getBuffer('aPosition').update();this.front.vertices.set(v);this.front.geometry.getBuffer('aPosition').update();for(const shader of [this.shader,this.frontShader]){shader.resources.spiritUniforms.uniforms.uSpiritTime=clock;shader.resources.spiritUniforms.uniforms.uSpiritStrength=translucency;shader.resources.morphUniforms.uniforms.uFrontAmount=1;}}
 destroy(){this.mesh.destroy();this.front.destroy();this.shader.destroy();this.frontShader.destroy();this.texture.destroy(true);}
}
