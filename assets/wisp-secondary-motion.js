/** Secondary acting for the painted rig. Native 1024×1536 pixels, radians, seconds.
 * Root velocity is supplied in native pixels/second; angular velocity is radians/second.
 * The caller owns its clock: paused holds a pose, freeze resets to the exact reference.
 * No timers, randomness, audio, DOM or artwork changes.
 */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
const smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v)};
const STEP=1/120;
const JOINTS={leftArm:[9,.82,.32],rightArm:[8.2,.85,.32],leftWrist:[6.3,.78,.18],rightWrist:[5.8,.82,.18],tail:[5.2,.78,.30],torso:[8.3,.94,.055],head:[10,.96,.085],leftShoulder:[11,.98,6],rightShoulder:[10.2,.98,6]};
function targetAt(t,velocity,action,actionAt){
 const vx=clamp(velocity?.x,-1000,1000),vy=clamp(velocity?.y,-800,800),angular=clamp(velocity?.angular,-3,3),intro=smooth(t/.8);
 // Different slow phrasing for each appendage; no shared bob oscillator or random jitter.
 const leftIdle=(Math.sin(t*.79)*.055+Math.sin(t*.31+.7)*.018)*intro;
 const rightIdle=(Math.sin(t*.63+.8)*.049+Math.sin(t*.27)*.021)*intro;
 const tailIdle=(Math.sin(t*.52-.4)*.07+Math.sin(t*.19)*.03)*intro;
 const anticipation=['turn','leave','enter','exit','pace'].includes(action)&&Number.isFinite(actionAt)&&actionAt>=0&&actionAt<.65?Math.sin(Math.PI*actionAt/.65)**2:0;
 const turn=action==='turn'?-1:1;
 return {leftArm:leftIdle-vx*.00025+vy*.000065-anticipation*.08*turn,
  rightArm:rightIdle-vx*.00021-vy*.000065+anticipation*.055*turn,
  leftWrist:-vx*.00010+leftIdle*.65+anticipation*.04*turn,
  rightWrist:-vx*.00012+rightIdle*.6-anticipation*.03*turn,
  tail:tailIdle-vx*.00038-angular*.035+anticipation*.1*turn,
  torso:Math.sin(t*.46-.3)*.018*intro-vx*.000025,
  head:-vx*.000045-angular*.022+Math.sin(t*.43)*.009*intro,
  leftShoulder:Math.sin(t*.74)*1.6*intro-vy*.0025-anticipation*2,
  rightShoulder:Math.sin(t*.59+.5)*1.3*intro-vy*.002+anticipation*1.2};
}
export class WispSecondaryMotion{
 constructor(){this.reset();}
 reset(clock=0){this.clock=Number.isFinite(clock)?Math.max(0,clock):0;this.accumulator=0;this.pauseOffset=0;this.simClock=this.clock;this.joints={};for(const key of Object.keys(JOINTS))this.joints[key]={value:0,velocity:0};this.current=this.compose(this.clock,false,true);this.resets=(this.resets||0)+1;return this.current;}
 compose(t,reduced=false,freeze=false){
  const amount=freeze?0:reduced?.16:1,intro=smooth(t/.8),j=this.joints,v=key=>j[key].value*amount;
  const body={dx:(Math.sin(t*.37)*2.8+Math.sin(t*.17)*1.2)*intro*amount,dy:(Math.sin(t*.83)*5+Math.sin(t*.29+.4)*2)*intro*amount,rotation:Math.sin(t*.41)*.006*intro*amount};
  return {body,shoulders:{left:v('leftShoulder'),right:v('rightShoulder')},arms:{left:v('leftArm'),right:v('rightArm')},wrists:{left:v('leftWrist'),right:v('rightWrist')},tail:{rotation:v('tail'),dx:-v('tail')*12,dy:Math.sin(t*.57)*3*intro*amount},torso:{rotation:v('torso'),dx:v('torso')*9,dy:Math.abs(v('torso'))*7},head:{rotation:v('head'),dx:-v('head')*16,dy:-Math.abs(v('head'))*8},left:v('leftArm'),right:v('rightArm'),tailRotation:v('tail'),clock:t,reduced,freeze,source:'fixed-step-damped-painted-joints'};
 }
 sample({clock=0,velocity={},action='idle',actionAt=0,paused=false,reduced=false,freeze=false}={}){
  const now=Number.isFinite(clock)?Math.max(0,clock):0;
  if(freeze){this.reset(now);this.current=this.compose(now,reduced,true);return structuredClone(this.current);}
  if(paused){if(now<this.clock)this.reset(now);else{this.pauseOffset+=Math.max(0,now-this.clock);this.clock=now;}return structuredClone(this.current);}
  if(now<this.clock||now-this.clock>.25)this.reset(now);
  const dt=clamp(now-this.clock,0,.25);this.clock=now;this.accumulator+=dt;
  while(this.accumulator+1e-10>=STEP){this.simClock+=STEP;const target=targetAt(this.simClock,velocity,action,actionAt-(now-this.pauseOffset-this.simClock));
   for(const [key,[frequency,damping,bound]]of Object.entries(JOINTS)){const joint=this.joints[key],goal=clamp(target[key],-bound,bound),acceleration=frequency*frequency*(goal-joint.value)-2*damping*frequency*joint.velocity;joint.velocity=clamp(joint.velocity+acceleration*STEP,-bound*14,bound*14);joint.value=clamp(joint.value+joint.velocity*STEP,-bound,bound);}
   this.accumulator-=STEP;
  }
  this.current=this.compose(now-this.pauseOffset,reduced);return structuredClone(this.current);
 }
 inspect(){return {...structuredClone(this.current),resets:this.resets,accumulator:this.accumulator,joints:structuredClone(this.joints)};}
}
