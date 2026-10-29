import {PhoneNativeLipLayer} from './phone-native-lip-layer.mjs';
import {OwnedVideoFrameSource} from '../../wisp-performance-reference/ambient-show/owned-video-frame-source.mjs';
/** Opt-in unapproved detached-picture director study. Default route is unchanged.
 * A standalone layer owns its source; the director can lend a persistent one.
 * Mouth uses the same detached packet as body paint. Optional picture matching
 * identifies contours; a browser timestamp alone is not a verified frame ID.
 */
export class PhoneOwnedNativeLipLayer extends PhoneNativeLipLayer{
 constructor({registration=null,frameSource=null}={}){super();this.registration=registration;this.registrationResult=null;this.ownsFrameSource=!frameSource;this.frameSource=frameSource||new OwnedVideoFrameSource();this.pullPromise=null;this.pullEpoch=0;}
 render(video){
  if(this.disposed)return null;
  const epoch=this.pullEpoch,pull=this.frameSource.pull(video);
  if(pull!==this.pullPromise){this.pullPromise=pull;pull.catch(()=>{if(!this.disposed&&epoch===this.pullEpoch)this.captureFailure=true;});}
  if(this.captureFailure)throw Error('Owned body picture unavailable');
  const packet=this.frameSource.packet;if(!packet)return null;
  this.mediaTime=packet.time;this.frameReady=true;this.snapshots=this.frameSource.inspect().published;
  if(!this.advanceWeights(video))return packet.canvas;
  const registered=this.registration?.match(packet);this.registrationResult=registered??null;if(this.registration&&!registered)return packet.canvas;const contourTime=registered?.time??packet.time;
  const opening=1-(this.weights.rest??1);if(opening<=.0001)return packet.canvas;
  const ctx=this.canvas.getContext('2d');ctx.drawImage(packet.canvas,0,0);
  if(!this.mouth.draw(ctx,packet.canvas,contourTime,opening))return packet.canvas;
  this.draws++;return this.canvas;
 }
 inspect(){return{...super.inspect(),sourceKind:'owned-rgba',ownsFrameSource:this.ownsFrameSource,registration:this.registration?'picture-match-study':'unverified-browser-timestamp',registeredFrame:this.registrationResult?.frame??null,registrationMetrics:this.registration?.inspect()??null,owned:this.frameSource?.inspect()??null};}
 stop(){this.pullEpoch=(this.pullEpoch||0)+1;if(this.ownsFrameSource)this.frameSource?.stop();this.pullPromise=null;this.registrationResult=null;this.registration?.reset();super.stop();}
 dispose(){if(this.disposed)return;super.dispose();if(this.ownsFrameSource)this.frameSource?.dispose();this.registration?.dispose();}
}
