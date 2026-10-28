/** Source-only raster dye study. Analytic curl advection, not a full 3D fluid solver.
 * Research reference: PavelDoGreat/WebGL-Fluid-Simulation, MIT, commit
 * a2d292931f19d9b3b9f564e23e6c32729d2121c3. No upstream runtime copied. */
export class FogDye {
 constructor(canvas,image,{width=768,height=432}={}){
  this.canvas=canvas;this.gl=canvas.getContext('webgl2',{alpha:false,antialias:false,preserveDrawingBuffer:true});const gl=this.gl;
  if(!gl||!gl.getExtension('EXT_color_buffer_float'))throw Error('This source study needs float WebGL2 rendering');
  this.width=width;this.height=height;this.time=0;this.steps=0;this.disposed=false;this.resources=[];
  const vertex=`#version 300 es
  out vec2 uv;void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
  const header=`#version 300 es
  precision highp float;in vec2 uv;out vec4 outColor;`;
  const program=fragment=>{const shaders=[gl.VERTEX_SHADER,gl.FRAGMENT_SHADER].map((type,i)=>{const shader=gl.createShader(type);gl.shaderSource(shader,i?header+fragment:vertex);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;});const p=gl.createProgram();shaders.forEach(s=>gl.attachShader(p,s));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));shaders.forEach(s=>gl.deleteShader(s));this.resources.push(['program',p]);return p;};
  this.seed=program(`uniform sampler2D image;uniform float imageAspect;void main(){vec2 q=(uv-.5)/vec2(.64*imageAspect/(16./9.),.64)+.5;if(any(lessThan(q,vec2(0.)))||any(greaterThan(q,vec2(1.)))){outColor=vec4(0.);return;}vec4 p=texture(image,q);float density=p.a*.62;outColor=vec4(p.rgb*density,density);}`);
  this.advect=program(`uniform sampler2D dye;uniform float dt;uniform float time;uniform vec2 texel;
   vec2 flow(vec2 p){float kx=17.,ky=13.;float energy=mix(.00016,.0022,smoothstep(1.8,4.,time));vec2 v=vec2(ky*sin(kx*p.x+time*.7)*cos(ky*p.y-time*.9),-kx*cos(kx*p.x+time*.7)*sin(ky*p.y-time*.9))*energy;v.y+=.007;
    for(int i=0;i<2;i++){float phase=float(i)*2.3;vec2 center=vec2(.32+.36*fract((time-2.)*.16+float(i)*.48),.48+sin(time*1.5+phase)*.06);vec2 r=p-center;float wake=exp(-dot(r,r)*650.)*smoothstep(2.,3.,time)*(1.-smoothstep(6.5,8.,time));v+=vec2(-r.y,r.x)*wake*.9;}
    return v;}
   void main(){vec2 p=uv-flow(uv)*dt;vec4 center=texture(dye,p);vec4 neighbors=(texture(dye,p+vec2(texel.x,0.))+texture(dye,p-vec2(texel.x,0.))+texture(dye,p+vec2(0.,texel.y))+texture(dye,p-vec2(0.,texel.y)))*.25;
    vec4 d=mix(center,neighbors,min(.22,dt*3.));float decay=mix(.025,1.3,smoothstep(5.5,9.,time));d*=exp(-decay*dt);if(any(lessThan(p,vec2(.01)))||any(greaterThan(p,vec2(.99))))d=vec4(0.);outColor=max(d,vec4(0.));}`);
  this.display=program(`uniform sampler2D dye;void main(){vec4 p=texture(dye,uv);vec3 light=1.-exp(-p.rgb*2.1);outColor=vec4(light,1.);}`);
  const makeTexture=(internal,type)=>{const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,internal,width,height,0,gl.RGBA,type,null);this.resources.push(['texture',texture]);return texture;};
  const target=()=>{const texture=makeTexture(gl.RGBA16F,gl.HALF_FLOAT),buffer=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,buffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Incomplete fog framebuffer');this.resources.push(['framebuffer',buffer]);return{texture,buffer};};
  this.front=target();this.back=target();this.image=gl.createTexture();this.resources.push(['texture',this.image]);gl.bindTexture(gl.TEXTURE_2D,this.image);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
  this.use(this.seed,this.front,this.image);gl.uniform1f(gl.getUniformLocation(this.seed,'imageAspect'),image.width/image.height);gl.drawArrays(gl.TRIANGLES,0,3);this.render();
 }
 use(program,target,texture){const gl=this.gl;gl.useProgram(program);gl.bindFramebuffer(gl.FRAMEBUFFER,target?.buffer||null);gl.viewport(0,0,target?this.width:this.canvas.width,target?this.height:this.canvas.height);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);}
 step(dt=1/24){if(this.disposed)throw Error('Fog study disposed');if(!Number.isFinite(dt)||dt<=0||dt>.1)throw Error('Use a bounded fixed timestep');const gl=this.gl;this.time+=dt;this.use(this.advect,this.back,this.front.texture);gl.uniform1f(gl.getUniformLocation(this.advect,'dt'),dt);gl.uniform1f(gl.getUniformLocation(this.advect,'time'),this.time);gl.uniform2f(gl.getUniformLocation(this.advect,'texel'),1/this.width,1/this.height);gl.drawArrays(gl.TRIANGLES,0,3);[this.front,this.back]=[this.back,this.front];this.steps++;this.render();}
 render(){this.use(this.display,null,this.front.texture);this.gl.drawArrays(this.gl.TRIANGLES,0,3);}
 inspect(){return{time:this.time,steps:this.steps,disposed:this.disposed,width:this.width,height:this.height,error:this.gl.getError()};}
 dispose(){if(this.disposed)return;this.disposed=true;const gl=this.gl;for(const [type,value]of this.resources){if(type==='texture')gl.deleteTexture(value);if(type==='program')gl.deleteProgram(value);if(type==='framebuffer')gl.deleteFramebuffer(value);}this.resources=[];}
}
