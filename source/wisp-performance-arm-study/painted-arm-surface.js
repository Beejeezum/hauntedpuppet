import {sampledSpine} from './sampled-spine.js';
import {constrainAreas} from './mesh-area.js';
import {armSurfaceShader} from './arm-surface-shader.js';
import {bind,angles,bendDigit} from './digit-field.js';
// Alpha-core medial samples measured on the unchanged paintings; palm keeps the wrist frame.
function paintedCenter(x,side){const points=side==='left'?[[320,472],[631.75,488],[903.625,491.5],[1084.875,489],[1190,498]]:[[320,467],[600,491.5],[900,495.5],[1100,494],[1190,497]];if(x<=points[0][0])return points[0][1];for(let i=1;i<points.length;i++)if(x<=points[i][0]){let t=(x-points[i-1][0])/(points[i][0]-points[i-1][0]);t=t*t*(3-2*t);return points[i-1][1]*(1-t)+points[i][1]*t;}return points.at(-1)[1];}
function unit(a,b){const x=b[0]-a[0],y=b[1]-a[1],l=Math.hypot(x,y);return[x/l,y/l]}
// Compress cartoon limb lengths in close poses instead of creating a long hairpin elbow.
function artElbow(s,e,w){const upper=Math.hypot(e[0]-s[0],e[1]-s[1]),lower=Math.hypot(w[0]-e[0],w[1]-e[1]),distance=Math.max(.001,Math.hypot(w[0]-s[0],w[1]-s[1])),minimumReach=Math.sqrt(upper*upper+lower*lower+2*upper*lower*Math.cos(70*Math.PI/180)),ratio=distance/Math.max(.001,minimumReach),q=Math.max(0,Math.min(1,(ratio-.8)/.4)),scale=ratio<.8?ratio:ratio>1.2?1:.8+.4*q-.2*q*q,a=upper*scale,b=lower*scale,along=(a*a-b*b+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,a*a-along*along)),dir=unit(s,w),cross=(w[0]-s[0])*(e[1]-s[1])-(w[1]-s[1])*(e[0]-s[0]),sign=cross<0?-1:1,bend=Math.max(0,Math.min(1,(distance/Math.max(.001,upper+lower)-.2)/.6)),bendWeight=bend*bend*(3-2*bend);return[s[0]+dir[0]*along-dir[1]*height*sign*bendWeight,s[1]+dir[1]*along+dir[0]*height*sign*bendWeight];}
function hermite(a,b,ta,tb,t){const t2=t*t,t3=t2*t,t4=t3*t,t5=t4*t;return[0,1].map(k=>(1-10*t3+15*t4-6*t5)*a[k]+(t-6*t3+8*t4-3*t5)*ta[k]+(10*t3-15*t4+6*t5)*b[k]+(-4*t3+7*t4-3*t5)*tb[k])}
function path(s,e,w,t,palm=w){
 const upper=Math.hypot(e[0]-s[0],e[1]-s[1]),lower=Math.hypot(w[0]-e[0],w[1]-e[1]),middle=unit(s,w),first=unit(s,e),fore=unit(e,w),foreAngle=Math.atan2(fore[1],fore[0]),target=Math.hypot(palm[0]-w[0],palm[1]-w[1])>.001?Math.atan2(palm[1]-w[1],palm[0]-w[0]):foreAngle,delta=Math.atan2(Math.sin(target-foreAngle),Math.cos(target-foreAngle)),wristAngle=foreAngle+Math.tanh(delta),last=[Math.cos(wristAngle),Math.sin(wristAngle)],tangent=middle.map(x=>x*Math.min((upper+lower)/2,Math.min(upper,lower)*2));
 const start=Math.min(117.5,upper*.6),end=Math.min(117.5,lower*.6);if(t<0)return s.map((x,k)=>x+first[k]*t*start*2);if(t>1)return w.map((x,k)=>x+last[k]*(t-1)*end*2);return t<=.5?hermite(s,e,first.map(x=>x*start),tangent,t*2):hermite(e,w,tangent,last.map(x=>x*end),(t-.5)*2);
}


