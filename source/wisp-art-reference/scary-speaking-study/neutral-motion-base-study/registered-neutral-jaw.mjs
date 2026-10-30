import {NeutralPoseRegistration} from './neutral-pose-registration.mjs';
import {NeutralMovingJaw} from './neutral-moving-jaw.mjs';

/** Private adapter: current picture paint plus a landmark-bounded pose, never its clock.
 * Unrecognized pictures keep their original closed mouth. The caller owns packet
 * lifetime and the destination canvas. This owns only its matcher and jaw renderer.
 */
export class RegisteredNeutralJaw {
 constructor(profile,observations,oral,options){
  this.registration=new NeutralPoseRegistration(profile,observations);
  try{this.jaw=new NeutralMovingJaw(observations,oral,options);}
  catch(error){this.registration.dispose();throw error;}
  this.disposed=false;this.draws=0;this.heldClosed=0;
 }
 draw(context,packet,opening){
  if(this.disposed)throw Error('Registered jaw disposed');
  if(!Number.isFinite(opening)||opening<0||opening>1)throw Error('Invalid mouth opening');
  const source=packet?.canvas;
  if(!source||source.width!==1088||source.height!==704||context.canvas.width!==1088||context.canvas.height!==704||context.canvas===source)throw Error('Use separate native-size source and destination pictures');
  const pose=this.registration.match(packet);
  this.draws++;
  if(!pose){context.clearRect(0,0,1088,704);context.drawImage(source,0,0);this.heldClosed++;return{pose:null,heldClosed:true};}
  const result=this.jaw.draw(context,source,pose.poseFrame,opening);
  return{pose,heldClosed:false,...result};
 }
 inspect(){return{disposed:this.disposed,draws:this.draws,heldClosed:this.heldClosed,registration:this.registration.inspect(),jaw:this.jaw.inspect()};}
 dispose(){if(this.disposed)return;this.disposed=true;this.registration.dispose();this.jaw.dispose();}
}
