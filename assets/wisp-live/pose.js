import {handTargets} from './hands.js';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
const gauss=(x,y,cx,cy,rx,ry)=>Math.exp(-(((x-cx)/rx)**2+((y-cy)/ry)**2));
export const NEUTRAL={jaw:0,round:0,wide:0,press:0,smileL:0,smileR:0,smile:0,blinkL:0,blinkR:0,gazeX:0,gazeY:0,browL:0,browR:0,yaw:0,pitch:0,roll:0};
export function mapPerformer(p,{mirror=true,jawGain=2.4}={}){
 if(!p)return null;const sign=mirror?-1:1;
 return {wide:clamp(p.mouthStretch||0),press:clamp(p.mouthPress||0),smileL:clamp(p.smileLeft??p.smile??0),smileR:clamp(p.smileRight??p.smile??0),jaw:clamp((p.jawOpen-.035)*jawGain)*(1-clamp(p.mouthClose)*.7),round:clamp(Math.max(p.mouthPucker||0,p.mouthFunnel||0)*1.4),smile:clamp(p.smile||0),blinkL:clamp((p.eyeBlinkLeft||0)*1.25+(p.eyeSquintLeft||0)*.22),blinkR:clamp((p.eyeBlinkRight||0)*1.25+(p.eyeSquintRight||0)*.22),gazeX:clamp((p.eyeLookX||0)*sign*2,-1,1),gazeY:clamp(-(p.eyeLookY||0)*2,-1,1),browL:clamp((p.browUpLeft??p.browUp??0)-(p.browDownLeft||0),-.5,1),browR:clamp((p.browUpRight??p.browUp??0)-(p.browDownRight||0),-.5,1),yaw:clamp((p.headYaw||0)*sign,-1,1),pitch:clamp(p.headPitch||0,-1,1),roll:clamp((p.headRoll||0)*sign,-1,1)};
}
export class LivePose {
 constructor(){this.face={...NEUTRAL};this.body={x:0,y:0,vx:0,vy:0};this.lean={x:0,y:0,vx:0,vy:0};this.time=0;this.gesture=null;this.input='automatic';this.hands={left:{arm:0,wrist:0,weight:0},right:{arm:0,wrist:0,weight:0}};}
 cue(kind,time=this.time){if(!['wave','curious','delight','settle'].includes(kind))return false;this.gesture={kind,at:time};return true;}
 sample(dt,time,input,{energy=1,mirror=true,jawGain=2.4,mouthOverride=0,hands=[],eyeGain=3.4}={}){
  dt=clamp(dt,.001,.05);this.time=time;const p=mapPerformer(input,{mirror,jawGain});if(p){p.gazeX=clamp(p.gazeX*eyeGain/2,-1,1);p.gazeY=clamp(p.gazeY*eyeGain/2,-1,1);}this.input=p?'webcam':'automatic';
  const blinkAt=time%5.3;const blink=smooth(1-Math.abs(blinkAt-4.65)/.12);
  const looks=[[-.35,.12],[.18,-.14],[0,.36],[.42,.08],[0,0]],look=looks[Math.floor(time/2.6)%looks.length];
  const auto={...NEUTRAL,gazeX:look[0]+.012*Math.sin(time*7.1),gazeY:look[1]+.009*Math.sin(time*5.4),blinkL:blink,blinkR:blink};const target=p||auto;if(!p)target.jaw=clamp(mouthOverride);
  const g=this.gesture,age=g?time-g.at:99,fade=g&&age<3.5?smooth(Math.min(age/.3,(3.5-age)/.7)):0;
  if(g&&age>=3.5)this.gesture=null;
  if(g?.kind==='curious'){target.roll=clamp(target.roll+.45*fade,-1,1);target.browL=Math.max(target.browL,.55*fade);if(!p)target.gazeY=.3*fade;}
  if(g?.kind==='delight'){target.smile=Math.max(target.smile,.7*fade);target.browL=Math.max(target.browL,.3*fade);target.browR=Math.max(target.browR,.4*fade);}
  for(const k of Object.keys(NEUTRAL)){const speed=k.startsWith('blink')?40:k==='jaw'||k==='round'||k.startsWith('gaze')?32:k==='smile'?18:12;this.face[k]+=(target[k]-this.face[k])*(1-Math.exp(-dt*speed));}
  const spring=(b,tx,ty,stiffness,damping)=>{b.vx+=(tx-b.x)*stiffness*dt;b.vy+=(ty-b.y)*stiffness*dt;b.vx*=Math.exp(-damping*dt);b.vy*=Math.exp(-damping*dt);b.x+=b.vx*dt;b.y+=b.vy*dt;};
  spring(this.body,Math.sin(time*.57)*15*energy,Math.sin(time*.94)*19*energy,24,6);
  spring(this.lean,this.face.yaw*13-this.body.vx*.12,this.face.pitch*9-this.body.vy*.10,36,8);
  const wave=g?.kind==='wave'?fade*(.55+.45*Math.sin(age*9)):0;
  const tracked=handTargets(hands,mirror);for(const side of ['left','right']){const h=this.hands[side],t=tracked[side];for(const [key,value]of Object.entries({arm:t?.arm||0,wrist:t?.wrist||0,weight:t?1:0}))h[key]+=(value-h[key])*(1-Math.exp(-dt*12));}
  const blend=(side,idle,key)=>idle*(1-this.hands[side].weight)+this.hands[side][key]*this.hands[side].weight;
  return {input:this.input,face:{...this.face},clock:time,energy,root:{x:this.body.x,y:this.body.y,rotation:Math.sin(time*.6)*.013*energy},head:{x:this.lean.x,y:this.lean.y,roll:this.face.roll*.13+Math.sin(time*.87)*.012*energy},hands:tracked,arms:{left:blend('left',(Math.sin(time*1.12)*.20+Math.sin(time*.61)*.035)*energy+wave*.90,'arm'),right:blend('right',(Math.sin(time*.93+1.4)*.22+Math.sin(time*.54)*.045)*energy,'arm')},wrists:{left:blend('left',Math.sin(time*1.4+.8)*.19*energy+wave*.12,'wrist'),right:blend('right',Math.sin(time*1.2+2)*.20*energy,'wrist')},tail:{x:Math.sin(time*1.18-1)*42*energy-this.body.vx*.22,y:Math.sin(time*.81)*10*energy},crest:{x:Math.sin(time*.9+1)*12*energy-this.lean.vx*.17},gesture:g?.kind||null};
 }
}
function rotate(x,y,cx,cy,a){const dx=x-cx,dy=y-cy,c=Math.cos(a),s=Math.sin(a);return [cx+dx*c-dy*s,cy+dx*s+dy*c]}
/** A continuous weighted painted mesh: connected shoulder/elbow/wrist regions,
 * head/neck/chin and a trailing core. No independently floating body sprites. */
