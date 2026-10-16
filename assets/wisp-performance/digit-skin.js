/** Artist-placed digit roots/tips in the unchanged arm paintings (source pixels).
 * Soft local bend controls preserve the wrist/upper arm; these are not new hand drawings.
 */
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export const DIGITS={
 right:[{root:[815,800],tip:[850,650],width:88},{root:[910,817],tip:[1045,750],width:82},{root:[940,870],tip:[1060,890],width:78},{root:[880,935],tip:[960,1000],width:80}],
 left:[{root:[410,785],tip:[320,600],width:100},{root:[305,820],tip:[170,740],width:94},{root:[300,900],tip:[170,920],width:86},{root:[350,960],tip:[280,1030],width:86}]
};
export function bindDigits(x,y,side){
 const list=DIGITS[side];if(!list)throw Error('Unknown painted hand '+side);
 const bindings=[];
 for(let i=0;i<list.length;i++){
  const d=list[i],dx=d.tip[0]-d.root[0],dy=d.tip[1]-d.root[1],length=Math.hypot(dx,dy),u=((x-d.root[0])*dx+(y-d.root[1])*dy)/(length*length),across=Math.abs((x-d.root[0])*dy-(y-d.root[1])*dx)/length;
  const weight=smooth(u/.7)*(1-smooth((u-1.2)/.8))*(1-smooth(across/d.width));
  if(weight>0)bindings.push({digit:i,root:d.root,weight});
 }
 const total=bindings.reduce((n,b)=>n+b.weight,0);if(total>1)for(const b of bindings)b.weight/=total;return bindings;
}
export function digitAngles(clock,side,energy=1,evil=0){
 const phase=side==='left'?1.7:0,sign=side==='left'?-1:1;
 return DIGITS[side].map((_,i)=>sign*energy*(.085*Math.sin(clock*1.55+phase-i*.75)+evil*.045*Math.sin(clock*2.15+phase-i*.9)));
}
export function bendDigit(x,y,binding,angles){
 let px=x,py=y;for(const b of binding){const angle=angles[b.digit],dx=x-b.root[0],dy=y-b.root[1],c=Math.cos(angle),s=Math.sin(angle);px+=(dx*c-dy*s-dx)*b.weight;py+=(dx*s+dy*c-dy)*b.weight;}return[px,py];
}
