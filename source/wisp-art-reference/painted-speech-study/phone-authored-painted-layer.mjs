import {PhonePaintedMouthLayer} from './phone-painted-mouth-layer.mjs';
import {OwnedVideoFrameSource} from '../../wisp-performance-reference/ambient-show/owned-video-frame-source.mjs';
import {NativePaintedFaceStudy} from './authored-face-study/native-painted-face-study.mjs';
const assets=[
 ['./authored-face-study/friendly-painted-mouth-mesh-candidate-v1.json','c5a80ef9fe36ab5c33415c8537c12c079561a789e0d7889809b3d42b4cfc8e20'],
 ['./native-lip-mesh-study/friendly-native-lip-candidates-v1.json','89bf67ffb376604bc58a1ebc6d65df5f5f71d74475d6df8deefc02b6852b3ff0'],
 ['./authored-face-study/wisp-friendly-speech-design-v1-anchor-study.json','0c89c561c43b56a427f502fb1ca294a9d016f645aa3dc7d3130b478a5e5210ca'],
 ['./authored-face-study/wisp-friendly-speech-design-v1.png','53fb90cc32fd065ca64456f03261ab370e1a2263da8a49cb366754091e254c34']
];
async function readAsset([path,expected],signal){
 const response=await fetch(new URL(path,import.meta.url),{signal});if(!response.ok)throw Error('Painted face asset unavailable');
 if(Number(response.headers.get('content-length'))>6*1024*1024)throw Error('Painted face asset too large');
 const bytes=await response.arrayBuffer();if(!bytes.byteLength||bytes.byteLength>6*1024*1024)throw Error('Invalid painted face asset size');
 const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
 if(hash!==expected)throw Error('Painted face asset identity mismatch');return bytes;
}
/** Private candidate adapter for the phone director. Explicit unapproved app preview only.
 * Four authored shape weights drive original skin + painted oral material.
 * No mouth is drawn without a matched picture ID; no timestamp-only fallback.
 */
export class PhoneAuthoredPaintedLayer extends PhonePaintedMouthLayer{
 constructor({frameSource=null,registration=null}={}){
  super({mouth:{ready:false,dispose(){}}});this.frameSource=frameSource||new OwnedVideoFrameSource();this.ownsFrameSource=!frameSource;this.registration=registration;this.registrationResult=null;this.abort=new AbortController();this.loading=null;this.pullPromise=null;this.captureFailure=false;this.pullEpoch=0;
 }
 load(){
  if(this.disposed)return Promise.reject(Error('Painted face retired'));if(this.mouth.ready)return Promise.resolve(true);if(this.loading)return this.loading;
  this.loading=(async()=>{let bitmap;try{
   const signal=AbortSignal.any([this.abort.signal,AbortSignal.timeout(15000)]),bytes=await Promise.all(assets.map(asset=>readAsset(asset,signal)));
   bitmap=await createImageBitmap(new Blob([bytes[3]],{type:'image/png'}));if(this.disposed||signal.aborted)throw Error('Painted face preparation cancelled');
   if(bitmap.width!==1024||bitmap.height!==1536)throw Error('Painted face artwork dimensions changed');
   const [mesh,contours,anchors]=bytes.slice(0,3).map(b=>JSON.parse(new TextDecoder().decode(b)));
   const rig=new NativePaintedFaceStudy(mesh,contours,anchors,bitmap);rig.ready=true;this.mouth=rig;return true;
  }catch(error){this.dispose();throw error;}finally{bitmap?.close();}})();return this.loading;
 }
 begin(value){this.captureFailure=false;return super.begin(value);}
 render(video){
  if(this.disposed||video?.tagName!=='VIDEO')return null;const epoch=this.pullEpoch,pull=this.frameSource.pull(video);
  if(pull!==this.pullPromise){this.pullPromise=pull;pull.catch(()=>{if(!this.disposed&&epoch===this.pullEpoch)this.captureFailure=true;});}
  if(this.captureFailure)throw Error('Owned body picture unavailable');const packet=this.frameSource.packet;if(!packet)return null;
  if(!this.mouth.ready||!this.advanceWeights(video))return packet.canvas;
  const match=this.registration?.match(packet);this.registrationResult=match??null;if(!match)return packet.canvas;
  const weights=['rest','AH','OO','EE'].map(k=>this.weights[k]||0);if(1-weights[0]<=.0001)return packet.canvas;
  const ctx=this.canvas.getContext('2d');ctx.drawImage(packet.canvas,0,0);this.mouth.draw(ctx,packet.canvas,match.frame,weights);this.draws++;return this.canvas;
 }
 inspect(){return{...super.inspect(),sourceKind:'authored-owned-rgba',ownsFrameSource:this.ownsFrameSource,registration:'authored-picture-match-study',registeredFrame:this.registrationResult?.frame??null,registrationMetrics:this.registration?.inspect()??null,owned:this.frameSource.inspect(),captureFailure:this.captureFailure};}
 stop(){this.pullEpoch=(this.pullEpoch||0)+1;this.pullPromise=null;this.registrationResult=null;this.registration?.reset();if(this.ownsFrameSource)this.frameSource?.stop();super.stop();}
 dispose(){if(this.disposed)return;this.abort.abort();super.dispose();if(this.ownsFrameSource)this.frameSource.dispose();this.registration?.dispose();}
}
