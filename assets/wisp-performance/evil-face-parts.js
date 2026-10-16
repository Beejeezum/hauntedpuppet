/** Painted demon anatomy from the approved concept. No baked eye inside the ridges. */
export class PaintedEvilFaceParts{
 async load(base='/assets/wisp-performance/front-kit/'){
  const response=await fetch(base+'evil-face-parts.json');if(!response.ok)throw Error('Evil face components unavailable');
  this.manifest=await response.json();this.image=new Image();this.image.src=base+this.manifest.image;await this.image.decode();
  if(this.image.width!==this.manifest.canvas[0]||this.image.height!==this.manifest.canvas[1])throw Error('Evil face canvas mismatch');
  for(const name of ['ridgeLeft','ridgeRight','socket','iris','fang','lowerLid']){
   const r=this.manifest.components[name]?.rect;if(!r||!r.every(Number.isFinite)||r[0]<0||r[1]<0||r[2]<=0||r[3]<=0||r[0]+r[2]>this.image.width||r[1]+r[3]>this.image.height)throw Error('Invalid painted evil component '+name);
  }
  this.ready=true;return this;
 }
 part(ctx,name,x,y,w,h){const rect=this.manifest.components[name].rect;ctx.drawImage(this.image,...rect,x-w/2,y-h/2,w,h);}
 aspect(name){const r=this.manifest.components[name].rect;return r[3]/r[2];}
}
