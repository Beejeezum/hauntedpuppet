/** Framing pilot: fit the COMPLETE source-space effect, never just the body.
 * This does not recover upstream clipping. Render to an overscan surface first.
 * No smoothing here: a lerped unsafe transform would permit transient clipping.
 */
export function effectFrame(boxes,{width=1280,height=720,margin=.15,scale=1,offsetX=0,offsetY=0}={}){
 if(![width,height,margin,scale,offsetX,offsetY].every(Number.isFinite)||width<=0||height<=0||margin<0||margin>=.5||scale<=0)throw Error('Invalid effect frame settings');
 const valid=boxes.filter(b=>b&&[b.minX,b.minY,b.maxX,b.maxY].every(Number.isFinite)&&b.maxX>=b.minX&&b.maxY>=b.minY);
 if(!valid.length)return null;
 const bounds={minX:Math.min(...valid.map(b=>b.minX)),maxX:Math.max(...valid.map(b=>b.maxX)),minY:Math.min(...valid.map(b=>b.minY)),maxY:Math.max(...valid.map(b=>b.maxY))};
 const safe={minX:width*margin,maxX:width*(1-margin),minY:height*margin,maxY:height*(1-margin)};
 const s=Math.min(scale,(safe.maxX-safe.minX)/Math.max(1e-9,bounds.maxX-bounds.minX),(safe.maxY-safe.minY)/Math.max(1e-9,bounds.maxY-bounds.minY));
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const x=clamp(width/2+offsetX-s*(bounds.minX+bounds.maxX)/2,safe.minX-s*bounds.minX,safe.maxX-s*bounds.maxX);
 const y=clamp(height/2+offsetY-s*(bounds.minY+bounds.maxY)/2,safe.minY-s*bounds.minY,safe.maxY-s*bounds.maxY);
 return{scale:s,x,y,sourceBounds:bounds,safe,bounds:{minX:x+s*bounds.minX,maxX:x+s*bounds.maxX,minY:y+s*bounds.minY,maxY:y+s*bounds.maxY}};
}
