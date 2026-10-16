const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v)};
/** Dissolve the body while retaining a separately painted pair of eyes. No audio ownership. */
export class ApparitionPerformance {
 constructor(){this.canvas=document.createElement('canvas');this.canvas.width=1280;this.canvas.height=720;this.ctx=this.canvas.getContext('2d');this.ready=false;this.active=false;this.amount=0;}
 async load(){try{this.eyes=new Image();this.eyes.src='/assets/spirit-effects/floating-eyes.png';await this.eyes.decode();if(this.eyes.width!==1935||this.eyes.height!==813)throw Error('Eye atlas canvas mismatch');this.ready=true;}catch(e){this.error=e.message;}}
 render(source,{action,rig,haunting=false,visible=1,reduced=false,eyesSurface=null}={}){
  const at=action?.at;this.nativeReady=!!eyesSurface;this.source=eyesSurface?'native-painted-eye-rig':'painted-isolated-eyes';this.active=(this.ready||this.nativeReady)&&!!rig?.bounds&&(!!eyesSurface||!!rig?.pose)&&!reduced&&action?.kind==='phantom'&&Number.isFinite(at)&&at>=0&&at<6;
  if(!this.active){this.amount=0;return source;}
  const amount=at<1.15?ease(at/1.15):at<3.9?1:1-ease((at-3.9)/2.1);this.amount=amount;const ctx=this.ctx;ctx.clearRect(0,0,1280,720);ctx.drawImage(source,0,0);
  // A feathered top-to-bottom erosion keeps a contour during disappearance/reformation.
  const b=rig.bounds,cut=b.minY+(b.maxY-b.minY+150)*amount-75,g=ctx.createLinearGradient(0,cut-70,0,cut+70);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,1)');ctx.save();ctx.globalCompositeOperation='destination-in';ctx.fillStyle=g;ctx.fillRect(0,0,1280,720);ctx.restore();
  if(eyesSurface){ctx.save();ctx.globalAlpha=ease(amount*3);ctx.drawImage(eyesSurface,0,0);ctx.restore();return this.canvas;}
  const p=rig.pose;ctx.save();ctx.globalAlpha=clamp(visible)*ease(amount*3);ctx.translate(640+p.dx,360+p.dy);ctx.rotate(p.rotation);ctx.scale(p.scaleX,p.scaleY);ctx.translate(-512,-768);
  if(haunting)ctx.drawImage(this.eyes,1010,275,900,310,290,439,444,153);else ctx.drawImage(this.eyes,70,240,810,340,275,525,500,210);
  ctx.restore();return this.canvas;
 }
 inspect(){return{ready:this.ready||!!this.nativeReady,active:this.active,dissolve:this.amount,source:this.source||'painted-isolated-eyes',error:this.error||null};}
}
