/** Local facial acting in registered artwork coordinates. No audio, timers or new artwork. */
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
export function facialActing(p={}, {clock=0,freeze=false,reduced=false,blink=0,gaze='center',form='friendly'}={}){
 const t=Number.isFinite(clock)?Math.max(0,clock):0,amount=freeze?0:reduced?.18:1;
 const speech=p.state==='speaking',jaw=speech?clamp(p.jaw??(1-(p.weights?.rest??1))):0;
 const listening=['listening','preparing'].includes(p.state),beat=Math.max(0,Math.sin(t*.83+.4))**6,reply=speech?Math.sin(t*3.7)*.5+.5:0;
 return {enabled:amount>0,source:'registered-raster-regions',form,
  leftBrow:{dy:(-9*beat-(listening?5:0)-3*reply)*amount,rotation:(-.025*beat)*amount},
  rightBrow:{dy:(-6*Math.max(0,Math.sin(t*.83-.6))**6-(listening?2:0))*amount,rotation:.018*beat*amount},
  leftEye:{dx:0,dy:(gaze==='down'?7:Math.sin(t*.61)*1.8)*amount,blink:freeze?0:clamp(blink)},
  rightEye:{dx:0,dy:(gaze==='down'?7:Math.sin(t*.61-.3)*1.5)*amount,blink:freeze?0:clamp((blink-.09)/.91)},
  mouth:{dy:jaw*5*amount,scaleX:1+Math.sin(t*5.3)*jaw*.025*amount,scaleY:1+jaw*.075*amount},
  limitation:form==='haunting'?'Painted brow and lid remain fused; left/right eye masks act independently.':'Brows use local painted regions; pupils remain authored gaze cels.'};
}
export const blinkExpression=(value,fallback)=>value>.70?'blink':value>.12?'half-blink':fallback;
export function withMouthActing(ctx,draw,anchor,acting){if(!acting?.enabled){draw();return;}ctx.save();ctx.translate(anchor[0],anchor[1]+acting.mouth.dy);ctx.scale(acting.mouth.scaleX,acting.mouth.scaleY);ctx.translate(-anchor[0],-anchor[1]);draw();ctx.restore();}
/** Texture-preserving vertical warp, pinned at region edges so neighboring eyes never leak into a brow. */
export function warpPaintedBrow(ctx,image,rect,dy){const [x,y,w,h]=rect;for(let row=0;row<h;row+=2){const height=Math.min(2,h-row),weight=Math.sin(Math.PI*(row+height/2)/h)**2,sourceY=Math.max(y,Math.min(y+h-height,y+row-dy*weight));ctx.drawImage(image,x,sourceY,w,height,x,y+row,w,height);}}
