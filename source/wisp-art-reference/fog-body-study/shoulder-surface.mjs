// Original local rig experiment: bind the root region to the same deformed
// surface as the torso, releasing smoothly into the articulated arm.
// Technique reference only: Live2D Glue; no implementation copied.
export function shoulderSurfacePoint(skinned,rest,root,radius,torsoPoint){
 const distance=Math.hypot(rest[0]-root[0],rest[1]-root[1]);
 const t=Math.max(0,Math.min(1,distance/Math.max(1,radius)));
 const weight=1-t*t*(3-2*t);
 if(weight===0)return skinned;
 const target=torsoPoint(rest[0],rest[1]);
 return [skinned[0]+(target[0]-skinned[0])*weight,skinned[1]+(target[1]-skinned[1])*weight];
}
