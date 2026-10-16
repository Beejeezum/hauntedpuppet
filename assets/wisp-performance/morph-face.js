import {PaintedEvilFaceParts} from './evil-face-parts.js';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
function mouthSurface(image,rect,nativeScale){
 const canvas=document.createElement('canvas');canvas.width=rect[2];canvas.height=rect[3];
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,...rect,0,0,...rect.slice(2));
 const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let l=canvas.width,t=canvas.height,r=0,b=0;
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
  const k=(y*canvas.width+x)*4,brightness=pixels[k]*.2126+pixels[k+1]*.7152+pixels[k+2]*.0722;
  if(pixels[k+3]>80&&brightness<125){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x+1);b=Math.max(b,y+1);}
 }
 if(r<=l||b<=t){l=0;t=0;r=canvas.width;b=canvas.height;}
 return{canvas,ink:{x:l,y:t,width:r-l,height:b-t},width:(r-l)*nativeScale,height:(b-t)*nativeScale};
}
/** A shared painted eye rig and registered mouth aperture, rather than two whole faces. */
export class PaintedMorphFace{
 constructor(eyes,scary){
  this.eyes=eyes;this.mouths=new Map();this.canvas=document.createElement('canvas');this.canvas.width=400;this.canvas.height=240;this.ctx=this.canvas.getContext('2d');
  const maxWidth=Math.max(...scary.tiles.mouths.map(t=>t.bounds.width));
  const aa=eyes.mouthManifest.frames.find(f=>f.name==='aa');
  for(const frame of [...eyes.mouthManifest.frames,{...aa,name:'roar',textureName:'aa'}]){
   const tile=scary.tiles.mouths.find(t=>t.name===frame.name)||scary.tiles.mouths[0],b=tile.bounds;
   const texture=eyes.mouthTextures.get(frame.textureName||frame.name),cute=mouthSurface(texture,[0,0,texture.width,texture.height],130/frame.rect[2]);
   const evil=mouthSurface(scary.art.mouths,[tile.sx+b.left,tile.sy+b.top,b.width,b.height],scary.manifest.atlases.mouths.targetWidth/maxWidth);
   this.mouths.set(frame.name,{cute,evil});
  }
 }
 async load(){this.parts=await new PaintedEvilFaceParts().load();return this;}
 draw(ctx,p,evil){
  this.eyes.draw(ctx,{...p,formBlend:evil,evilParts:this.parts,skipMouth:true,skipBody:true});if(p.eyesOnly)return;
  const selected=this.mouths.has(p.mouth)?p.mouth:'rest',clock=p.clock||0;
  if(!this.mouthWeights||p.freeze||clock<this.lastMouthClock)this.mouthWeights=new Map([[selected,1]]);
  else{const rate=1-Math.exp(-clamp(p.dt??1/60,.001,.05)*60);if(!this.mouthWeights.has(selected))this.mouthWeights.set(selected,0);for(const[name,weight]of this.mouthWeights){const value=weight+((name===selected?1:0)-weight)*rate;if(value<.00001)this.mouthWeights.delete(name);else this.mouthWeights.set(name,value);}const total=[...this.mouthWeights.values()].reduce((a,b)=>a+b,0);for(const[name,weight]of this.mouthWeights)this.mouthWeights.set(name,weight/total);}
  this.lastMouthClock=clock;const layers=[...this.mouthWeights].map(([name,weight])=>({pair:this.mouths.get(name),weight}));let width=0,height=0,cuteHeight=0;for(const layer of layers){width+=layer.weight*mix(layer.pair.cute.width*1.1,layer.pair.evil.width*.8,evil);height+=layer.weight*mix(layer.pair.cute.height,layer.pair.evil.height*.8,evil);cuteHeight+=layer.weight*layer.pair.cute.height;}const w=clamp(width,12,310),h=clamp(height,2,160);
  const angle=clamp(p.viewAngle||0,0,90)*Math.PI/180,perspective=1-.65*Math.sin(angle),mouthWidth=w*perspective,centerX=512+(493-512)*Math.cos(angle)+120*Math.sin(angle);
  const x=200-mouthWidth/2,y=120-h/2,paint=this.ctx;paint.clearRect(0,0,400,240);paint.globalCompositeOperation='lighter';
  for(const layer of layers)for(const [source,alpha]of [[layer.pair.cute,layer.weight*(1-evil)],[layer.pair.evil,layer.weight*evil]]){
   if(alpha<.001)continue;paint.save();paint.globalAlpha=alpha;paint.translate(x,y);paint.scale(mouthWidth/source.ink.width,h/source.ink.height);paint.translate(-source.ink.x,-source.ink.y);paint.drawImage(source.canvas,0,0);paint.restore();
  }
  // Feather only the skin margin outside the registered dark mouth. Keep corners/teeth.
  paint.globalCompositeOperation='destination-in';
  for(const [a,b,horizontal]of [[x,x+mouthWidth,true],[y,y+h,false]]){
   const gradient=paint.createLinearGradient(horizontal?a-17:0,horizontal?0:a-17,horizontal?b+17:0,horizontal?0:b+17),span=b-a+34;
   gradient.addColorStop(0,'transparent');gradient.addColorStop(14/span,'white');gradient.addColorStop(1-14/span,'white');gradient.addColorStop(1,'transparent');paint.fillStyle=gradient;paint.fillRect(0,0,400,240);
  }
  paint.globalCompositeOperation='source-over';const top=655-Math.min(18,cuteHeight/2),centerY=top+h/2;
  ctx.drawImage(this.canvas,centerX-200,centerY-120);if(this.parts?.ready&&evil>.001&&h>18&&p.mouth!=='roar'){const fangHeight=Math.min(56,h*.48),fangWidth=fangHeight*.50*perspective;for(const side of [-1,1]){ctx.save();ctx.globalAlpha*=evil;ctx.translate(centerX+side*mouthWidth*.34,top+h*.08);ctx.scale(side===1?-1:1,1);this.parts.part(ctx,'fang',0,fangHeight/2,fangWidth,fangHeight);ctx.restore();}}this.current={sharedEyes:true,paintedDemonParts:!!this.parts?.ready,registeredMouth:true,mouth:p.mouth,mouthWeights:Object.fromEntries(this.mouthWeights),blend:evil,inkBox:{x:centerX-mouthWidth/2,y:top,width:mouthWidth,height:h}};
 }
 inspect(){return this.current||{sharedEyes:true,registeredMouth:true};}
}
