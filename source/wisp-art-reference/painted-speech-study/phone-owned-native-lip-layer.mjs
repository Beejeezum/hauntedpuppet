import {PhoneNativeLipLayer} from './phone-native-lip-layer.mjs';
import {OwnedVideoFrameSource} from '../../wisp-performance-reference/ambient-show/owned-video-frame-source.mjs';
/** Private detached-picture integration. No runtime selector/public build entry.
 * Source owns continuous body pixels, even outside speech. Mouth uses that same
 * packet's canvas + browser-reported timestamp (frame registration unverified); no native video is sampled by the mouth surface.
 */
export class PhoneOwnedNativeLipLayer extends PhoneNativeLipLayer{
 constructor(){super();this.frameSource=new OwnedVideoFrameSource();this.pullPromise=null;this.pullEpoch=0;}
 render(video){
  if(this.disposed)return null;
  const epoch=this.pullEpoch,pull=this.frameSource.pull(video);
  if(pull!==this.pullPromise){this.pullPromise=pull;pull.catch(()=>{if(!this.disposed&&epoch===this.pullEpoch)this.captureFailure=true;});}
  if(this.captureFailure)throw Error('Owned body picture unavailable');
  const packet=this.frameSource.packet;if(!packet)return null;
  this.mediaTime=packet.time;this.frameReady=true;this.snapshots=this.frameSource.inspect().published;
  if(!this.advanceWeights(video))return packet.canvas;
  const opening=1-(this.weights.rest??1);if(opening<=.0001)return packet.canvas;
  const ctx=this.canvas.getContext('2d');ctx.drawImage(packet.canvas,0,0);
  if(!this.mouth.draw(ctx,packet.canvas,packet.time,opening))return packet.canvas;
  this.draws++;return this.canvas;
 }
 inspect(){return{...super.inspect(),sourceKind:'owned-rgba',registration:'unverified-browser-timestamp',owned:this.frameSource?.inspect()??null};}
 stop(){this.pullEpoch=(this.pullEpoch||0)+1;this.frameSource?.stop();this.pullPromise=null;super.stop();}
 dispose(){if(this.disposed)return;super.dispose();this.frameSource?.dispose();}
}
