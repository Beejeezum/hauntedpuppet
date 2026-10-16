// Front-only shape correspondence pilot. No evil turnaround is implied.
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
 render(form){
  const t=clamp(form,0,1),v=this.mesh.vertices;
  for(let i=0;i<v.length;i+=2){v[i]=mix(this.from.v[i],this.to.v[i],t);v[i+1]=this.from.v[i+1];}
  this.mesh.geometry.getBuffer('aPosition').update();this.cute.shader.resources.turnUniforms.uniforms.uBlend=t;
 }
 dispose(){this.cute.destroy();this.evil.destroy();this.mesh.destroy({texture:true,textureSource:true});this.evil.mesh.destroy({texture:true,textureSource:true});}
}
