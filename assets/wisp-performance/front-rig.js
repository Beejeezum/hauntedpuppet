import {spiritOffset} from './spirit-flow.js';
import {PaintedBodyViews} from './body-views.js';
import {paintMorphShader} from './paint-morph-shader.js';
import {solveArm,distance,boneTransform,bindArmPoint,skinArmPoint} from './limb-solver.js';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
const REST={head:[526,588],chest:[526,930],tail:[530,1370],crest:[511,248]};
const ARMS={
 left:{pivot:[1030,370],attach:[370,870],scale:.36,rotation:.21,joints:[[1030,370],[825,800],[560,900],[340,885]]},
 right:{pivot:[330,400],attach:[640,870],scale:.36,rotation:-.31,joints:[[330,400],[540,770],[790,870],[940,870]]}
};
function registered(point,arm){const x=(point[0]-arm.pivot[0])*arm.scale,y=(point[1]-arm.pivot[1])*arm.scale,c=Math.cos(arm.rotation),s=Math.sin(arm.rotation);return[arm.attach[0]+x*c-y*s,arm.attach[1]+x*s+y*c];}
/** Raster-aware mesh: retain cells around painted ink, discard distant empty corners. */
function paintedGeometry(image,transform,cols=36,rows=40,extra=null){
 const scan=document.createElement('canvas');scan.width=image.width;scan.height=image.height;
 const ctx=scan.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);if(extra){ctx.globalCompositeOperation='lighter';ctx.drawImage(extra,0,0,image.width,image.height);}
 const pixels=ctx.getImageData(0,0,scan.width,scan.height).data,w=scan.width,h=scan.height;
 const corners=[0,w-1,(h-1)*w,h*w-1];if(corners.some(i=>pixels[i*4+3]>8))throw Error('Puppet component has an opaque canvas background');
 const vertices=[],uvs=[],indices=[],lookup=new Map();
 function vertex(x,y){const key=y*(cols+1)+x;if(lookup.has(key))return lookup.get(key);const i=vertices.length/2,p=transform([x/cols*w,y/rows*h]);vertices.push(...p);uvs.push(x/cols,y/rows);lookup.set(key,i);return i;}
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  let ink=false;const l=Math.max(0,Math.floor(x/cols*w)-2),r=Math.min(w,Math.ceil((x+1)/cols*w)+2),t=Math.max(0,Math.floor(y/rows*h)-2),b=Math.min(h,Math.ceil((y+1)/rows*h)+2);
  for(let yy=t;yy<b&&!ink;yy++)for(let xx=l;xx<r;xx++)if(pixels[(yy*w+xx)*4+3]>5){ink=true;break;}
  if(!ink)continue;const a=vertex(x,y),bb=vertex(x+1,y),c=vertex(x,y+1),d=vertex(x+1,y+1);indices.push(a,bb,d,a,d,c);
 }
 return{vertices:new Float32Array(vertices),uvs:new Float32Array(uvs),indices:new Uint32Array(indices)};
}
async function painting(url){const im=new Image();im.src=url;await im.decode();return im;}
/** One shared painted torso plus separately skinned arms. Reuses the parent's GPU. */
export class PaintedFrontRig{
 constructor(P){this.P=P;this.ready=false;this.current={ready:false};}
 async load(base='/assets/wisp-performance/front-kit/'){
  const P=this.P;this.container=new P.Container();this.arms=[];
  try{
   const names=['body','arm-left','arm-right','arm-left-evil','arm-right-evil'];
   const images=Object.fromEntries(await Promise.all(names.map(async name=>[name,await painting(base+name+'.png')])));
   this.bodyViews=await new PaintedBodyViews(P).load(images.body,base);
   for(const side of ['left','right']){
    const meta=ARMS[side],image=images['arm-'+side],joints=meta.joints.map(p=>registered(p,meta));
    const g=paintedGeometry(image,p=>registered(p,meta),36,40,images['arm-'+side+'-evil']),baseVertices=g.vertices.slice(),bindings=[];
    for(let k=0;k<baseVertices.length;k+=2)bindings.push(bindArmPoint(baseVertices[k],baseVertices[k+1],joints));
    const cute=P.Texture.from(image),evil=P.Texture.from(images['arm-'+side+'-evil']),shader=paintMorphShader(P,cute,evil),frontShader=paintMorphShader(P,cute,evil,true);
    const mesh=new P.MeshSimple({texture:cute,shader,...g}),front=new P.MeshSimple({texture:cute,shader:frontShader,...g});
    const upperX=joints[1][0]-joints[0][0],upperY=joints[1][1]-joints[0][1],upperLengthSquared=upperX*upperX+upperY*upperY;
    mesh.autoUpdate=front.autoUpdate=false;
    const frontWeights=new Float32Array(baseVertices.length/2);for(let k=0;k<baseVertices.length;k+=2)frontWeights[k/2]=clamp(((baseVertices[k]-joints[0][0])*upperX+(baseVertices[k+1]-joints[0][1])*upperY)/upperLengthSquared);
    for(const part of [mesh,front])part.geometry.addAttribute('aFrontWeight',{buffer:frontWeights,format:'float32'});
    this.container.addChild(mesh);this.arms.push({side,mesh,front,shader,frontShader,evil,base:baseVertices,joints,bindings});
   }
   this.body=this.bodyViews.mesh;this.body.autoUpdate=false;this.bodyBase=this.bodyViews.samples[0].v.slice();this.container.addChild(this.body);
   for(const arm of this.arms)this.container.addChild(arm.front);
   this.ready=true;return this;
  }catch(error){this.error=error.message;this.destroy();this.container.destroy({children:true,texture:true,textureSource:true});throw error;}
 }
 render({controls,rotations,roll=0,evil=0,alpha=1,performer=null,jaw=0,viewAngle=0,clock=0,flow=0,translucency=0}){
  if(!this.ready)return null;this.container.visible=alpha>.001;this.container.alpha=clamp(alpha);
  const head=[controls.head[0]-REST.head[0],controls.head[1]-REST.head[1]+(performer?.headPitch||0)*12],chest=controls.chest.map((v,i)=>v-REST.chest[i]),tail=controls.tail.map((v,i)=>v-REST.tail[i]),crest=controls.crest.map((v,i)=>v-REST.crest[i]-head[i]);
  const c=Math.cos(roll),s=Math.sin(roll),form=evil*(.65+.35*Math.abs(Math.cos(viewAngle*Math.PI/180)));
  for(const shader of [this.bodyViews.shader,...this.arms.flatMap(a=>[a.shader,a.frontShader])]){const u=shader.resources.spiritUniforms.uniforms;u.uSpiritTime=clock;u.uSpiritStrength=clamp(translucency);}
  const bodyPoint=(x,y)=>{
   const cheek=smooth((y-560)/180)*(1-smooth((y-800)/110)),temple=smooth((y-300)/190)*(1-smooth((y-590)/100));x=512+(x-512)*(1+form*(.10*temple-.18*cheek));y-=form*36*(1-smooth((y-240)/230));
   const h=1-smooth((y-700)/260),t=smooth((y-960)/430),torso=1-h-t,tip=1-smooth((y-250)/210),dx=x-512,dy=y-600,jawWeight=smooth((y-610)/180)*(1-smooth((y-820)/140))*clamp(jaw);
   const drift=spiritOffset(x,y,clock,flow);
   return[drift[0]+(512+dx*c-dy*s+head[0])*h+(x+chest[0])*torso+(x+tail[0])*t+crest[0]*tip+(x-512)*.025*jawWeight,
    drift[1]+(600+dx*s+dy*c+head[1])*h+(y+chest[1])*torso+(y+tail[1])*t+crest[1]*tip+14*jawWeight];
  };
  const yaw=viewAngle*Math.PI/180,cos=Math.cos(yaw),sin=Math.sin(yaw),project=(point,z=120)=>{const xx=(point[0]-512)*(1-z/1400),zz=z*cos-xx*sin,scale=1400/(1400-zz);return [512+(xx*cos+z*sin)*scale,768+(point[1]-768)*(1-z/1400)*scale,scale/(1400/(1400-z))];};
  const faceAnchor=bodyPoint(512,600),solved={};
  if(this.container.visible){
   this.bodyViews.render(viewAngle,bodyPoint);
   for(const arm of this.arms){
    arm.shader.resources.morphUniforms.uniforms.uBlend=evil;arm.frontShader.resources.morphUniforms.uniforms.uBlend=evil;
    const side=arm.side,meta=ARMS[side],shoulder=bodyPoint(512+(meta.attach[0]-512)*cos,meta.attach[1]),projected=project(controls[side]),palm=projected.slice(0,2);const depth=clamp(cos+(side==='left'?1:-1)*.8*sin);arm.front.alpha=1;arm.shader.resources.morphUniforms.uniforms.uFrontAmount=depth;arm.frontShader.resources.morphUniforms.uniforms.uFrontAmount=depth;let direction=Math.atan2(palm[1]-shoulder[1],palm[0]-shoulder[0]);if(side==='left'&&direction<0)direction+=Math.PI*2;
    const handAngle=(side==='left'?3.35:-.2)+(direction-(side==='left'?2.65:.5))+(rotations[side]||0);
    const rest=arm.joints,handScale=(1.2+evil*.35)*projected[2],foreshorten=.7+.3*Math.abs(cos),result=solveArm(shoulder,palm,{upper:distance(rest[0],rest[1])*foreshorten,lower:distance(rest[1],rest[2])*foreshorten,hand:distance(rest[2],rest[3])*handScale,side,handAngle});
    const bones=[0,1,2].map(i=>boneTransform(rest[i],rest[i+1],result.joints[i],result.joints[i+1],{preserveVolume:i!==2}));
    const vertices=arm.mesh.vertices;for(let k=0;k<vertices.length;k+=2){const q=skinArmPoint(arm.base[k],arm.base[k+1],arm.bindings[k/2],bones);vertices[k]=q[0];vertices[k+1]=q[1];}arm.front.vertices.set(vertices);arm.mesh.geometry.getBuffer('aPosition').update();arm.front.geometry.getBuffer('aPosition').update();
    solved[side]={...result,handAngle:result.handAngle,handScale,shoulderOnBody:shoulder};
   }
  }
  this.current={ready:true,sharedBody:true,contourTurn:true,viewAngle,alpha,faceAnchor,arms:solved,surfaces:5,premultipliedFormMix:true,foregroundHands:true,livingSkin:{flow,translucency,clock,bodyAttached:true},vertices:this.bodyBase.length/2+this.arms.reduce((n,a)=>n+a.base.length/2,0)};
  return{faceAnchor,anchors:{head:this.bodyViews.anchor(600),tail:this.bodyViews.anchor(1370),left:solved.left?.joints[3]||controls.left,right:solved.right?.joints[3]||controls.right}};
 }
 destroy(){this.ready=false;this.bodyViews?.destroy();for(const arm of this.arms){arm.shader.destroy();arm.frontShader.destroy();arm.evil.destroy(true);}}
 inspect(){return{...this.current,error:this.error||null};}
}
