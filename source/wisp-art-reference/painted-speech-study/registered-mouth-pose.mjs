const cache=new WeakMap();
/** Denoise candidate orientation/scale; never move or rescale the original movie. */
export function registeredMouthPose(data,seconds){
 if(!data||!Array.isArray(data.frames)||!data.frames.length||!Number.isFinite(seconds))return null;
 let poses=cache.get(data);if(!poses){
  const weights=[1,2,3,2,1],frames=data.frames;
  poses=frames.map((frame,index)=>{let scale=0,rotation=0;
   for(let offset=-2;offset<=2;offset++){const neighbor=frames[Math.max(0,Math.min(frames.length-1,index+offset))],w=weights[offset+2]/9;scale+=neighbor.scale*w;rotation+=neighbor.rotationDegrees*w;}
   return{...frame,center:[...frame.center],scale:Math.max(.98,Math.min(1.02,scale)),rotationDegrees:rotation};
  });cache.set(data,poses);
 }
 // A 24fps movie still displays frame N until the next frame boundary.
 // Rounding instead selected N+1 up to half a frame before its picture.
 return poses[Math.max(0,Math.min(poses.length-1,Math.floor(seconds*24+1e-7)))];
}
