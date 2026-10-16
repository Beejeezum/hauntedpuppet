/** Local acting controls for the painted mesh. Units are registered artwork pixels.
 * Springs retain velocity across interruptions; no audio or device ownership here.
 */
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const CONTROL_KEYS=['head','chest','tail','left','right','crest',
 'leftShoulder','leftElbow','leftWrist','rightShoulder','rightElbow','rightWrist'];
export const CONTROL_RADII=[235,220,270,115,115,210,130,125,105,130,125,105];
export function controlAnchors(pose){
 const out=Object.fromEntries(['head','chest','tail','left','right'].map(k=>[k,[...pose[k]]]));
 out.crest=[pose.head[0]-15,pose.head[1]-340];
 for(const side of ['left','right']){
  const sign=side==='left'?-1:1,hand=pose[side];
  const shoulder=[pose.chest[0]+sign*105,pose.chest[1]-110];
  // Elbows describe a bent chain rather than translating the entire arm as a hand.
  const elbow=pose[side+'Elbow']||[shoulder[0]+(hand[0]-shoulder[0])*.52,
   shoulder[1]+(hand[1]-shoulder[1])*.52+38];
  out[side+'Shoulder']=shoulder;out[side+'Elbow']=[...elbow];
  out[side+'Wrist']=[elbow[0]+(hand[0]-elbow[0])*.76,elbow[1]+(hand[1]-elbow[1])*.76];
 }
 return out;
}
function spring(cell,target,dt,frequency){
 // Exact critically damped step for a target held during this frame.
 const w=frequency,offset=cell.x-target,b=cell.v+w*offset,e=Math.exp(-w*dt);
 cell.x=target+(offset+b*dt)*e;cell.v=(cell.v-w*b*dt)*e;
}
export class PerformanceMotionRig{
 constructor(){this.channels=new Map();this.lastTime=null;this.activity=0;}
 sample(base,p={}){
  const t=Number.isFinite(p.clock)?p.clock:0,dt=clamp(p.dt??1/60,0,.05),still=!!(p.freeze||p.reduced);
  const reset=this.lastTime===null||t<this.lastTime;this.lastTime=t;
  const energy=still?0:clamp((p.motion?.float??80)/100,0,1.2);
  const target=controlAnchors(base),action=p.action||{},at=Math.max(0,action.at||0);
  const envelope=action.kind==='wave'?Math.sin(Math.PI*clamp((at-.35)/2.5))**2:0;
  const speaking=p.state==='speaking',listening=p.state==='listening',tension=clamp(p.evilBlend??0);
  const move=(k,x,y)=>{target[k][0]+=x*energy;target[k][1]+=y*energy;};
  // Thorax leads; the head, crest and tail settle at different rates.
  const inhale=Math.sin(t*1.35),headTurn=clamp(p.performer?.headYaw||0,-1,1)*20;
  move('chest',Math.sin(t*.63)*3,inhale*3);
  move('head',headTurn+(listening?12:0),inhale*5+(listening?9:0));
  move('crest',headTurn+Math.sin(t*1.35-.8)*11,inhale*7+(listening?9:0));
  move('tail',Math.sin(t*1.35-1.15)*21,Math.sin(t*1.35-.75)*6);
  move('head',0,tension*18);move('crest',tension*6,tension*24);move('chest',0,tension*5);
  const angles={};
  for(const side of ['left','right']){
   const sign=side==='left'?-1:1;
   const wave=side==='left'?envelope:0,beat=Math.sin(at*8.5);
   // Hand and elbow have separate arcs. Right hand supplies a smaller counterbalance.
   move(side+'Shoulder',sign*tension*7,inhale*2+tension*8);
   move(side+'Elbow',sign*(Math.sin(t*1.1-.4)*4+tension*14)+wave*beat*7,inhale*4-wave*9-tension*4);
   move(side+'Wrist',sign*(Math.sin(t*1.1-.7)*6+tension*27)+wave*beat*16,inhale*5-wave*12-tension*7);
   move(side,sign*(Math.sin(t*1.1-.95)*8+tension*38)+wave*beat*35,inhale*6-wave*11-tension*10);
   angles[side]=energy*(wave*beat*.18+Math.sin(t*1.1-1.1)*.022*sign+tension*sign*.045);
   if(speaking)move(side,sign*Math.sin(t*2.6+(side==='left'?0:1.3))*6,Math.sin(t*2.6)*3);
  }
  const points={},rotations={};
  for(const key of CONTROL_KEYS){
   points[key]=target[key].map((value,axis)=>{
    const id=key+axis;let cell=this.channels.get(id);
    if(!cell){cell={x:value,v:0};this.channels.set(id,cell);}
    if(reset||still){cell.x=value;cell.v=0;}else spring(cell,value,dt,key==='tail'?8:key==='crest'?10:18);
    return cell.x;
   });
   const id=key+'Angle',value=angles[key]||0;let cell=this.channels.get(id);
   if(!cell){cell={x:value,v:0};this.channels.set(id,cell);}
   if(reset||still){cell.x=value;cell.v=0;}else spring(cell,value,dt,16);
   rotations[key]=cell.x;
  }
  return{points,rotations,controlCount:CONTROL_KEYS.length};
 }
 reset(){this.channels.clear();this.lastTime=null;}
}
