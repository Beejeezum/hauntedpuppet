const mix=(a,b,t)=>a+(b-a)*t;
function describe(image,rect){
 const canvas=document.createElement('canvas');canvas.width=rect[2];canvas.height=rect[3];const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,...rect,0,0,...rect.slice(2));const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;let sum=0,x=0,y=0;
 for(let yy=0;yy<canvas.height;yy++)for(let xx=0;xx<canvas.width;xx++){const weight=data[(yy*canvas.width+xx)*4+3]/255;sum+=weight;x+=xx*weight;y+=yy*weight;}if(sum<1)throw Error('Empty painted brow');x/=sum;y/=sum;
 let xx=0,yy=0,xy=0;for(let row=0;row<canvas.height;row++)for(let col=0;col<canvas.width;col++){const weight=data[(row*canvas.width+col)*4+3]/255,dx=col-x,dy=row-y;xx+=weight*dx*dx;yy+=weight*dy*dy;xy+=weight*dx*dy;}const angle=.5*Math.atan2(2*xy,xx-yy),c=Math.cos(angle),s=Math.sin(angle);let left=Infinity,right=-Infinity;
 for(let row=0;row<canvas.height;row++)for(let col=0;col<canvas.width;col++)if(data[(row*canvas.width+col)*4+3]>80){const p=(col-x)*c+(row-y)*s;left=Math.min(left,p);right=Math.max(right,p);}
 return{image,rect,x,y,angle,span:Math.max(1,right-left),width:canvas.width,height:canvas.height};
}
function endpoint(source,center,width,rotation){const scale=width/source.width,dx=(source.x-source.width/2)*scale,dy=(source.y-source.height/2)*scale,c=Math.cos(rotation),s=Math.sin(rotation);return{center:[center[0]+dx*c-dy*s,center[1]+dx*s+dy*c],length:source.span*scale,angle:source.angle+rotation};}
/** Registered material morph: both paintings share one centroid and principal axis. */
export class PaintedBrowMorph{
 constructor(eyes,parts){this.sources={};for(const label of ['Left','Right'])this.sources[label]={cute:describe(eyes.atlas,eyes.manifest.components['brow'+label].rect),evil:describe(parts.image,parts.manifest.components['ridge'+label].rect)};this.canvas=document.createElement('canvas');this.canvas.width=512;this.canvas.height=384;this.ctx=this.canvas.getContext('2d');this.current={};}
 draw(ctx,{label,form,width,brow,eyeY,eyeHeight,rotation,browOffset=0}){
  const sources=this.sources[label],A=endpoint(sources.cute,brow,width*.66,rotation),B=endpoint(sources.evil,[brow[0],eyeY-eyeHeight*.22+browOffset],width*1.3,rotation);
  const center=A.center.map((v,i)=>mix(v,B.center[i],form)),angle=A.angle+Math.atan2(Math.sin(B.angle-A.angle),Math.cos(B.angle-A.angle))*form,length=mix(A.length,B.length,form),paint=this.ctx;
  this.current[label]={center,angle,length,sharedCentroid:true,sharedAxis:true,blend:form};
  if(form<=0||form>=1){const source=form>=1?sources.evil:sources.cute,w=width*(form>=1?1.3:.66),h=w*source.height/source.width,at=form>=1?[brow[0],eyeY-eyeHeight*.22+browOffset]:brow;ctx.save();ctx.translate(at[0],at[1]);ctx.rotate(rotation);ctx.drawImage(source.image,...source.rect,-w/2,-h/2,w,h);ctx.restore();return;}
  paint.clearRect(0,0,512,384);paint.globalCompositeOperation='lighter';
  for(const[source,alpha]of [[sources.cute,1-form],[sources.evil,form]]){if(alpha<.0001)continue;paint.save();paint.globalAlpha=alpha;paint.translate(256,192);paint.rotate(angle-source.angle);const scale=length/source.span;paint.scale(scale,scale);paint.drawImage(source.image,...source.rect,-source.x,-source.y,source.width,source.height);paint.restore();}
  paint.globalCompositeOperation='source-over';ctx.drawImage(this.canvas,center[0]-256,center[1]-192);this.current[label]={center,angle,length,sharedCentroid:true,sharedAxis:true,blend:form};
 }
 inspect(){return this.current;}
}
