// A planar homography keeps straight source lines straight after corner pinning.
// This module owns output calibration only; the approved painted renderer is unchanged.
export function homography(corners) {
  if (!Array.isArray(corners) || corners.length !== 4) throw Error('Four corners are required');
  const source = [[0,0],[1,0],[1,1],[0,1]], rows = [];
  corners.forEach(([px,py], i) => {
    if (![px,py].every(Number.isFinite)) throw Error('Invalid corner');
    const [u,v] = source[i], x = px/100, y = py/100;
    rows.push([u,v,1,0,0,0,-u*x,-v*x,x], [0,0,0,u,v,1,-u*y,-v*y,y]);
  });
  for (let col=0; col<8; col++) {
    let pivot=col;
    for(let r=col+1;r<8;r++) if(Math.abs(rows[r][col])>Math.abs(rows[pivot][col])) pivot=r;
    [rows[col],rows[pivot]]=[rows[pivot],rows[col]];
    const divisor=rows[col][col];
    if(Math.abs(divisor)<1e-10) throw Error('Surface is too narrow');
    for(let j=col;j<9;j++) rows[col][j]/=divisor;
    for(let r=0;r<8;r++) if(r!==col) {
      const factor=rows[r][col];
      for(let j=col;j<9;j++) rows[r][j]-=factor*rows[col][j];
    }
  }
  return [...rows.map(r=>r[8]),1];
}
export function projectPoint(h,u,v) {
  const w=h[6]*u+h[7]*v+1;
  return [(h[0]*u+h[1]*v+h[2])/w,(h[3]*u+h[4]*v+h[5])/w];
}
export const mappingDefaults=()=>({brightness:100,feather:0,mask:'none',testPattern:false,scene:'void'});
export function validMapping(s) {
  return s && Number.isFinite(s.brightness) && s.brightness>=20 && s.brightness<=150 &&
    Number.isFinite(s.feather) && s.feather>=0 && s.feather<=20 &&
    ['none','ellipse'].includes(s.mask) && (s.scene===undefined||['void','window'].includes(s.scene)) && typeof s.testPattern==='boolean';
}
export class ProjectionMapper {
  constructor(width=1280,height=720) {
    this.canvas=document.createElement('canvas');this.canvas.width=width;this.canvas.height=height;
    this.gl=this.canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});
    this.ready=false;this.error=null;this.frames=0;this.cache='';this.h=null;
    if(!this.gl) return;
    this.onLost=e=>{e.preventDefault();this.ready=false;this.error='Projection graphics interrupted';};
    this.onRestored=()=>{if(this.disposed)return;try{this.init()}catch(e){this.error=e.message;this.ready=false}};
    this.canvas.addEventListener('webglcontextlost',this.onLost);
    this.canvas.addEventListener('webglcontextrestored',this.onRestored);
    try{this.init()}catch(e){this.error=e.message}
  }
  init() {
    const gl=this.gl;
    const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader));return shader;};
    const vs=compile(gl.VERTEX_SHADER,`attribute vec2 uv; uniform mat3 surface; varying vec2 tex;
      void main(){vec3 p=surface*vec3(uv,1.0); gl_Position=vec4(2.0*p.x-p.z,p.z-2.0*p.y,0.0,p.z);tex=uv;}`);
    const fs=compile(gl.FRAGMENT_SHADER,`precision mediump float; varying vec2 tex;
      uniform sampler2D image; uniform float brightness; uniform float feather; uniform float oval;
      void main(){float edge=min(min(tex.x,1.0-tex.x),min(tex.y,1.0-tex.y));
      float mask=feather>0.0?smoothstep(0.0,feather,edge):1.0;
      if(oval>0.5){float d=length((tex-0.5)*2.0);mask*=1.0-smoothstep(1.0-max(feather*2.0,0.002),1.0,d);}
      vec4 c=texture2D(image,tex);gl_FragColor=vec4(c.rgb*brightness*mask,1.0);}`);
    this.program=gl.createProgram();gl.attachShader(this.program,vs);gl.attachShader(this.program,fs);gl.linkProgram(this.program);
    if(!gl.getProgramParameter(this.program,gl.LINK_STATUS)) throw Error('Projection shader failed');
    gl.useProgram(this.program);gl.deleteShader(vs);gl.deleteShader(fs);
    this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,1,1]),gl.STATIC_DRAW);
    const uv=gl.getAttribLocation(this.program,'uv');gl.enableVertexAttribArray(uv);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,0,0);
    this.locations={};for(const name of ['surface','image','brightness','feather','oval'])this.locations[name]=gl.getUniformLocation(this.program,name);
    this.texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.texture);
    for(const name of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,name,gl.CLAMP_TO_EDGE);
    for(const name of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,name,gl.LINEAR);
    gl.uniform1i(this.locations.image,0);gl.viewport(0,0,this.canvas.width,this.canvas.height);
    this.ready=true;this.error=null;
  }
  render(source,corners,settings) {
    if(!this.ready) return null;
    const key=JSON.stringify(corners);
    if(key!==this.cache){try{this.h=homography(corners);this.cache=key}catch(e){this.error=e.message;return null}}
    const h=this.h, gl=this.gl;
    gl.useProgram(this.program);gl.bindTexture(gl.TEXTURE_2D,this.texture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
    gl.uniformMatrix3fv(this.locations.surface,false,new Float32Array([h[0],h[3],h[6],h[1],h[4],h[7],h[2],h[5],1]));
    gl.uniform1f(this.locations.brightness,settings.brightness/100);gl.uniform1f(this.locations.feather,settings.feather/100);
    gl.uniform1f(this.locations.oval,settings.mask==='ellipse'?1:0);
    gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);this.frames++;
    return this.canvas;
  }
  inspect(){return{renderer:this.ready?'perspective-webgl':'canvas-fallback',frames:this.frames,error:this.error};}
  dispose(){
    this.disposed=true;this.ready=false;
    this.canvas.removeEventListener('webglcontextlost',this.onLost);
    this.canvas.removeEventListener('webglcontextrestored',this.onRestored);
    if(this.gl){this.gl.deleteTexture(this.texture);this.gl.deleteBuffer(this.buffer);this.gl.deleteProgram(this.program);}
    this.texture=this.buffer=this.program=null;
  }
}

