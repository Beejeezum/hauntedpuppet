import {CanonicalPictureRegistration} from './canonical-picture-registration.mjs';
import {OwnedVideoFrameSource} from '../../wisp-performance-reference/ambient-show/owned-video-frame-source.mjs';
const approved='52d54d03c0f0406a9724c7c04b9e2fa0557a675486edfaa40fd0ca2e24a682bd',active=new WeakMap();
const cancelled=()=>new DOMException('Native picture preparation cancelled','AbortError');
function wait(promise,signal){return new Promise((resolve,reject)=>{const abort=()=>{cleanup();reject(signal.reason||cancelled())},cleanup=()=>signal.removeEventListener('abort',abort);signal.addEventListener('abort',abort,{once:true});Promise.resolve(promise).then(v=>{cleanup();resolve(v)},e=>{cleanup();reject(e)});if(signal.aborted)abort()});}
async function bytes(url,signal,limit=4*1024*1024){
 const response=await fetch(url,{signal});if(!response.ok||Number(response.headers.get('content-length'))>limit)throw Error('Native movie verification unavailable');const reader=response.body?.getReader();if(!reader)throw Error('Native movie stream unavailable');const chunks=[];let count=0;
 try{while(true){const {done,value}=await wait(reader.read(),signal);if(done)break;count+=value.byteLength;if(count>limit)throw Error('Native movie exceeds preparation limit');chunks.push(value)}}finally{await reader.cancel().catch(()=>{});reader.releaseLock()}
 const result=new Uint8Array(count);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.byteLength}return result;
}
export async function readCanonicalPictureProfile(url,signal){
 const data=await bytes(url,signal,512*1024),digest=await wait(crypto.subtle.digest('SHA-256',data),signal),hash=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
 if(hash!=='da457307ec91b289600c60a7428e464399a1ebe6d7538eedb96e9431ca4d4163')throw Error('Canonical reference differs from verified source');
 return JSON.parse(new TextDecoder().decode(data));
}
function seek(video,time,signal){
 if(video.currentTime===time&&!video.seeking)return Promise.resolve();
 return new Promise((resolve,reject)=>{let timer;const cleanup=()=>{clearTimeout(timer);video.removeEventListener('seeked',done);video.removeEventListener('error',error);signal.removeEventListener('abort',abort)},done=()=>{cleanup();resolve()},error=()=>{cleanup();reject(Error('Native reference seek failed'))},abort=()=>{cleanup();reject(signal.reason||cancelled())};video.addEventListener('seeked',done);video.addEventListener('error',error);signal.addEventListener('abort',abort,{once:true});timer=setTimeout(()=>{cleanup();reject(Error('Native reference seek timed out'))},2000);if(signal.aborted){abort();return}try{video.currentTime=time}catch(e){cleanup();reject(e)}});
}
export function inspectNativePicturePreparation(video){const job=active.get(video);return{active:!!job,completed:job?.completed??0,total:job?.total??3};}
/** Opt-in preflight: validate three native poses against a trusted canonical
 * lookup containing all122 source frames (audited separately). Caller must isolate the stage before giving this
 * paused, existing decoder to preparation. Never create a second decoder or
 * silently resume/restore a video after cancellation/source replacement.
 */
export async function prepareNativePictureProfile(video,{signal:external,isStageIsolated,onProgress=()=>{},onRelease=()=>{},canonicalProfile=null}={}){
 if(active.has(video))throw Error('Native picture preparation already active');
 if(video?.tagName!=='VIDEO'||!video.paused||video.readyState<2||video.videoWidth!==1916||video.videoHeight!==1080||Math.abs(video.duration-122/24)>.01||typeof isStageIsolated!=='function'||!isStageIsolated())throw Error('Isolate and pause the approved movie before preparation');
 const url=video.currentSrc||video.src,position=video.currentTime,controller=new AbortController(),signal=external?AbortSignal.any([controller.signal,external]):controller.signal,source=new OwnedVideoFrameSource(),job={completed:0,total:3};active.set(video,job);const started=performance.now(),timer=setTimeout(()=>controller.abort(new DOMException('Native picture preparation timed out','TimeoutError')),20000);
 const retire=()=>source.dispose(),changed=()=>controller.abort(cancelled());signal.addEventListener('abort',retire,{once:true});video.addEventListener('play',changed);video.addEventListener('loadstart',changed);video.addEventListener('emptied',changed);
 const guard=()=>{if(signal.aborted)throw signal.reason||cancelled();if((video.currentSrc||video.src)!==url||!video.paused||!isStageIsolated())throw Error('Native preparation lost its isolated paused stage')};
 let success=false,canonical=null;
 try{
  guard();const data=await bytes(url,signal);guard();const digest=await wait(crypto.subtle.digest('SHA-256',data),signal),hash=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');if(hash!==approved)throw Error('Native movie differs from approved source');
  const reference=canonicalProfile||await readCanonicalPictureProfile(new URL('native-lip-mesh-study/friendly-v28-canonical-head-samples-v1.json',import.meta.url),signal);guard();
  canonical=new CanonicalPictureRegistration(reference);const targets=[0,50,121];
  for(const index of targets){
   guard();await seek(video,(index+.5)/24,signal);guard();source.stop();const packet=await wait(source.pull(video),signal);guard();if(!packet)throw Error('Native reference picture unavailable');
   if(canonical.match(packet)?.frame!==index)throw Error('Canonical pictures do not match this native decoder');job.completed++;onProgress({completed:job.completed,total:job.total});guard();
  }
  await seek(video,position,signal);guard();canonical?.reset();success=true;
  return{kind:'canonical',profile:reference,registration:canonical,elapsedMs:performance.now()-started};
 }finally{
  if(!success)canonical?.dispose();clearTimeout(timer);signal.removeEventListener('abort',retire);video.removeEventListener('play',changed);video.removeEventListener('loadstart',changed);video.removeEventListener('emptied',changed);source.dispose();if(active.get(video)===job)active.delete(video);
  try{onRelease({success,kind:'canonical',completed:job.completed,total:job.total,elapsedMs:performance.now()-started,ownership:source.inspect()})}catch{}
 }
}
