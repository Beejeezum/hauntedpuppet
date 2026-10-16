const mix=(a,b,t)=>a+(b-a)*t;
function describe(image,rect){
 const canvas=document.createElement('canvas');canvas.width=rect[2];canvas.height=rect[3];const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,...rect,0,0,...rect.slice(2));const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;let sum=0,x=0,y=0;
 for(let yy=0;yy<canvas.height;yy++)for(let xx=0;xx<canvas.width;xx++){const weight=data[(yy*canvas.width+xx)*4+3]/255;sum+=weight;x+=xx*weight;y+=yy*weight;}if(sum<1)throw Error('Empty painted brow');x/=sum;y/=sum;
 let xx=0,yy=0,xy=0;for(let row=0;row<canvas.height;row++)for(let col=0;col<canvas.width;col++){const weight=data[(row*canvas.width+col)*4+3]/255,dx=col-x,dy=row-y;xx+=weight*dx*dx;yy+=weight*dy*dy;xy+=weight*dx*dy;}const angle=.5*Math.atan2(2*xy,xx-yy),c=Math.cos(angle),s=Math.sin(angle);let left=Infinity,right=-Infinity;
 for(let row=0;row<canvas.height;row++)for(let col=0;col<canvas.width;col++)if(data[(row*canvas.width+col)*4+3]>80){const p=(col-x)*c+(row-y)*s;left=Math.min(left,p);right=Math.max(right,p);}
 return{image,rect,x,y,angle,span:Math.max(1,right-left),width:canvas.width,height:canvas.height};
}
// Align each painted brow once; measure its actual curved solid contour per column.
function contour(source){
 const canvas=document.createElement('canvas');canvas.width=384;canvas.height=192;const ctx=canvas.getContext('2d',{willReadFrequently:true}),scale=300/source.span;
 ctx.translate(192,96);ctx.scale(scale,scale);ctx.rotate(-source.angle);ctx.drawImage(source.image,...source.rect,-source.x,-source.y,source.width,source.height);
 const pixels=ctx.getImageData(0,0,384,192).data,profile=[];
 for(let x=0;x<384;x++){let top=192,bottom=-1;for(let y=0;y<192;y++)if(pixels[(y*384+x)*4+3]>80){top=Math.min(top,y);bottom=Math.max(bottom,y);}profile.push(bottom<top?null:{center:(top+bottom)/2,half:Math.max(1,(bottom-top+1)/2)});}
 // Continue the neighboring profile through the halo-only columns, retaining original glow.
 const valid=profile.map((p,i)=>p?i:-1).filter(i=>i>=0);for(let x=0;x<384;x++)if(!profile[x]){let nearest=valid[0];for(const i of valid)if(Math.abs(i-x)<Math.abs(nearest-x))nearest=i;profile[x]={...profile[nearest]};}
 return{canvas,profile};
}
function sharedContour(a,b,form){
 const canvas=document.createElement('canvas');canvas.width=384;canvas.height=192;const ctx=canvas.getContext('2d');ctx.globalCompositeOperation='lighter';
 for(let x=0;x<384;x++){
  const A=a.profile[x],B=b.profile[x];if(!A&&!B)continue;const center=mix(A?.center??B.center,B?.center??A.center,form),half=mix(A?.half??0,B?.half??0,form);
  for(const[source,p,alpha]of [[a,A,1-form],[b,B,form]]){if(!p||alpha<.0001)continue;const ratio=half/p.half;ctx.globalAlpha=alpha;ctx.drawImage(source.canvas,x,0,1,192,x,center-p.center*ratio,1,192*ratio);}
 }
 ctx.globalCompositeOperation='source-over';return canvas;
}
function endpoint(source,center,width,rotation){const scale=width/source.width,dx=(source.x-source.width/2)*scale,dy=(source.y-source.height/2)*scale,c=Math.cos(rotation),s=Math.sin(rotation);return{center:[center[0]+dx*c-dy*s,center[1]+dx*s+dy*c],length:source.span*scale,angle:source.angle+rotation};}
/** Registered shape/material morph: both paintings follow one curved contour. */
export class PaintedBrowMorph{
 constructor(eyes,parts){this.sources={};for(const label of ['Left','Right'])this.sources[label]={cute:describe(eyes.atlas,eyes.manifest.components['brow'+label].rect),evil:describe(parts.image,parts.manifest.components['ridge'+label].rect)};this.canvas=document.createElement('canvas');this.canvas.width=512;this.canvas.height=384;this.ctx=this.canvas.getContext('2d');this.contours={};this.contourCache={};for(const label of ['Left','Right']){this.contours[label]={cute:contour(this.sources[label].cute),evil:contour(this.sources[label].evil)};this.contourCache[label]=new Map();}const start=performance.now();for(const label of ['Left','Right'])for(let i=0;i<=32;i++)this.contourCache[label].set(i,sharedContour(this.contours[label].cute,this.contours[label].evil,i/32));this.preparationMs=performance.now()-start;this.current={};}
 draw(ctx,{label,form,width,brow,eyeY,eyeHeight,rotation,browOffset=0}){
  const sources=this.sources[label],A=endpoint(sources.cute,brow,width*.66,rotation),B=endpoint(sources.evil,[brow[0],eyeY-eyeHeight*.22+browOffset],width*1.3,rotation);
  const center=A.center.map((v,i)=>mix(v,B.center[i],form)),angle=A.angle+Math.atan2(Math.sin(B.angle-A.angle),Math.cos(B.angle-A.angle))*form,length=mix(A.length,B.length,form),paint=this.ctx;
  this.current[label]={center,angle,length,sharedCentroid:true,sharedAxis:true,blend:form};
  if(form<=0||form>=1){const source=form>=1?sources.evil:sources.cute,w=width*(form>=1?1.3:.66),h=w*source.height/source.width,at=form>=1?[brow[0],eyeY-eyeHeight*.22+browOffset]:brow;ctx.save();ctx.translate(at[0],at[1]);ctx.rotate(rotation);ctx.drawImage(source.image,...source.rect,-w/2,-h/2,w,h);ctx.restore();return;}
  // Two adjacent prewarped frames keep interpolation continuous without per-frame strip work.
  const step=form*32,low=Math.floor(step),high=Math.min(32,low+1),fraction=step-low,cache=this.contourCache[label],sourcesAligned=this.contours[label];
  for(const index of [low,high])if(!cache.has(index))cache.set(index,sharedContour(sourcesAligned.cute,sourcesAligned.evil,index/32));
  // Render in the destination's pixel space, so the original art can enter/leave
  // the warp without an extra endpoint resampling step (notably in WebKit).
  const matrix=ctx.getTransform(),deviceX=matrix.a*center[0]+matrix.c*center[1]+matrix.e,deviceY=matrix.b*center[0]+matrix.d*center[1]+matrix.f,originX=Math.floor(deviceX-256),originY=Math.floor(deviceY-192),edge=Math.min(form,1-form)/.06,q=Math.min(1,edge),strength=q*q*(3-2*q);
  paint.setTransform(1,0,0,1,0,0);paint.clearRect(0,0,512,384);paint.setTransform(matrix.a,matrix.b,matrix.c,matrix.d,matrix.e-originX,matrix.f-originY);paint.globalCompositeOperation='lighter';
  if(strength<1){const source=form<.5?sources.cute:sources.evil;paint.save();paint.globalAlpha=1-strength;paint.translate(...center);paint.rotate(angle-source.angle);const scale=length/source.span;paint.scale(scale,scale);paint.drawImage(source.image,...source.rect,-source.x,-source.y,source.width,source.height);paint.restore();}
  for(const[index,alpha]of [[low,(1-fraction)*strength],[high,fraction*strength]]){if(alpha<.0001)continue;paint.save();paint.globalAlpha=alpha;paint.translate(...center);paint.rotate(angle);const scale=length/300;paint.scale(scale,scale);paint.drawImage(cache.get(index),-192,-96);paint.restore();}
  paint.globalCompositeOperation='source-over';ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(this.canvas,originX,originY);ctx.restore();this.current[label]={center,angle,length,sharedCentroid:true,sharedAxis:true,sharedContour:true,cachedFrames:cache.size,blend:form};
 }
 destroy(){for(const cache of Object.values(this.contourCache)){for(const canvas of cache.values())canvas.width=canvas.height=0;cache.clear();}for(const pair of Object.values(this.contours))for(const source of Object.values(pair))source.canvas.width=source.canvas.height=0;this.canvas.width=this.canvas.height=0;this.sources={};}
 inspect(){return this.current;}
}