export function drawCalibration(ctx) {
  ctx.fillStyle='#171922';ctx.fillRect(0,0,1280,720);
  ctx.lineWidth=2;ctx.strokeStyle='#ddd8ea';
  for(let x=0;x<=1280;x+=80){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,720);ctx.stroke()}
  for(let y=0;y<=720;y+=80){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1280,y);ctx.stroke()}
  ctx.strokeStyle='#d8c1ff';ctx.lineWidth=5;ctx.strokeRect(3,3,1274,714);
  ctx.beginPath();ctx.arc(640,360,160,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#fff';ctx.font='bold 32px system-ui';ctx.textAlign='center';ctx.fillText('WISP · SURFACE ALIGNMENT',640,110);
  ctx.font='18px system-ui';ctx.fillText('Keep the circle round and the grid straight on the physical surface',640,625);
  ctx.textAlign='left';ctx.fillText('TOP LEFT',20,35);ctx.textAlign='right';ctx.fillText('TOP RIGHT',1260,35);
  ctx.textAlign='left';ctx.fillText('BOTTOM LEFT',20,690);ctx.textAlign='right';ctx.fillText('BOTTOM RIGHT',1260,690);
}

export function mountMappingControls(api) {
  const box=document.createElement('details');box.className='panel projection-mapping';box.id='projectionSetup';
  box.innerHTML=`<summary>Projection studio <small>Fit Wisp to your surface</small></summary>
    <p class="help">Choose a surface, drag its four corners, then fine-tune brightness. Changes appear on the silent projector immediately.</p>
    <div class="row"><button data-surface="sheet">Floating sheet</button><button data-surface="window">Haunted window</button><button data-surface="portrait">Living portrait</button></div>
    <div class="mapping-editor"><canvas width="640" height="360" aria-label="Surface corner editor"></canvas><div class="mapping-handles"></div></div>
    <p class="help">Drag a corner or focus it and use arrow keys. Shift + arrow makes a larger adjustment. Black stays outside the mapped surface.</p>
    <div class="twocol"><label>Brightness <output id="mappingBrightnessValue"></output><input id="mappingBrightness" type="range" min="20" max="150"></label><label>Soft edge <output id="mappingFeatherValue"></output><input id="mappingFeather" type="range" min="0" max="20"></label></div>
    <label>Scenery<select id="mappingScene"><option value="void">Floating Wisp · pure black</option><option value="window">Enchanted mansion · painted scene</option></select></label>
    <label>Surface mask<select id="mappingMask"><option value="none">Rectangle</option><option value="ellipse">Oval portrait</option></select></label>
    <label class="checkline"><input id="mappingTest" type="checkbox"> Show alignment pattern on projector</label>
    <div class="row"><button id="mappingSave">Save surface</button><button id="mappingExport">Export surface</button><label class="mapping-import">Import surface<input id="mappingImport" type="file" accept="application/json,.json"></label></div>
    <p id="mappingStatus" class="help" role="status" aria-live="polite">Surface changes stay local to this browser.</p>`;
  document.querySelector('main>section').append(box);
  const editor=box.querySelector('canvas'),ctx=editor.getContext('2d'),handles=box.querySelector('.mapping-handles'),names=['Top left','Top right','Bottom right','Bottom left'];
  let dragging=null,lastDraw=0,dirty=true;
  const status=text=>box.querySelector('#mappingStatus').textContent=text;
  const update=()=>{const s=api.settings();for(const k of ['brightness','feather']){box.querySelector('#mapping'+k[0].toUpperCase()+k.slice(1)).value=s[k];box.querySelector('#mapping'+k[0].toUpperCase()+k.slice(1)+'Value').textContent=s[k]+'%'}box.querySelector('#mappingMask').value=s.mask;box.querySelector('#mappingScene').value=s.scene||'void';box.querySelector('#mappingTest').checked=s.testPattern;api.corners().forEach((p,i)=>{const b=handles.children[i];b.style.left=p[0]+'%';b.style.top=p[1]+'%';b.setAttribute('aria-label',`${names[i]} corner, X ${p[0].toFixed(1)}, Y ${p[1].toFixed(1)}`)});dirty=true;};
  const change=(i,p)=>{const corners=api.corners().map(x=>[...x]);corners[i]=p.map(x=>Math.max(0,Math.min(100,x)));if(api.setCorners(corners)){update();status('Surface adjusted. Save when aligned.')}else status('Keep the surface convex; corners cannot cross.');};
  names.forEach((name,i)=>{const b=document.createElement('button');b.className='mapping-handle';b.textContent=String(i+1);b.type='button';
    b.onpointerdown=e=>{e.preventDefault();dragging=i;b.setPointerCapture(e.pointerId);};
    b.onpointermove=e=>{if(dragging!==i)return;const r=editor.getBoundingClientRect();change(i,[(e.clientX-r.left)/r.width*100,(e.clientY-r.top)/r.height*100]);};
    b.onpointerup=b.onpointercancel=()=>dragging=null;
    b.onkeydown=e=>{const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!delta)return;e.preventDefault();const step=e.shiftKey?2:.2;change(i,api.corners()[i].map((n,j)=>n+delta[j]*step));};handles.append(b);});
  for(const k of ['brightness','feather'])box.querySelector('#mapping'+k[0].toUpperCase()+k.slice(1)).oninput=e=>{api.settings()[k]=+e.target.value;update()};
  box.querySelector('#mappingScene').onchange=e=>{api.settings().scene=e.target.value;update()};
  box.querySelector('#mappingMask').onchange=e=>{api.settings().mask=e.target.value;update()};
  box.querySelector('#mappingTest').onchange=e=>{api.settings().testPattern=e.target.checked;update()};
  box.querySelectorAll('[data-surface]').forEach(b=>b.onclick=()=>{const presets={sheet:[[2,2],[98,2],[98,98],[2,98]],window:[[17,12],[83,12],[83,88],[17,88]],portrait:[[32,5],[68,5],[68,95],[32,95]]};api.setCorners(presets[b.dataset.surface]);Object.assign(api.settings(),mappingDefaults(),{mask:b.dataset.surface==='portrait'?'ellipse':'none',scene:b.dataset.surface==='window'?'window':'void'});update();status(b.textContent+' loaded. Align it to the physical surface.');});
  const exportData=()=>({format:'hauntedpuppet-surface',version:1,stage:api.stage(),mapping:{...api.settings(),testPattern:false}});
  box.querySelector('#mappingSave').onclick=()=>{try{api.save();status('Surface saved. It will restore when you reopen this browser.')}catch{status('Browser storage unavailable. Export the surface instead.')}};
  box.querySelector('#mappingExport').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(exportData(),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='wisp-surface.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  box.querySelector('#mappingImport').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>16000)throw Error('Surface file is too large');const d=JSON.parse(await file.text());if(d.format!=='hauntedpuppet-surface'||d.version!==1||!validMapping(d.mapping)||!api.validStage(d.stage))throw Error('Choose a valid Wisp surface export');api.import(d);update();status('Surface imported. Save it to keep it.')}catch(err){status(err.message)}finally{e.target.value='';}};
  function draw(now){if(box.open&&(dirty||now-lastDraw>100)){ctx.drawImage(api.preview(),0,0,640,360);ctx.strokeStyle='#d8c1ff';ctx.lineWidth=2;ctx.beginPath();api.corners().forEach((p,i)=>ctx[i?'lineTo':'moveTo'](p[0]*6.4,p[1]*3.6));ctx.closePath();ctx.stroke();lastDraw=now;dirty=false;}requestAnimationFrame(draw);}
  update();requestAnimationFrame(draw);window.addEventListener('haunt-stage-reset',update);return{refresh:update};
}
