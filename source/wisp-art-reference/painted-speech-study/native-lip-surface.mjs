/** Source-only proof: deform the native face crop, never a foreign cheek patch.
 * Caller snapshots the body once and passes that SAME canvas for registration.
 * Unapproved geometry candidates and acoustic opening are not phoneme accuracy.
 */
const base=new URL('./',import.meta.url);
const vertex='attribute vec2 position;varying vec2 uv;void main(){uv=vec2((position.x+1.)*.5,(1.-position.y)*.5);gl_Position=vec4(position,0.,1.);}';
const fragment=`precision highp float;
varying vec2 uv;uniform sampler2D nativePaint,contour,oralPaint;
uniform vec2 size;uniform float mouthLeft,mouthWidth,columns,opening;
vec2 lips(float x){float q=clamp((x-mouthLeft)/mouthWidth,0.,1.);vec4 c=texture2D(contour,vec2((q*(columns-1.)+.5)/columns,.5));return vec2(c.r*65280.+c.g*255.,c.b*65280.+c.a*255.)/65535.*size.y;}
void main(){vec2 p=uv*size-.5;vec2 lip=lips(p.x);float u=lip.x,l=lip.y,q=clamp((p.x-mouthLeft)/mouthWidth,0.,1.);float profile=pow(max(0.,sin(q*3.14159265)),.8);float gap=14.*opening*profile;float top=u-.22*gap,bottom=l+.78*gap;float sy=p.y;
if(p.y<top&&p.y>=u-16.)sy=u-16.+(p.y-u+16.)*16./max(top-u+16.,1.);
if(p.y>bottom&&p.y<=l+36.)sy=l+(p.y-bottom)*36./max(l+36.-bottom,1.);
vec4 paint=texture2D(nativePaint,(vec2(p.x,sy)+.5)/size);
float edge=clamp(min(p.y-top,bottom-p.y)-.35,0.,1.);float mask=edge*profile*clamp(gap/3.,0.,1.);
vec2 oralUV=vec2(clamp((p.x-mouthLeft)/mouthWidth,0.,1.),(p.y-(top+bottom)*.5+19.)/38.);
vec4 inside=texture2D(oralPaint,oralUV);gl_FragColor=mix(paint,inside,mask);}`;
function shader(gl,type,text){const s=gl.createShader(type);gl.shaderSource(s,text);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw Error('Native lip shader unavailable');}return s;}
function smooth(values){const kernel=[.0027,.0214,.094,.231,.3018,.231,.094,.0214,.0027],n=values.length;return values.map((_,i)=>kernel.reduce((sum,k,j)=>{let at=i+j-4;while(at<0||at>=n)at=at<0?-at:2*n-2-at;return sum+values[at]*k;},0));}
// Presented media timestamps are commonly rounded to microseconds: floor
// would select the previous drawing for0.041666 instead of native frame1.
export function nativeLipFrameIndex(time){if(!Number.isFinite(time))throw Error('Invalid native frame time');return Math.round(Math.max(0,time)*24)%122;}
export class NativeLipSurface{
 constructor(){this.canvas=document.createElement('canvas');this.crop=document.createElement('canvas');this.gl=this.canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});if(!this.gl)throw Error('Native lip study needs WebGL');this.abort=new AbortController();this.disposed=false;this.ready=false;this.draws=0;this.textures=[];this.shaders=[];
 const g=this.gl;try{this.shaders.push(shader(g,g.VERTEX_SHADER,vertex));this.shaders.push(shader(g,g.FRAGMENT_SHADER,fragment));this.program=g.createProgram();for(const s of this.shaders)g.attachShader(this.program,s);g.linkProgram(this.program);if(!g.getProgramParameter(this.program,g.LINK_STATUS))throw Error('Native lip program unavailable');this.buffer=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,this.buffer);g.bufferData(g.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),g.STATIC_DRAW);g.useProgram(this.program);const p=g.getAttribLocation(this.program,'position');g.enableVertexAttribArray(p);g.vertexAttribPointer(p,2,g.FLOAT,false,0,0);this.uniforms=Object.fromEntries(['size','mouthLeft','mouthWidth','columns','opening'].map(k=>[k,g.getUniformLocation(this.program,k)]));
 for(const [unit,name]of ['nativePaint','contour','oralPaint'].entries()){const texture=g.createTexture();this.textures.push(texture);g.activeTexture(g.TEXTURE0+unit);g.bindTexture(g.TEXTURE_2D,texture);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.uniform1i(g.getUniformLocation(this.program,name),unit);}
 }catch(error){this.dispose();throw error;}
 }
 async load(){if(this.disposed)return false;try{return await this.loadAssets();}catch(error){this.dispose();throw error;}}
 async loadAssets(){const signal=AbortSignal.any([this.abort.signal,AbortSignal.timeout(10000)]);const [data,blob]=await Promise.all([fetch(new URL('native-lip-mesh-study/friendly-native-lip-candidates-v1.json',base),{signal}).then(r=>{if(!r.ok)throw Error('Native contours unavailable');return r.json()}),fetch(new URL('wisp-friendly-speaking-study-v2.png',base),{signal}).then(r=>{if(!r.ok)throw Error('Oral paint unavailable');return r.blob()})]);
 if(data.frames?.length!==122||data.dimensions?.join()!=='1916,1080'||data.failedFrames?.length)throw Error('Unexpected native face source');const image=await createImageBitmap(blob);try{if(this.disposed)return false;if(signal.aborted)throw new DOMException('Native lip loading cancelled','AbortError');const oral=document.createElement('canvas');oral.width=74;oral.height=38;oral.getContext('2d').drawImage(image,711,479,74,38,0,0,74,38);const g=this.gl;g.activeTexture(g.TEXTURE2);g.bindTexture(g.TEXTURE_2D,this.textures[2]);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,oral);
 this.frames=data.frames.map(f=>{if(!f.valid||f.upperInk?.length!==f.lowerInk?.length||f.upperInk.length<28||f.upperInk.length>50)throw Error('Invalid native face contour');const xs=f.upperInk.map(p=>p[0]),upper=smooth(f.upperInk.map(p=>p[1])),lower=smooth(f.lowerInk.map(p=>p[1]));const x=Math.floor(xs[0])-3,y=Math.floor(Math.min(...upper))-20,width=Math.ceil(xs.at(-1))+4-x,height=Math.ceil(Math.max(...lower))+48-y;const packed=new Uint8Array(xs.length*4);upper.forEach((u,i)=>{const hi=Math.round((u-y)/height*65535),lo=Math.round((lower[i]-y)/height*65535);packed.set([hi>>8,hi&255,lo>>8,lo&255],i*4)});return{x,y,width,height,mouthLeft:xs[0]-x,mouthWidth:xs.at(-1)-xs[0],columns:xs.length,packed};});// Pay the first shader submission/readback cost during explicit loading,
 // before a speaking draw. Four bytes suffice; no native video is bound here.
 g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,this.textures[0]);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,1,1,0,g.RGBA,g.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]));g.activeTexture(g.TEXTURE1);g.bindTexture(g.TEXTURE_2D,this.textures[1]);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,1,1,0,g.RGBA,g.UNSIGNED_BYTE,new Uint8Array(4));g.useProgram(this.program);g.viewport(0,0,1,1);g.uniform2f(this.uniforms.size,1,1);g.uniform1f(this.uniforms.mouthLeft,0);g.uniform1f(this.uniforms.mouthWidth,1);g.uniform1f(this.uniforms.columns,1);g.uniform1f(this.uniforms.opening,0);g.drawArrays(g.TRIANGLE_STRIP,0,4);g.readPixels(0,0,1,1,g.RGBA,g.UNSIGNED_BYTE,new Uint8Array(4));
 this.ready=true;return true;}finally{image.close();}
 }
 draw(ctx,snapshot,time,opening){if(!this.ready||this.disposed||this.gl.isContextLost()||!Number.isFinite(time)||!Number.isFinite(opening)||opening<=.0001)return false;if(snapshot.width!==1916||snapshot.height!==1080)throw Error('Use the exact native body snapshot');const f=this.frames[nativeLipFrameIndex(time)],g=this.gl;
 if(this.canvas.width!==f.width||this.canvas.height!==f.height){this.canvas.width=this.crop.width=f.width;this.canvas.height=this.crop.height=f.height;}const c=this.crop.getContext('2d');c.clearRect(0,0,f.width,f.height);c.drawImage(snapshot,f.x,f.y,f.width,f.height,0,0,f.width,f.height);
 g.useProgram(this.program);g.viewport(0,0,f.width,f.height);g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,this.textures[0]);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,this.crop);g.activeTexture(g.TEXTURE1);g.bindTexture(g.TEXTURE_2D,this.textures[1]);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,f.columns,1,0,g.RGBA,g.UNSIGNED_BYTE,f.packed);g.uniform2f(this.uniforms.size,f.width,f.height);for(const key of ['mouthLeft','mouthWidth','columns'])g.uniform1f(this.uniforms[key],f[key]);g.uniform1f(this.uniforms.opening,Math.min(1,opening));g.drawArrays(g.TRIANGLE_STRIP,0,4);ctx.drawImage(this.canvas,f.x,f.y);this.draws++;return true;
 }
 inspect(){return{ready:this.ready,draws:this.draws,disposed:this.disposed,sourceOnly:true};}
 dispose(){if(this.disposed)return;this.disposed=true;this.ready=false;this.abort?.abort();const g=this.gl;if(g){for(const t of this.textures||[])g.deleteTexture(t);for(const s of this.shaders||[])g.deleteShader(s);if(this.buffer)g.deleteBuffer(this.buffer);if(this.program)g.deleteProgram(this.program);g.getExtension('WEBGL_lose_context')?.loseContext();}this.frames=null;this.canvas.width=this.canvas.height=this.crop.width=this.crop.height=1;}
}
