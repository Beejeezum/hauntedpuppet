/** Private connected-jaw mechanism. Current-frame skin only; no foreign cheeks.
 * Frame index must come from a known decoded source picture, never a live clock.
 * This first mechanism opens the jaw; authored OO/EE and live matching are missing.
 */
const V=`attribute vec2 position,uv,oralLimits;varying vec2 tex,limits;uniform vec2 size;void main(){tex=uv;limits=oralLimits;gl_Position=vec4(position/size*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);}`;
const F=`precision highp float;varying vec2 tex;uniform sampler2D paint;void main(){gl_FragColor=texture2D(paint,tex);}`;
const O=`precision highp float;varying vec2 tex,limits;uniform sampler2D paint;uniform float gap,sourceScale;uniform vec2 sourceX,oralSize;
void main(){float t=tex.y,u=tex.x,visibleGap=gap*sourceScale*pow(max(0.,sin(3.14159265*u)),.7)/oralSize.y;vec2 top=vec2(mix(sourceX.x,sourceX.y,u),limits.x+t*visibleGap);vec2 bottom=vec2(mix(sourceX.x,sourceX.y,u),limits.y-(1.-t)*visibleGap);gl_FragColor=mix(texture2D(paint,top),texture2D(paint,bottom),smoothstep(.45,.55,t));}`;
export const NativeOralDiagnosticMapping={dimensions:[1280,720],sourceX:[603,665],upper:[[0,329],[.25,339],[.5,344],[.75,345],[1,344]],lower:[[0,329],[.25,366],[.5,379],[.75,374],[1,344]]};
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
function curve(points,x){if(x<=points[0][0])return points[0][1];if(x>=points.at(-1)[0])return points.at(-1)[1];const i=points.findIndex(p=>p[0]>=x),a=points[i-1],b=points[i];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}
const area=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
export function jawGeometry(observation,open){
 if(!observation?.valid||observation.lipSeam?.length!==12||!Number.isFinite(open)||open<0||open>1)throw Error('Trusted neutral lip observation and bounded opening required');
 const points=observation.lipSeam,left=points[0][0],right=points.at(-1)[0],xs=[];for(let x=left-24;x<right+24;x+=3)xs.push(x);xs.push(right+24,right);xs.sort((a,b)=>a-b);for(let i=xs.length-1;i>0;i--)if(xs[i]-xs[i-1]<.001)xs.splice(i,1);
 const offsets=[-8,-4,0,0,8,16,32,48],original=[],deformed=[],triangles=[],cavity=[];
 for(const x of xs){const seam=curve(points,x),u=(x-left)/(right-left),profile=u>0&&u<1?Math.pow(Math.sin(Math.PI*u),.7):0;
  for(let j=0;j<offsets.length;j++){const offset=offsets[j],lower=j>=3,weight=lower?smooth((48-offset)/48):smooth((offset+8)/8);original.push([x,seam+offset]);const cheek=(Math.exp(-Math.pow((x-left+4)/8,2))+Math.exp(-Math.pow((x-right-4)/8,2)))*smooth((offset+8)/8)*smooth((32-offset)/32);deformed.push([x,seam+offset+18*open*profile*weight*(lower?.9:-.1)-1.2*open*cheek]);}
 }
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<offsets.length-1;j++){if(j===2)continue;const a=i*8+j,b=a+8;triangles.push([a,b,a+1],[b,b+1,a+1]);}
 let minimumAreaRatio=Infinity;for(const tri of triangles){const a=area(...tri.map(i=>original[i])),b=area(...tri.map(i=>deformed[i]));minimumAreaRatio=Math.min(minimumAreaRatio,b/a);}
 if(minimumAreaRatio<.2)throw Error('Neutral jaw surface folded');
 for(let i=0;i<xs.length-1;i++){const a=i*8+2,b=(i+1)*8+2,u0=(xs[i]-left)/(right-left),u1=(xs[i+1]-left)/(right-left);if(u0<0||u1>1)continue;cavity.push({position:deformed[a],uv:[u0,0]},{position:deformed[b],uv:[u1,0]},{position:deformed[a+1],uv:[u0,1]},{position:deformed[b],uv:[u1,0]},{position:deformed[b+1],uv:[u1,1]},{position:deformed[a+1],uv:[u0,1]});}
 return{original,deformed,triangles,cavity,minimumAreaRatio,bounds:[left-24,Math.min(...points.map(p=>p[1]))-8,right+24,Math.max(...points.map(p=>p[1]))+48]};
}
export class NeutralMovingJaw{
 constructor(profile,oralImage,{oralMap}={}){
  if(!oralMap)throw Error('Select an explicit oral material for this private study');
  if(profile?.sourceSha256!=='86c71acf6b44eee413afc6b756e32511d9a145f7d967431bd175ee72ca79ffae'||profile.validFrames!==193||profile.observations?.length!==193||profile.dimensions?.join(',')!=='1088,704')throw Error('Pinned neutral source required');
  if(oralImage.width!==oralMap.dimensions?.[0]||oralImage.height!==oralMap.dimensions?.[1])throw Error('Pinned oral picture size required');this.oralMap=oralMap;
  this.profile=profile;this.canvas=document.createElement('canvas');this.canvas.width=1088;this.canvas.height=704;this.disposed=false;this.draws=0;
  const gl=this.gl=this.canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,preserveDrawingBuffer:true});if(!gl)throw Error('Jaw paint rendering unavailable');this.resources=[];
  const program=fragment=>{const shaders=[];for(const[type,source]of[[gl.VERTEX_SHADER,V],[gl.FRAGMENT_SHADER,fragment]]){const shader=gl.createShader(type);this.resources.push(['shader',shader]);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));shaders.push(shader);}const p=gl.createProgram();this.resources.push(['program',p]);for(const s of shaders)gl.attachShader(p,s);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;};
  const texture=image=>{const t=gl.createTexture();this.resources.push(['texture',t]);gl.bindTexture(gl.TEXTURE_2D,t);for(const key of[gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,key,gl.LINEAR);for(const key of[gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,key,gl.CLAMP_TO_EDGE);if(image)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);return t;};
  try{this.skin=program(F);this.oral=program(O);this.nativeTexture=texture();this.oralTexture=texture(oralImage);this.positions=gl.createBuffer();this.uvs=gl.createBuffer();this.limits=gl.createBuffer();this.resources.push(['buffer',this.positions],['buffer',this.uvs],['buffer',this.limits]);}catch(error){this.dispose();throw error;}
 }
 draw(ctx,picture,frame,open){
  if(this.disposed||picture.width!==1088||picture.height!==704||!Number.isInteger(frame)||frame<0||frame>=193)throw Error('Exact neutral picture/frame required');
  const geometry=jawGeometry(this.profile.observations[frame],open);ctx.drawImage(picture,0,0);if(open===0)return{drawn:false,minimumAreaRatio:geometry.minimumAreaRatio,bounds:geometry.bounds};
  const gl=this.gl;gl.viewport(0,0,1088,704);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.bindTexture(gl.TEXTURE_2D,this.nativeTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,picture);
  const render=(program,texture,positions,uvs,limits=[])=>{for(let i=0;i<3;i++)gl.disableVertexAttribArray(i);gl.useProgram(program);gl.uniform2f(gl.getUniformLocation(program,'size'),1088,704);gl.uniform1f(gl.getUniformLocation(program,'gap'),18*open);gl.uniform1f(gl.getUniformLocation(program,'sourceScale'),(this.oralMap.sourceX[1]-this.oralMap.sourceX[0])/(this.profile.observations[frame].lipSeam.at(-1)[0]-this.profile.observations[frame].lipSeam[0][0]));gl.uniform2f(gl.getUniformLocation(program,'oralSize'),...this.oralMap.dimensions);gl.uniform2f(gl.getUniformLocation(program,'sourceX'),this.oralMap.sourceX[0]/this.oralMap.dimensions[0],this.oralMap.sourceX[1]/this.oralMap.dimensions[0]);gl.uniform1i(gl.getUniformLocation(program,'paint'),0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);for(const[name,buffer,values]of[['position',this.positions,positions],['uv',this.uvs,uvs],['oralLimits',this.limits,limits]]){const location=gl.getAttribLocation(program,name);if(location<0)continue;if(!values.length){gl.disableVertexAttribArray(location);gl.vertexAttrib2f(location,0,0);continue;}gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);}gl.drawArrays(gl.TRIANGLES,0,positions.length/2);};
  render(this.oral,this.oralTexture,geometry.cavity.flatMap(v=>v.position),geometry.cavity.flatMap(v=>v.uv),geometry.cavity.flatMap(v=>[curve(this.oralMap.upper,v.uv[0])/this.oralMap.dimensions[1],curve(this.oralMap.lower,v.uv[0])/this.oralMap.dimensions[1]]));
  const ids=geometry.triangles.flat();render(this.skin,this.nativeTexture,ids.flatMap(i=>geometry.deformed[i]),ids.flatMap(i=>[geometry.original[i][0]/1088,geometry.original[i][1]/704]));
  const error=gl.getError();if(error!==gl.NO_ERROR)throw Error('Neutral jaw paint failed: '+error);ctx.drawImage(this.canvas,0,0);this.draws++;return{drawn:true,minimumAreaRatio:geometry.minimumAreaRatio,bounds:geometry.bounds};
 }
 inspect(){return{disposed:this.disposed,draws:this.draws,resources:this.resources.length};}
 dispose(){if(this.disposed)return;this.disposed=true;const gl=this.gl;for(let i=0;i<3;i++)gl.disableVertexAttribArray(i);gl.useProgram(null);gl.bindTexture(gl.TEXTURE_2D,null);gl.bindBuffer(gl.ARRAY_BUFFER,null);for(const[k,v]of this.resources){if(k==='shader')gl.deleteShader(v);else if(k==='program')gl.deleteProgram(v);else if(k==='texture')gl.deleteTexture(v);else gl.deleteBuffer(v);}this.resources=[];this.canvas.width=this.canvas.height=1;}
}
