// Extra cartoon arm volume releases during tight elbow folds, where the
// forearm crosses the upper arm. Baseline width remains the lower bound.
export function armVolumeFloor(joints){
 const a=[joints[1][0]-joints[0][0],joints[1][1]-joints[0][1]],b=[joints[2][0]-joints[1][0],joints[2][1]-joints[1][1]];
 const length=Math.hypot(...a)*Math.hypot(...b);if(length<1e-9)return 0;
 const bend=Math.acos(Math.max(-1,Math.min(1,(a[0]*b[0]+a[1]*b[1])/length)))*180/Math.PI;
 const u=Math.max(0,Math.min(1,(bend-125)/25));return 1.35*(1-u*u*(3-2*u));
}
