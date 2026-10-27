// Camera frames stay in a local worker. No network upload or recording path exists.
export const FACE_RUNTIME_VERSION='1.1.1';
const BASE='/assets/vendor/mediapipe/';
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:0));
export function faceChannels(result){
 const c=Object.fromEntries((result?.faceBlendshapes?.[0]?.categories||[]).map(x=>[x.categoryName,clamp(x.score)]));
 if(!result?.faceLandmarks?.[0]?.length)return null;
 const avg=(a,b)=>(clamp(c[a])+clamp(c[b]))/2;
 const m=result.facialTransformationMatrixes?.[0]?.data;
 let yaw=0,pitch=0,roll=0;
 if(m?.length===16){yaw=Math.asin(clamp(-m[2],-1,1));pitch=Math.atan2(m[6],m[10]);roll=Math.atan2(m[1],m[0]);}
 return {eyeBlinkLeft:clamp(c.eyeBlinkLeft),eyeBlinkRight:clamp(c.eyeBlinkRight),eyeLookX:clamp((clamp(c.eyeLookOutRight)+clamp(c.eyeLookInLeft)-clamp(c.eyeLookInRight)-clamp(c.eyeLookOutLeft))/2,-1,1),eyeLookY:clamp(avg('eyeLookUpLeft','eyeLookUpRight')-avg('eyeLookDownLeft','eyeLookDownRight'),-1,1),browUp:clamp(Math.max(clamp(c.browInnerUp),avg('browOuterUpLeft','browOuterUpRight'))),browDown:avg('browDownLeft','browDownRight'),browUpLeft:Math.max(clamp(c.browInnerUp),clamp(c.browOuterUpLeft)),browUpRight:Math.max(clamp(c.browInnerUp),clamp(c.browOuterUpRight)),browDownLeft:clamp(c.browDownLeft),browDownRight:clamp(c.browDownRight),jawOpen:clamp(c.jawOpen),mouthClose:clamp(c.mouthClose),mouthFunnel:clamp(c.mouthFunnel),mouthPucker:clamp(c.mouthPucker),mouthPress:avg('mouthPressLeft','mouthPressRight'),mouthStretch:avg('mouthStretchLeft','mouthStretchRight'),smileLeft:clamp(c.mouthSmileLeft),smileRight:clamp(c.mouthSmileRight),eyeSquintLeft:clamp(c.eyeSquintLeft),eyeSquintRight:clamp(c.eyeSquintRight),smile:avg('mouthSmileLeft','mouthSmileRight'),headYaw:clamp(yaw/0.8,-1,1),headPitch:clamp(pitch/0.65,-1,1),headRoll:clamp(roll/0.65,-1,1)};
}
export class PerformerFaceTracker{
 constructor(events={},dependencies={}){this.events=events;this.deps=dependencies;this.phase='idle';this.error='';this.revision=0;this.pose=null;this.lastFace=0;this.frames=0;this.neutral={};this.framePending=false;this.workerURL=dependencies.workerURL||new URL('./performer-face-tracker.js',import.meta.url);this.pagehide=()=>this.stop('Camera stopped');globalThis.window?.addEventListener('pagehide',this.pagehide);}
 inspect(){return {phase:this.phase,ready:this.phase==='live',tracking:!!this.pose&&this.now()-this.lastFace<500,tracks:this.stream?.getVideoTracks().filter(t=>t.readyState==='live').length||0,error:this.error,frames:this.frames,runtimeVersion:FACE_RUNTIME_VERSION,localOnly:true};}
 now(){return this.deps.now?.()??performance.now();}
 emit(){this.events.onState?.(this.inspect());}
 sample(){return this.inspect().tracking?{...this.pose}:null;}
 calibrate(){const p=this.sample();if(!p)return false;this.neutral=Object.fromEntries(['eyeLookX','eyeLookY','headYaw','headPitch','headRoll'].map(k=>[k,p[k]+(this.neutral[k]||0)]));return true;}
 async start(deviceId='default'){
 this.stop();const revision=++this.revision;this.phase='starting';this.error='';this.emit();
 try{
  const WorkerType=this.deps.Worker||globalThis.Worker;if(!WorkerType)throw Error('This browser cannot run local face tracking.');
  const worker=new WorkerType(this.workerURL,{type:'module'});this.worker=worker;
  await new Promise((resolve,reject)=>{this.rejectLoad=reject;const timeout=setTimeout(()=>reject(Error('Face model took too long to load. Please retry.')),20000);this.loadTimer=timeout;worker.onmessage=({data})=>{if(data.type==='ready'){clearTimeout(timeout);this.rejectLoad=null;resolve();}else if(data.type==='error'){clearTimeout(timeout);reject(Error(data.error));}};worker.onerror=()=>reject(Error('The local face tracker could not load. Please retry.'));worker.postMessage({type:'init',base:new URL(BASE,globalThis.location?.href||'http://localhost').href});});
  if(revision!==this.revision)return false;
  const media=this.deps.mediaDevices||navigator.mediaDevices;if(!media?.getUserMedia)throw Error('Camera capture requires HTTPS or localhost.');
  const stream=await media.getUserMedia({audio:false,video:{width:{ideal:640},height:{ideal:480},frameRate:{ideal:25,max:30},...(deviceId&&deviceId!=='default'?{deviceId:{exact:deviceId}}:{})}});
  if(revision!==this.revision){stream.getTracks().forEach(t=>t.stop());return false;}
  this.stream=stream;for(const track of stream.getVideoTracks())track.onended=()=>this.stop('Camera disconnected');
  const video=this.deps.createVideo?.()||document.createElement('video');this.video=video;video.muted=true;video.playsInline=true;video.srcObject=stream;await video.play();if(revision!==this.revision)return false;
  worker.onmessage=({data})=>{if(revision!==this.revision)return;if(data.type==='pose'){this.framePending=false;const p=data.pose;if(p){this.lastFace=this.now();this.pose=Object.fromEntries(Object.entries(p).map(([k,v])=>[k,clamp(v-(this.neutral[k]||0),['eyeLookX','eyeLookY','headYaw','headPitch','headRoll'].includes(k)?-1:0,1)]));this.frames++;this.events.onPose?.(this.sample());}else if(this.now()-this.lastFace>=500)this.clearPose();this.emit();}else if(data.type==='error')this.fail(data.error);};
  worker.onerror=()=>this.fail('Face tracking stopped unexpectedly. Please retry.');this.phase='live';this.emit();this.timer=setInterval(()=>this.tick(revision),40);return true;
 }catch(error){if(revision!==this.revision)return false;this.fail(error.name==='NotAllowedError'?'Camera permission was denied. You can retry when ready.':error.name==='NotFoundError'?'No camera was found.':error.name==='NotReadableError'?'The camera is busy. Close its other app and retry.':error.message);return false;}
 }
 async tick(revision){if(revision!==this.revision||this.phase!=='live')return;if(this.pose&&this.now()-this.lastFace>=500)this.clearPose();if(this.framePending||!this.video||this.video.readyState<2)return;this.framePending=true;try{const bitmap=await(this.deps.createImageBitmap||globalThis.createImageBitmap)(this.video);if(revision!==this.revision){bitmap.close();return;}this.worker.postMessage({type:'frame',bitmap,timestamp:this.now()},[bitmap]);}catch(error){if(revision===this.revision)this.fail('Camera frame could not be processed. Please retry.');}}
 clearPose(){if(this.pose){this.pose=null;this.events.onPose?.(null);this.emit();}}
 fail(error){this.stop();this.error=error||'Face tracking unavailable';this.phase='error';this.emit();}
 stop(reason=''){this.revision++;clearInterval(this.timer);clearTimeout(this.loadTimer);this.rejectLoad?.(Error('Cancelled'));this.rejectLoad=null;this.worker?.terminate();this.worker=null;for(const track of this.stream?.getTracks()||[]){track.onended=null;track.stop();}this.stream=null;if(this.video){this.video.pause();this.video.srcObject=null;}this.video=null;this.framePending=false;this.clearPose();this.neutral={};this.phase='idle';this.error='';this.emit();if(reason)this.events.onStop?.(reason);}
 destroy(){this.stop();globalThis.window?.removeEventListener('pagehide',this.pagehide);}
}
if(typeof WorkerGlobalScope!=='undefined'&&globalThis instanceof WorkerGlobalScope){
 let model;
 self.onmessage=async({data})=>{try{if(data.type==='init'){const {FaceLandmarker,FilesetResolver}=await import(data.base+'vision_bundle.mjs');const files=await FilesetResolver.forVisionTasks(data.base+'wasm/');files.wasmLoaderPath=data.base+'wasm/vision_wasm_module_internal.js';files.wasmBinaryPath=data.base+'wasm/vision_wasm_module_internal.wasm';model=await FaceLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:data.base+'face_landmarker.task',delegate:'CPU'},runningMode:'VIDEO',numFaces:1,outputFaceBlendshapes:true,outputFacialTransformationMatrixes:true});self.postMessage({type:'ready'});}else if(data.type==='frame'){try{self.postMessage({type:'pose',pose:faceChannels(model.detectForVideo(data.bitmap,data.timestamp))});}finally{data.bitmap.close();}}}catch(error){self.postMessage({type:'error',error:'Local face model unavailable. '+error.message});}};
}
