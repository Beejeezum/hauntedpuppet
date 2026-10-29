const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v||0));
/** Painted assets remain the source of iris, brow and mouth detail. */
function patch(image,rect,{key=false}={}){
 const c=document.createElement('canvas');c.width=rect[2];c.height=rect[3];const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(image,...rect,0,0,c.width,c.height);
 if(key){const p=x.getImageData(0,0,c.width,c.height);for(let y=0;y<c.height;y++){let left=c.width,right=-1;for(let xx=0;xx<c.width;xx++){const i=(y*c.width+xx)*4;if(Math.max(p.data[i],p.data[i+1],p.data[i+2])>25){left=Math.min(left,xx);right=xx;}}for(let xx=0;xx<c.width;xx++){const i=(y*c.width+xx)*4;p.data[i+3]=Math.round(255*clamp(Math.min(xx-left+1,right-xx+1)/2));}}x.putImageData(p,0,0);}
 else {x.globalCompositeOperation='destination-in';const g=x.createRadialGradient(c.width/2,c.height/2,0,c.width/2,c.height/2,c.width*.55);g.addColorStop(0,'white');g.addColorStop(.65,'white');g.addColorStop(1,'transparent');x.fillStyle=g;x.fillRect(0,0,c.width,c.height);}
 return c;
}
export class ScaryPaintedFace {
 constructor(reference,whiteEyes,mouths){this.reference=reference;this.whiteEyes=whiteEyes;this.canvas=document.createElement('canvas');this.canvas.width=512;this.canvas.height=410;this.ctx=this.canvas.getContext('2d');this.brows=[patch(reference,[368,450,108,51]),patch(reference,[584,531,85,36])];this.tiles=[];const scale=mouths.width/1254;for(const rect of [[26,346,296,142],[370,348,222,143],[658,301,230,224],[939,322,300,204],[33,754,270,132],[382,704,192,210],[633,743,297,161],[1004,745,173,147]])this.tiles.push(patch(mouths,rect.map(v=>v*scale),{key:true}));}
 eye(x,{rect,cx,cy,iris,angle},blink,gx,gy){
  const [sx,sy,w,h]=rect,open=1-clamp(blink);x.save();x.translate(cx,cy);x.rotate(angle);x.beginPath();x.ellipse(0,0,w*.48,Math.max(1,h*.47*open),0,0,Math.PI*2);x.clip();x.rotate(-angle);x.translate(-cx,-cy);x.drawImage(this.whiteEyes,sx,sy,w,h,sx,sy,w,h);
  const r=29,ix=cx+gx*12,iy=cy+gy*9;x.save();x.beginPath();x.ellipse(ix,iy,r,r,0,0,Math.PI*2);x.clip();x.drawImage(this.reference,...iris,ix-r,iy-r,r*2,r*2);x.restore();x.restore();
 }
 draw(p){const x=this.ctx;x.clearRect(0,0,512,410);x.save();x.translate(-260,-365);
  this.eye(x,{rect:[385,493,112,98],cx:440,cy:548,iris:[411,521,58,58],angle:.52},p.blinkL,p.gazeX,p.gazeY);
  this.eye(x,{rect:[540,552,108,78],cx:588,cy:591,iris:[560,564,58,58],angle:-.27},p.blinkR,p.gazeX,p.gazeY);
  for(const [i,cx,cy,b]of [[0,422,476,p.browL],[1,626,549,p.browR]]){x.save();x.translate(cx,cy-b*10);x.rotate((i?1:-1)*b*.08);x.drawImage(this.brows[i],-this.brows[i].width/2,-this.brows[i].height/2);x.restore();}
  const jaw=clamp(p.jaw)*(1-clamp(p.press)*.8),round=clamp(p.round),open=clamp(jaw/.12),width=244*(1+clamp(p.wide)*.10-round*.28),height=108+60*Math.pow(jaw,.75);
  x.save();x.translate(500,650+(height-108)*.5);x.rotate(.20+(clamp(p.smileR)-clamp(p.smileL))*.10);
  const draw=(index,alpha,h)=>{if(alpha<=0)return;x.globalAlpha=alpha;x.drawImage(this.tiles[index],-width/2,-h/2,width,h);};
  draw(p.press>.5?4:0,(1-open)*(1-round),108);draw(7,(1-open)*round,108);draw(p.smile>.4?3:2,open*(1-round),height);draw(5,open*round,height);x.restore();x.restore();return this.canvas;
 }
}