export function deformPoint(x,y,m){
 const head=1-smooth((y-690)/230),tail=smooth((y-900)/540),face=m.face;
 let xx=x,yy=y;const r=rotate(x,y,510,600,m.head.roll*head);xx+=(r[0]-x)*head+m.head.x*head+face.yaw*18*head;yy+=(r[1]-y)*head+m.head.y*head+face.pitch*10*head;
 const jaw=gauss(x,y,500,702,150,95)*face.jaw;xx+=(x-500)*.028*jaw;yy+=12*jaw;
 const chest=gauss(x,y,510,930,230,250);xx+=(x-510)*.022*Math.sin(m.clock*1.35)*chest*m.energy;yy+=6*Math.sin(m.clock*1.35)*chest*m.energy;
 // Integrate small joint rotations through the smooth influence field. A
 // single large weighted rotation can turn cells inside-out at gesture limits.
 for(const [side,cx,cy,ex,ey,wx,wy] of [['left',335,790,285,820,220,830],['right',657,815,710,865,770,904]]){
  const aa=m.arms[side]/4,wa=m.wrists[side]/4,ac=Math.cos(aa),as=Math.sin(aa),ec=Math.cos(aa*.4),es=Math.sin(aa*.4),wc=Math.cos(wa),ws=Math.sin(wa);
  for(let step=0;step<4;step++){
   const arm=gauss(xx,yy,side==='left'?225:790,side==='left'?805:885,side==='left'?140:150,125)*(1-head*.40);
   if(arm<.00001)continue;
   let dx=xx-cx,dy=yy-cy;xx+=(dx*ac-dy*as-dx)*arm;yy+=(dx*as+dy*ac-dy)*arm;
   const elbow=gauss(xx,yy,ex,ey,105,90)*arm;dx=xx-ex;dy=yy-ey;xx+=(dx*ec-dy*es-dx)*elbow;yy+=(dx*es+dy*ec-dy)*elbow;
   const wrist=gauss(xx,yy,wx,wy,100,100)*arm;dx=xx-wx;dy=yy-wy;xx+=(dx*wc-dy*ws-dx)*wrist;yy+=(dx*ws+dy*wc-dy)*wrist;
  }
 }

 xx+=m.tail.x*tail*tail+(x-512)*.035*tail*Math.sin(m.clock*1.3-y*.004)*m.energy;yy+=m.tail.y*tail;
 const crest=1-smooth((y-220)/250);xx+=m.crest.x*crest;
 return [xx,yy];
}
