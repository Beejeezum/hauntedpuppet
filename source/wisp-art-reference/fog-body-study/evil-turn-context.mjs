// Source-only full-character review adapter. Rear art and turned form morph absent.
import {FrontFormMorph} from './front-form-morph.mjs';
import {PaintedBodyViews} from '/assets/wisp-performance/body-views.js';
const mix=(a,b,t)=>a+(b-a)*t;
const center=f=>{const r=f.rows[Math.round(f.headY)];return(r[1]+r[2])/2;};
const harmonic=(a,b)=>a*b<=0?0:2*a*b/(a+b);
function gap(previous,a,b,next,t,first,last){const d=b-a,m0=first?d:harmonic(a-previous,d),m1=last?d:harmonic(d,next-b),t2=t*t,t3=t2*t;return(2*t3-3*t2+1)*a+(t3-2*t2+t)*m0+(-2*t3+3*t2)*b+(t3-t2)*m1;}
export async function createEvilTurnContext(P,fixtureBase){
 const form=await new FrontFormMorph().load(P),image=new Image();image.src=new URL('body-evil-front-v1.png',import.meta.url).href;await image.decode();
 const url=n=>new URL(n,import.meta.url).href;
 const viewURLs=fixtureBase?{}:{45:url('body-evil-22.5-v1.png'),90:url('body-evil-45-v1.png'),135:url('body-evil-45-v1.png'),180:url('body-evil-45-v1.png')};
 const turns=await new PaintedBodyViews(P).load(image,fixtureBase||new URL('./',import.meta.url).href,{viewURLs}),a=form.cute.reference,b=turns.reference,cols=form.cute.columns+1,rows=turns.rows;
 const samples=turns.samples.slice(0,3).map((B,index)=>{const out={v:form.from.v.slice(),uv:form.from.uv.slice()},f=turns.fields[index],scale=(b.bottom-b.top)/(f.bottom-f.top);
  for(let k=0;k<out.v.length;k+=2){const y=out.v[k+1],source=y<a.headY?mix(b.top,b.headY,(y-a.top)/(a.headY-a.top)):mix(b.headY,b.bottom,(y-a.headY)/(a.bottom-a.headY)),row=Math.max(0,Math.min(rows,(source-b.top+12)/(b.bottom-b.top+24)*rows)),lo=Math.floor(row),hi=Math.min(rows,lo+1),t=row-lo,col=(k/2)%cols,l=(lo*cols+col)*2,h=(hi*cols+col)*2;out.v[k]=(mix(B.v[l],B.v[h],t)-center(b))*scale+center(a);out.uv[k]=mix(B.uv[l],B.uv[h],t);out.uv[k+1]=mix(B.uv[l+1],B.uv[h+1],t);}return out;});
 let mode='front';const restore=()=>{form.cute.shader.resources.uFrom=form.cute.textures[0].source;form.cute.shader.resources.uTo=form.evil.textures[0].source;form.mesh.geometry.getBuffer('aUV').data.set(form.from.uv);form.mesh.geometry.getBuffer('aUV').update();form.mesh.geometry.getBuffer('aNextUV').data.set(form.to.uv);form.mesh.geometry.getBuffer('aNextUV').update();};
 return{mesh:form.mesh,samples:form.cute.samples,shader:form.cute.shader,reference:form.cute.reference,
  render(angle,deform,evil=0){
   if(angle>45.001&&evil>.01)throw Error('Evil rear artwork unavailable');
   if(angle>.001&&evil>.01&&evil<.999)throw Error('Turned form transformation not implemented');
   if(angle>.001&&evil>=.999){const u=Math.min(2,angle/22.5),i=Math.min(1,Math.floor(u)),t=u-i,A=samples[i],B=samples[i+1],previous=samples[Math.max(0,i-1)].v,next=samples[Math.min(2,i+2)].v;
    form.cute.shader.resources.uFrom=turns.textures[i].source;form.cute.shader.resources.uTo=turns.textures[i+1].source;form.cute.shader.resources.turnUniforms.uniforms.uBlend=t;form.mesh.geometry.getBuffer('aUV').data.set(A.uv);form.mesh.geometry.getBuffer('aUV').update();form.mesh.geometry.getBuffer('aNextUV').data.set(B.uv);form.mesh.geometry.getBuffer('aNextUV').update();let x=0;const v=form.mesh.vertices;for(let k=0;k<v.length;k+=2){if((k/2)%cols===0)x=gap(previous[k],A.v[k],B.v[k],next[k],t,i===0,i===1);else x+=gap(previous[k]-previous[k-2],A.v[k]-A.v[k-2],B.v[k]-B.v[k-2],next[k]-next[k-2],t,i===0,i===1);const p=deform(x,A.v[k+1]);v[k]=p[0];v[k+1]=p[1];}form.mesh.geometry.getBuffer('aPosition').update();mode='turn';return;
   }
   if(angle>.001){if(mode!=='cute')form.cute.pair=undefined;form.cute.render(angle,deform);mode='cute';return;}
   if(mode!=='front')restore();mode='front';form.render(evil);const v=form.mesh.vertices;for(let k=0;k<v.length;k+=2){const p=deform(v[k],v[k+1]);v[k]=p[0];v[k+1]=p[1];}form.mesh.geometry.getBuffer('aPosition').update();
  },shoulderSurface(side,y){const row=Math.max(0,Math.min(form.cute.rows,(y-a.top+12)/(a.bottom-a.top+24)*form.cute.rows)),lo=Math.floor(row),hi=Math.min(form.cute.rows,lo+1),t=row-lo,v=form.mesh.vertices,u=side==='left'?.18:.82;const point=col=>[0,1].map(axis=>mix(v[(lo*cols+col)*2+axis],v[(hi*cols+col)*2+axis],t)),left=point(2),right=point(6);return left.map((value,axis)=>mix(value,right[axis],u));},anchor:y=>form.cute.anchor(y),destroy(){form.cute.destroy();form.evil.destroy();form.evil.mesh.destroy({texture:true,textureSource:true});turns.destroy();turns.mesh.destroy({texture:true,textureSource:true});}
 };
}
