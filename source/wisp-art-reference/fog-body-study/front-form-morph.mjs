// Front-only shape correspondence pilot. No evil turnaround is implied.
import {supportMouth} from './jaw-surface.mjs';
import {PaintedBodyViews} from '/assets/wisp-performance/body-views.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
const center=f=>{const r=f.rows[Math.round(f.headY)];return(r[1]+r[2])/2;};
export class FrontFormMorph {
 async load(P){
  const base=new URL('./',import.meta.url).href;
  const image=async name=>{const im=new Image();im.src=base+name;await im.decode();return im;};
  this.cute=await new PaintedBodyViews(P).load(await image('body.png'),base);
  this.evil=await new PaintedBodyViews(P).load(await image('body-evil-front-v1.png'),base);
  this.mesh=this.cute.mesh;const a=this.cute.reference,b=this.evil.reference,A=this.cute.samples[0],B=this.evil.samples[0],columns=this.cute.columns+1,rows=this.evil.rows;
  this.from=A;this.to={v:A.v.slice(),uv:A.uv.slice()};
  for(let k=0;k<A.v.length;k+=2){
   const y=A.v[k+1],source=y<a.headY?mix(b.top,b.headY,(y-a.top)/(a.headY-a.top)):mix(b.headY,b.bottom,(y-a.headY)/(a.bottom-a.headY));
   const row=clamp((source-b.top+12)/(b.bottom-b.top+24)*rows,0,rows),lo=Math.floor(row),hi=Math.min(rows,lo+1),t=row-lo,col=(k/2)%columns,l=(lo*columns+col)*2,h=(hi*columns+col)*2;
   this.to.v[k]=mix(B.v[l],B.v[h],t)+center(a)-center(b);
   this.to.uv[k]=mix(B.uv[l],B.uv[h],t);this.to.uv[k+1]=mix(B.uv[l+1],B.uv[h+1],t);
  }
  this.cute.shader.resources.uFrom=this.cute.textures[0].source;this.cute.shader.resources.uTo=this.evil.textures[0].source;
  this.mesh.geometry.getBuffer('aNextUV').data.set(this.to.uv);this.mesh.geometry.getBuffer('aNextUV').update();
  return this;
 }
 render(form,{mouthBox=null}={}){
  const t=clamp(form,0,1),v=this.mesh.vertices;
  for(let i=0;i<v.length;i+=2){v[i]=mix(this.from.v[i],this.to.v[i],t);v[i+1]=this.from.v[i+1];}
  if(mouthBox)supportMouth(v,this.cute.columns+1,mouthBox);
  this.mesh.geometry.getBuffer('aPosition').update();this.cute.shader.resources.turnUniforms.uniforms.uBlend=t;
 }
 dispose(){this.cute.destroy();this.evil.destroy();this.mesh.destroy({texture:true,textureSource:true});this.evil.mesh.destroy({texture:true,textureSource:true});}
}

/** Native-body adapter for this deliberately front-only evil art pilot. */
export async function createNativeBodyMorph(P){
 const form=await new FrontFormMorph().load(P);let frontMode=true;
 return {
  mesh:form.mesh,samples:form.cute.samples,shader:form.cute.shader,reference:form.cute.reference,
  render(angle,deform,evil=0){
   if(angle>1&&evil>.01)throw Error('Evil fog body pilot has no side/rear artwork');
   if(angle>1){form.cute.render(angle,deform);frontMode=false;return;}
   if(!frontMode){form.cute.shader.resources.uFrom=form.cute.textures[0].source;form.cute.shader.resources.uTo=form.evil.textures[0].source;form.mesh.geometry.getBuffer('aUV').data.set(form.from.uv);form.mesh.geometry.getBuffer('aUV').update();form.mesh.geometry.getBuffer('aNextUV').data.set(form.to.uv);form.mesh.geometry.getBuffer('aNextUV').update();frontMode=true;}
   form.render(evil);const v=form.mesh.vertices;for(let i=0;i<v.length;i+=2){const p=deform(v[i],v[i+1]);v[i]=p[0];v[i+1]=p[1];}form.mesh.geometry.getBuffer('aPosition').update();
  },
  anchor(y){return form.cute.anchor(y);},
  destroy(){form.cute.destroy();form.evil.destroy();form.evil.mesh.destroy({texture:true,textureSource:true});}
 };
}
