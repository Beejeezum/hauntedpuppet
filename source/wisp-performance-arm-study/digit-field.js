// Four artist-registered digits on continuous-arm-v1.png. Source pixels, not screen offsets.
export const DIGITS=[
 {root:[1290,418],tip:[1410,270],width:90},
 {root:[1430,435],tip:[1610,435],width:85},
 {root:[1450,530],tip:[1620,595],width:80},
 {root:[1385,590],tip:[1490,710],width:80}
];
const smooth=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n)};
export function bind(x,y){const bindings=[];DIGITS.forEach((d,digit)=>{const dx=d.tip[0]-d.root[0],dy=d.tip[1]-d.root[1],length=Math.hypot(dx,dy),u=((x-d.root[0])*dx+(y-d.root[1])*dy)/(length*length),across=Math.abs((x-d.root[0])*dy-(y-d.root[1])*dx)/length,weight=smooth(u/.7)*(1-smooth((u-1.2)/.8))*(1-smooth(across/d.width));if(weight>0)bindings.push({digit,root:d.root,weight})});const sum=bindings.reduce((n,b)=>n+b.weight,0);if(sum>1)bindings.forEach(b=>b.weight/=sum);return bindings;}
export function angles(clock,energy=1){return DIGITS.map((_,i)=>energy*(.10*Math.sin(clock*1.55-i*.75)+.025*Math.sin(clock*.65+i*1.2)))}
export {bendDigit} from '../../assets/wisp-performance/digit-skin.js';
