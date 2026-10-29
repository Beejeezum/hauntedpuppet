const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ORIGIN=[260,365];
function softPatch(image,rect){const c=document.createElement('canvas');c.width=rect[2];c.height=rect[3];const x=c.getContext('2d');x.drawImage(image,...rect,0,0,c.width,c.height);x.globalCompositeOperation='destination-in';const g=x.createRadialGradient(c.width/2,c.height/2,c.height*.12,c.width/2,c.height/2,c.width*.51);g.addColorStop(0,'white');g.addColorStop(.63,'white');g.addColorStop(1,'transparent');x.fillStyle=g;x.fillRect(0,0,c.width,c.height);return c;}
export class PaintedFace {
 constructor(reference,whiteEyes,mouths){this.reference=reference;this.whiteEyes=whiteEyes;this.mouths=mouths;this.canvas=document.createElement('canvas');this.canvas.width=512;this.canvas.height=410;this.ctx=this.canvas.getContext('2d');this.brows=[softPatch(reference,[360,420,116,51]),softPatch(reference,[553,448,124,62])];this.tiles=[];const w=mouths.width/4,h=mouths.height/2;for(let i=0;i<8;i++)this.tiles.push(softPatch(mouths,[(i%4)*w,Math.floor(i/4)*h,w,h]));}
 drawEye(x,eye,blink,gazeX,gazeY){
  const {rect,cx,cy,iris,crease}=eye,[sx,sy,w,h]=rect;const open=1-clamp(blink);x.save();
  x.beginPath();x.moveTo(sx+2,sy+h*.61);x.bezierCurveTo(sx+w*.13,sy+h*(.61-.58*open),sx+w*.76,sy+h*(.61-.67*open),sx+w-2,sy+h*.64);x.bezierCurveTo(sx+w*.92,sy+h*(.63+.35*open),sx+w*.20,sy+h*(.64+.32*open),sx+2,sy+h*.61);x.closePath();x.clip();
  // Painted whites and iris, masked by anatomically moving eyelids. The iris
  // never scales vertically when blinking and cannot escape the eye socket.
  x.drawImage(this.whiteEyes,sx,sy,w,h,sx,sy,w,h);
  const r=37,ix=cx+gazeX*20,iy=cy+gazeY*15;x.save();x.beginPath();x.ellipse(ix,iy,r,r,0,0,Math.PI*2);x.clip();x.drawImage(this.reference,...iris,ix-r,iy-r,r*2,r*2);x.restore();x.restore();
  if(blink>.03){x.save();x.strokeStyle='#503c38';x.globalAlpha=.75;x.lineWidth=2.6;x.lineCap='round';x.beginPath();x.moveTo(sx+3,sy+h*.61);x.bezierCurveTo(sx+w*.18,sy+h*(.61-.58*open),sx+w*.75,sy+h*(.61-.65*open),sx+w-3,sy+h*.64);x.stroke();x.restore();}
 }
 draw(p){const x=this.ctx;x.clearRect(0,0,512,410);x.save();x.translate(-ORIGIN[0],-ORIGIN[1]);
  this.drawEye(x,{rect:[341,497,123,110],cx:411,cy:557,iris:[374,520,74,74]},p.blinkL,p.gazeX,p.gazeY);
  this.drawEye(x,{rect:[531,531,124,106],cx:581,cy:589,iris:[544,552,74,74]},p.blinkR,p.gazeX,p.gazeY);
  for(const [i,cx,cy,b] of [[0,418,446,p.browL],[1,615,479,p.browR]]){x.save();x.translate(cx,cy-b*15);x.rotate((i?1:-1)*b*.055);x.drawImage(this.brows[i],-this.brows[i].width/2,-this.brows[i].height/2);x.restore();}
  x.save();x.translate(489,644);x.rotate(.12+((p.smileR||0)-(p.smileL||0))*.12);const jaw=clamp(p.jaw)*(1-(p.press||0)*.8),round=clamp(p.round),width=144*(1+p.smile*.20+(p.wide||0)*.20)*(1-round*.25),height=144*(.12+.88*Math.pow(jaw,.8)),fade=clamp(jaw/.10);
  if(fade<1){x.globalAlpha=(1-fade)*(1-round);x.drawImage(this.tiles[0],-72,-72,144,144);x.globalAlpha=(1-fade)*round;x.drawImage(this.tiles[7],-width/2,-72,width,144);}
  if(fade>0){x.globalAlpha=fade*(1-round);x.drawImage(this.tiles[2],-width/2,-height/2,width,height);if(p.smile>.25){x.globalAlpha=fade*(1-round)*clamp((p.smile-.25)/.75);x.drawImage(this.tiles[3],-width/2,-height/2,width,height);}x.globalAlpha=fade*round;x.drawImage(this.tiles[5],-width/2,-height/2,width,height);}
  x.restore();x.restore();return this.canvas;
 }
}
