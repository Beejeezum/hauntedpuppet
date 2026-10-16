import {effectFrame} from './effect-frame.js';
/** Render body and its world-space wake BEFORE fitting their complete extent.
 * The overscan surface preserves particles outside the character's source canvas.
 * Hold the largest symmetric envelope until blackout/rewind; never chase each puff.
 */
export class SpiritFrame {
 constructor(){
  this.canvas=document.createElement('canvas');this.canvas.width=1280;this.canvas.height=720;this.ctx=this.canvas.getContext('2d');
  this.surface=document.createElement('canvas');this.paint=this.surface.getContext('2d');this.reset();
 }
 reset(){this.halfWidth=640;this.halfHeight=360;this.lastClock=null;this.current={ready:false};}
 render(bodyCanvas,fx,params,stage){
  const {clock=0,visible=1,body,emissionPoints=[]}=params;
  this.ctx.clearRect(0,0,1280,720);
  if(visible<=.001){fx.clear();this.reset();return this.canvas;}
  if(this.lastClock!==null&&clock<this.lastClock)this.reset();this.lastClock=clock;
  const old=fx.bounds(),points=emissionPoints||[];
  const xs=[0,1280,old?.minX??0,old?.maxX??1280,body?.minX??0,body?.maxX??1280,...points.map(p=>p.x)];
  const ys=[0,720,old?.minY??0,old?.maxY??720,body?.minY??0,body?.maxY??720,...points.map(p=>p.y)];
  // 256px includes a newborn's maximum 140px raster extent, rotation and one
  // clamped simulation step. Round allocation to tiles to avoid resize churn.
  const left=Math.floor((Math.min(...xs)-256)/128)*128,top=Math.floor((Math.min(...ys)-256)/128)*128;
  const width=Math.ceil((Math.max(...xs)+256-left)/128)*128,height=Math.ceil((Math.max(...ys)+256-top)/128)*128;
  if(width>4096||height>4096||![left,top,width,height].every(Number.isFinite))throw Error('Invalid complete spirit extent');
  if(this.surface.width!==width)this.surface.width=width;if(this.surface.height!==height)this.surface.height=height;
  const ctx=this.paint;ctx.clearRect(0,0,width,height);ctx.save();ctx.translate(-left,-top);
  fx.draw(ctx,params);ctx.drawImage(bodyCanvas,0,0,1280,720);ctx.restore();
  const fog=fx.bounds(),boxes=[{minX:0,minY:0,maxX:1280,maxY:720},body,fog].filter(Boolean);
  for(const b of boxes){
   if(b.minX<left||b.maxX>left+width||b.minY<top||b.maxY>top+height)throw Error('Spirit overscan failed to contain complete effect');
   this.halfWidth=Math.max(this.halfWidth,640-b.minX,b.maxX-640);this.halfHeight=Math.max(this.halfHeight,360-b.minY,b.maxY-360);
  }
  const held={minX:640-this.halfWidth,maxX:640+this.halfWidth,minY:360-this.halfHeight,maxY:360+this.halfHeight};
  const frame=effectFrame([held],{margin:Math.max(.15,Math.min(.2,stage.margin/100)),scale:stage.scale/100,offsetX:stage.x*12.8,offsetY:stage.y*7.2});
  this.ctx.drawImage(this.surface,frame.x+left*frame.scale,frame.y+top*frame.scale,width*frame.scale,height*frame.scale);
  this.current={ready:true,margin:Math.max(.15,stage.margin/100),frame,fog,overscan:{left,top,width,height},sourceRect:{x:frame.x,y:frame.y,w:1280*frame.scale,h:720*frame.scale}};
  return this.canvas;
 }
 inspect(){return this.current;}
 dispose(){this.canvas.width=this.surface.width=1;this.canvas.height=this.surface.height=1;this.reset();}
}
