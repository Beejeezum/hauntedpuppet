import {PhonePaintedMouthLayer} from './phone-painted-mouth-layer.mjs';
import {NativeLipSurface} from './native-lip-surface.mjs';
/** Opt-in study. Native body pixels and contour time come from ONE presented
 * video frame. Only the cropped snapshot enters WebGL, in a later render task.
 * This improves registration provenance; it does not approve artwork or speech.
 */
export class PhoneNativeLipLayer extends PhonePaintedMouthLayer{
 constructor(){super({mouth:new NativeLipSurface()});this.snapshot=document.createElement('canvas');this.snapshot.width=1916;this.snapshot.height=1080;this.captureEpoch=0;this.snapshots=0;this.video=null;this.frameReady=false;this.mediaTime=null;this.captureFailure=false;}
 begin(value){this.captureFailure=false;return super.begin(value);}
 watch(video){
  if(this.video===video)return;if(typeof video.requestVideoFrameCallback!=='function')throw Error('Native face study needs presented-frame callbacks');this.unwatch();this.video=video;const epoch=this.captureEpoch;
  const capture=(_,metadata)=>{if(this.disposed||epoch!==this.captureEpoch||!this.graph||this.video!==video)return;
   try{if(!Number.isFinite(metadata.mediaTime))throw Error('Native frame timestamp unavailable');this.snapshot.getContext('2d').drawImage(video,0,0);this.mediaTime=metadata.mediaTime;this.frameReady=true;this.snapshots++;}catch{this.captureFailure=true;this.unwatch();return;}
   this.callback=video.requestVideoFrameCallback(capture);
  };this.callback=video.requestVideoFrameCallback(capture);
 }
 unwatch(){this.captureEpoch=(this.captureEpoch||0)+1;if(this.callback!==undefined)this.video?.cancelVideoFrameCallback?.(this.callback);this.callback=undefined;this.video=null;this.frameReady=false;this.mediaTime=null;}
 render(video){
  if(!this.advanceWeights(video))return null;if(this.captureFailure)throw Error('Native body snapshot unavailable');this.watch(video);if(!this.frameReady)return null;
  const opening=1-(this.weights.rest??1);if(opening<=.0001)return this.snapshot;
  const ctx=this.canvas.getContext('2d');ctx.drawImage(this.snapshot,0,0);if(!this.mouth.draw(ctx,this.snapshot,this.mediaTime,opening))return this.snapshot;this.draws++;return this.canvas;
 }
 inspect(){return{...super.inspect(),sourceKind:'native-pixels',snapshots:this.snapshots,watching:!!this.video,frameReady:this.frameReady,mediaTime:this.mediaTime,captureFailure:this.captureFailure};}
 stop(){this.unwatch();super.stop();}
 dispose(){if(this.disposed)return;super.dispose();this.snapshot.width=this.snapshot.height=1;}
}
