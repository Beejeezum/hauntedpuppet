import {deformPoint} from './pose.js';
import {PaintedFace} from './face.js';
import {ScaryPaintedFace} from './scary-face.js';
const vertex=`in vec2 aPosition;in vec2 aUV;uniform mat3 uProjectionMatrix;uniform mat3 uWorldTransformMatrix;uniform mat3 uTransformMatrix;uniform vec4 uColor;uniform vec4 uWorldColorAlpha;out vec2 vUV;out vec4 vColor;void main(){vec3 p=uProjectionMatrix*uWorldTransformMatrix*uTransformMatrix*vec3(aPosition,1.);gl_Position=vec4(p.xy,0.,1.);vUV=aUV;vColor=uColor*uWorldColorAlpha;}`;
const fragment=`precision highp float;in vec2 vUV;in vec4 vColor;uniform sampler2D uPainting;uniform sampler2D uSkin;uniform sampler2D uFace;uniform float uTime;uniform float uFlow;uniform float uReference;uniform float uScary;out vec4 finalColor;
float g(vec2 p,vec2 c,vec2 r){vec2 d=(p-c)/r;return exp(-dot(d,d));}
float zone(vec2 p,vec2 c,vec2 r){return 1.-smoothstep(.80,1.,length((p-c)/r));}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
void main(){
 vec2 uv=vUV;float protectedFace=g(uv,vec2(.49,.365),vec2(.235,.15));float protectedHands=max(g(uv,vec2(.20,.52),vec2(.16,.09)),g(uv,vec2(.77,.58),vec2(.15,.08)));
 float influence=(1.-smoothstep(.25,.7,max(protectedFace,protectedHands)))*uFlow*(1.-uReference);float t=uTime;
 vec2 drift=vec2(noise(uv*12.+vec2(t*.21,-t*.31))-.5,noise(uv.yx*15.+vec2(-t*.18,t*.16))-.5)*.007*influence;
 vec4 ink=texture(uPainting,uv+drift);vec2 pixel=uv*vec2(1024.,1536.);float faceMask=max(max(zone(pixel,vec2(403.,552.),vec2(85.,80.)),zone(pixel,vec2(592.,584.),vec2(85.,75.))),max(max(zone(pixel,vec2(418.,445.),vec2(80.,50.)),zone(pixel,vec2(615.,478.),vec2(85.,50.))),zone(pixel,vec2(489.,645.),vec2(100.,65.))))*(1.-uReference);
 if(uScary>.5)faceMask=max(max(zone(pixel,vec2(438.,538.),vec2(90.,92.)),zone(pixel,vec2(592.,587.),vec2(83.,72.))),max(max(zone(pixel,vec2(426.,484.),vec2(85.,55.)),zone(pixel,vec2(607.,551.),vec2(79.,48.))),zone(pixel,vec2(500.,650.),vec2(148.,97.))))*(1.-uReference);
 vec4 plate=texture(uSkin,uv);ink.rgb=mix(ink.rgb,plate.rgb/max(plate.a,.001),faceMask);
 vec2 faceUV=(uv*vec2(1024.,1536.)-vec2(260.,365.))/vec2(512.,410.);float inside=step(0.,faceUV.x)*step(faceUV.x,1.)*step(0.,faceUV.y)*step(faceUV.y,1.);
 vec4 face=texture(uFace,clamp(faceUV,0.,1.))*inside*(1.-uReference);ink.rgb=face.rgb+ink.rgb*(1.-face.a);
 float lum=max(ink.r,max(ink.g,ink.b));float matte=smoothstep(.014,.055,lum);float fringe=(1.-smoothstep(.10,.55,lum))*influence;
 float density=1.-fringe*(.10+.22*noise(uv*24.+vec2(t*.12,-t*.48)));
 vec3 rgb=ink.rgb*matte*density;float alpha=max(rgb.r,max(rgb.g,rgb.b));alpha=clamp(alpha*1.4,0.,1.);
 finalColor=vec4(rgb,alpha)*vColor;
}`;
async function image(src){const im=new Image();im.src=src;await im.decode();return im;}
export class FriendlyPaintedRig {
 constructor(){this.ready=false;this.frames=0;this.current={};this.sources=[];}
 async load({paintingURL,whiteEyesURL,mouthURL,skinURL,form='friendly'}){
  this.form=form;
  const P=await import('../vendor/pixi/pixi.mjs');this.P=P;
  const [painting,skin,whiteEyes,mouths]=await Promise.all([image(paintingURL),image(skinURL||new URL('./friendly-skin-plate-v1.png',import.meta.url)),image(whiteEyesURL),image(mouthURL)]);
  this.face=form==='scary'?new ScaryPaintedFace(painting,whiteEyes,mouths):new PaintedFace(painting,whiteEyes,mouths);this.painting=painting;
  this.app=new P.Application();await this.app.init({width:1280,height:720,backgroundAlpha:0,antialias:true,autoStart:false,preference:'webgl',resolution:1});this.app.stop();
  const texture=P.Texture.from(painting),plate=P.Texture.from(skin),face=P.Texture.from(this.face.canvas);this.sources=[texture,plate,face];this.faceTexture=face;
  this.shader=new P.Shader({glProgram:P.GlProgram.from({name:'wisp-live-painted-surface',vertex,fragment}),resources:{uPainting:texture.source,uSkin:plate.source,uFace:face.source,liveUniforms:{uTime:{value:0,type:'f32'},uFlow:{value:1,type:'f32'},uReference:{value:0,type:'f32'},uScary:{value:form==='scary'?1:0,type:'f32'}}}});
  const cols=64,rows=96,v=[],uv=[],ix=[];
  for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){v.push(x/cols*1024,y/rows*1536);uv.push(x/cols,y/rows);}
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){let a=y*(cols+1)+x,b=a+1,c=a+cols+1,d=c+1;ix.push(a,b,d,a,d,c);}
  this.base=new Float32Array(v);this.mesh=new P.MeshSimple({texture,shader:this.shader,vertices:this.base.slice(),uvs:new Float32Array(uv),indices:new Uint32Array(ix)});this.mesh.autoUpdate=false;this.mesh.pivot.set(512,768);this.mesh.position.set(640,360);this.mesh.scale.set(.275);this.app.stage.addChild(this.mesh);
  this.canvas=this.app.canvas;this.canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.ready=false;this.error='Graphics interrupted. Reload the proof to recover; capture has been stopped.';this.onLost?.();});this.ready=true;return this;
 }
 render(m,{flow=1,reference=false}={}){
  if(!this.ready)return null;const started=performance.now();this.face.draw(m.face);this.faceTexture.source.update();
  const v=this.mesh.vertices;for(let k=0;k<this.base.length;k+=2){const p=reference?[this.base[k],this.base[k+1]]:deformPoint(this.base[k],this.base[k+1],m);v[k]=p[0];v[k+1]=p[1];}this.mesh.geometry.getBuffer('aPosition').update();
  this.mesh.position.set(640+(reference?0:m.root.x*.275),360+(reference?0:m.root.y*.275));this.mesh.rotation=reference?0:m.root.rotation;
  const u=this.shader.resources.liveUniforms.uniforms;u.uTime=m.clock;u.uFlow=flow;u.uReference=reference?1:0;this.app.renderer.render(this.app.stage);
  this.current={ready:true,form:this.form,engine:'PixiJS 8.22.0 painted mesh',vertices:this.base.length/2,singleConnectedSurface:true,paintedReferencePreserved:true,headAnglesLimited:true,flow,reference,frames:++this.frames,costMs:performance.now()-started,face:{...m.face},arms:{...m.arms},tail:{...m.tail},gesture:m.gesture,acting:{reach:m.reach||0,bow:m.bow||0},input:m.input||null};return this.canvas;
 }
 inspect(){return{...this.current,ready:this.ready,error:this.error||null};}
 destroy(){this.ready=false;this.app?.destroy(true,{children:true});for(const t of this.sources)t.destroy(true);this.sources=[];}
}