/** Local candidate only. Same artwork and mesh used by isolated and full-character comparisons. */
export class PaintedArmSurface{
 constructor(P){this.P=P;}
 async load(url,{side='right'}={}){
  this.side=side;const image=new Image();image.src=url;await image.decode();
  const scan=document.createElement('canvas');scan.width=image.width;scan.height=image.height;
  const ctx=scan.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const rgba=ctx.getImageData(0,0,scan.width,scan.height).data;
  const v=[],uv=[],ix=[],lookup=new Map(),cols=64,rows=28;this.bindings=[];
  const vertex=(x,y)=>{const key=y*(cols+1)+x;if(lookup.has(key))return lookup.get(key);const index=this.bindings.length,rawX=(side==='left'?1-x/cols:x/cols)*1774,px=side==='left'?320+(rawX-230)*870/960:rawX,py=y/rows*887;this.bindings.push({x:px,y:py,digits:bind(px,py)});v.push(0,0);uv.push(x/cols,y/rows);lookup.set(key,index);return index;};
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
   let ink=false;const left=Math.max(0,Math.floor(x/cols*image.width)-2),right=Math.min(image.width,Math.ceil((x+1)/cols*image.width)+2),top=Math.max(0,Math.floor(y/rows*image.height)-2),bottom=Math.min(image.height,Math.ceil((y+1)/rows*image.height)+2);
   for(let yy=top;yy<bottom&&!ink;yy++)for(let xx=left;xx<right;xx++)if(rgba[(yy*image.width+xx)*4+3]>5){ink=true;break;}
   if(!ink)continue;const a=vertex(x,y),b=vertex(x+1,y),c=vertex(x,y+1),d=vertex(x+1,y+1);ix.push(a,b,d,a,d,c);
  }
  scan.width=scan.height=0;this.texture=this.P.Texture.from(image);
  const g={vertices:new Float32Array(v),uvs:new Float32Array(uv),indices:new Uint32Array(ix)},weights=new Float32Array(this.bindings.map(b=>Math.max(0,Math.min(1,(b.x-320)/870))));
  this.fullIndices=g.indices;const rear=[],front=[];for(let k=0;k<ix.length;k+=3){const tri=ix.slice(k,k+3),coverage=tri.map(i=>weights[i]);if(Math.min(...coverage)<.70)rear.push(...tri);if(Math.max(...coverage)>.08)front.push(...tri);}this.rearIndices=new Uint32Array(rear);this.frontIndices=new Uint32Array(front);this.rearCompact=true;this.shader=armSurfaceShader(this.P,this.texture);this.frontShader=armSurfaceShader(this.P,this.texture,true);
  this.mesh=new this.P.MeshSimple({texture:this.texture,shader:this.shader,...g,indices:this.rearIndices});this.front=new this.P.MeshSimple({texture:this.texture,shader:this.frontShader,...g,indices:this.frontIndices});
  for(const m of [this.mesh,this.front]){m.autoUpdate=false;m.geometry.addAttribute('aFrontWeight',{buffer:weights,format:'float32'});}return this;
 }

 render(joints,clock,{energy=1,width=.45,translucency=.9,frontAmount=1}={}){const[s,originalElbow,w,palm]=joints,e=artElbow(s,originalElbow,w),a=angles(clock+(this.side==='left'?1.7:0),energy),v=this.mesh.vertices,spine=sampledSpine(path,s,e,w,palm),handRate=2*Math.min(117.5,Math.hypot(w[0]-e[0],w[1]-e[1])*.6),sourceRate=handRate/870;this.bindings.forEach((b,i)=>{const q=bendDigit(b.x,b.y,b.digits,a),sourceT=(q[0]-320)/870,handX=Math.max(0,q[0]-1190),handDistance=sourceRate*handX+(.45-sourceRate)*(handX-80*(1-Math.exp(-handX/80))),t=sourceT<=1?sourceT:1+handDistance/Math.max(.001,handRate),offset=(q[1]-paintedCenter(q[0],this.side))*width*(this.side==='left'?-1:1),p=spine(t,offset);v[i*2]=p[0];v[i*2+1]=p[1];});this.areaConstraint=constrainAreas(v,this.fullIndices);const compact=frontAmount>=1;if(compact!==this.rearCompact){this.mesh.geometry.indexBuffer.shrinkToFit=false;this.mesh.geometry.indexBuffer.data=compact?this.rearIndices:this.fullIndices;this.rearCompact=compact;}this.mesh.geometry.getBuffer('aPosition').update();this.front.vertices.set(v);this.front.geometry.getBuffer('aPosition').update();for(const shader of [this.shader,this.frontShader]){shader.resources.spiritUniforms.uniforms.uSpiritTime=clock;shader.resources.spiritUniforms.uniforms.uSpiritStrength=translucency;shader.resources.morphUniforms.uniforms.uFrontAmount=frontAmount;}}
 destroy(){this.mesh.destroy();this.front.destroy();this.shader.destroy();this.frontShader.destroy();this.texture.destroy(true);}
}
