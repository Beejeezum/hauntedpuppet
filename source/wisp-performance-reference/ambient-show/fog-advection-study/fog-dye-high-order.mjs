/** Source-only 2D dye transport. No copied upstream runtime, pressure solve or 3D claim.
 * MacCormack method reference: NVIDIA GPU Gems3 chapter30 (Crane/Llamas/Tariq).
 * Independent implementation; original FogDye and its rejected recording remain unchanged.
 */
import {FogDye} from './fog-dye.mjs';
const vertex=`#version 300 es
out vec2 uv;void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
const header=`#version 300 es
precision highp float;in vec2 uv;out vec4 outColor;`;
// Same authored velocity field as the original study, to isolate dye transport.
const flow=`uniform float time;
vec2 flow(vec2 p){float kx=17.,ky=13.;float energy=mix(.00016,.0022,smoothstep(1.8,4.,time));vec2 v=vec2(ky*sin(kx*p.x+time*.7)*cos(ky*p.y-time*.9),-kx*cos(kx*p.x+time*.7)*sin(ky*p.y-time*.9))*energy;v.y+=.007;
for(int i=0;i<2;i++){float phase=float(i)*2.3;vec2 center=vec2(.32+.36*fract((time-2.)*.16+float(i)*.48),.48+sin(time*1.5+phase)*.06);vec2 r=p-center;float wake=exp(-dot(r,r)*650.)*smoothstep(2.,3.,time)*(1.-smoothstep(6.5,8.,time));v+=vec2(-r.y,r.x)*wake*.9;}return v;}`;
export class HighOrderFogDye extends FogDye {
 constructor(canvas,image,options={}){
  super(canvas,image,options);const gl=this.gl;
  const program=fragment=>{const shaders=[];let p;try{for(const[type,source]of[[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,header+fragment]]){const s=gl.createShader(type);shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));}p=gl.createProgram();for(const s of shaders)gl.attachShader(p,s);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));this.resources.push(['program',p]);return p;}catch(error){if(p)gl.deleteProgram(p);throw error;}finally{for(const s of shaders)gl.deleteShader(s);}};
  const target=()=>{const texture=gl.createTexture();this.resources.push(['texture',texture]);gl.bindTexture(gl.TEXTURE_2D,texture);for(const name of[gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,name,gl.LINEAR);for(const name of[gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,name,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,this.width,this.height,0,gl.RGBA,gl.HALF_FLOAT,null);const buffer=gl.createFramebuffer();this.resources.push(['framebuffer',buffer]);gl.bindFramebuffer(gl.FRAMEBUFFER,buffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Incomplete correction framebuffer');return{texture,buffer};};
  try{
   this.predictor=program(flow+`uniform sampler2D dye;uniform float dt;void main(){vec2 p=uv-flow(uv)*dt;outColor=texture(dye,p);if(any(lessThan(p,vec2(.01)))||any(greaterThan(p,vec2(.99))))outColor=vec4(0.);}`);
   this.corrector=program(flow+`uniform sampler2D dye;uniform sampler2D predicted;uniform sampler2D reversed;uniform float dt;
   void main(){ivec2 size=textureSize(dye,0);vec2 p=uv-flow(uv)*dt;ivec2 b=ivec2(floor(p*vec2(size)-.5));vec4 lo=vec4(1e6),hi=vec4(-1e6);
   for(int y=0;y<2;y++)for(int x=0;x<2;x++){vec4 s=texelFetch(dye,clamp(b+ivec2(x,y),ivec2(0),size-1),0);lo=min(lo,s);hi=max(hi,s);}
   vec4 result=texture(predicted,uv)+.5*(texture(dye,uv)-texture(reversed,uv));result=clamp(result,lo,hi);float decay=mix(.025,1.3,smoothstep(5.5,9.,time));outColor=max(result*exp(-decay*dt),vec4(0.));if(any(lessThan(p,vec2(.01)))||any(greaterThan(p,vec2(.99))))outColor=vec4(0.);}`);
   this.predicted=target();this.reversed=target();
  }catch(error){this.dispose();throw error;}
 }
 step(dt=1/24){
  if(this.disposed)throw Error('Fog study disposed');if(!Number.isFinite(dt)||dt<=0||dt>.1)throw Error('Use a bounded fixed timestep');const gl=this.gl;this.time+=dt;
  const predict=(source,target,delta)=>{this.use(this.predictor,target,source);gl.uniform1i(gl.getUniformLocation(this.predictor,'dye'),0);gl.uniform1f(gl.getUniformLocation(this.predictor,'dt'),delta);gl.uniform1f(gl.getUniformLocation(this.predictor,'time'),this.time);gl.drawArrays(gl.TRIANGLES,0,3);};
  predict(this.front.texture,this.predicted,dt);predict(this.predicted.texture,this.reversed,-dt);
  this.use(this.corrector,this.back,this.front.texture);gl.uniform1i(gl.getUniformLocation(this.corrector,'dye'),0);for(const[unit,name,target]of[[1,'predicted',this.predicted],[2,'reversed',this.reversed]]){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,target.texture);gl.uniform1i(gl.getUniformLocation(this.corrector,name),unit);}gl.uniform1f(gl.getUniformLocation(this.corrector,'dt'),dt);gl.uniform1f(gl.getUniformLocation(this.corrector,'time'),this.time);gl.drawArrays(gl.TRIANGLES,0,3);
  [this.front,this.back]=[this.back,this.front];this.steps++;this.render();
 }
 inspect(){return{...super.inspect(),scheme:'limited-maccormack',pressureSolve:false,volumetric:false};}
}
