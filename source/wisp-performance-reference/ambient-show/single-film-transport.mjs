import {FilmTransport} from './film-transport.mjs';
const cancelled=()=>Object.assign(Error('Film preparation cancelled'),{cancelled:true});
function abortable(promise,signal){
 return new Promise((resolve,reject)=>{const abort=()=>{cleanup();reject(cancelled());},cleanup=()=>signal.removeEventListener('abort',abort);signal.addEventListener('abort',abort,{once:true});Promise.resolve(promise).then(value=>{cleanup();resolve(value);},error=>{cleanup();reject(error);});if(signal.aborted)abort();});
}
// Read the movie header without opening another native media pipeline.
// ISO BMFF mvhd v0/v1 layout; reject incomplete/unbounded metadata.
export function readMovieDuration(bytes){
 const view=new DataView(bytes),type=at=>String.fromCharCode(...new Uint8Array(bytes,at,4));
 const boxes=(start,end)=>{const found=[];for(let at=start;at+8<=end;){let size=view.getUint32(at),header=8;if(size===1){if(at+16>end)throw Error('Invalid film header');size=Number(view.getBigUint64(at+8));header=16;}else if(size===0)size=end-at;if(!Number.isSafeInteger(size)||size<header||at+size>end)throw Error('Invalid film header');found.push({type:type(at+4),start:at+header,end:at+size});at+=size;}return found;};
 const moov=boxes(0,bytes.byteLength).find(b=>b.type==='moov'),mvhd=moov&&boxes(moov.start,moov.end).find(b=>b.type==='mvhd');
 if(!mvhd)throw Error('Film duration unavailable');
 const version=view.getUint8(mvhd.start);if(version!==0&&version!==1)throw Error('Invalid film duration');
 const scaleAt=mvhd.start+(version===1?20:12),end=scaleAt+(version===1?12:8);
 if(end>mvhd.end)throw Error('Invalid film duration');
 const scale=view.getUint32(scaleAt),duration=version===1?Number(view.getBigUint64(scaleAt+4)):view.getUint32(scaleAt+4),seconds=duration/scale;
 if(!Number.isSafeInteger(duration)||!scale||!Number.isFinite(seconds)||seconds<=0||seconds>7200)throw Error('Film duration unavailable');
 return seconds;
}
/** Compatibility player: prefetch bytes, not a second paused native decoder.
 * Planned black holds and exact outgoing pictures are inherited. This is not
 * the gapless fragmented-media transport; reviewed-cut freeze time needs review.
 */
export class SingleFilmTransport extends FilmTransport{
 constructor(compositor,clips,options={}){super(compositor,clips,{...options,pipelineCount:1});this.activeURL=null;this.blobURLs=new Set();}
 releaseURL(url){if(url&&this.blobURLs.delete(url))URL.revokeObjectURL(url);if(this.activeURL===url)this.activeURL=null;}
 prepare(id){
  if(this.disposed)return Promise.reject(Error('Film transport disposed'));
  if(this.prepared?.id===id)return Promise.resolve(this.prepared);
  if(this.preparing?.id===id)return this.preparing.promise;
  this.cancelPreparation();const clip=this.clips.find(c=>c.id===id);if(!clip)return Promise.reject(Error('Unknown cue'));
  const epoch=this.prepareEpoch,abort=new AbortController(),signal=abort.signal,video=this.videos[0];
  const job={id,abort,promise:null};this.preparing=job;
  job.promise=(async()=>{
   let timedOut=false;const timer=setTimeout(()=>{timedOut=true;abort.abort();},30000);
   try{
    const response=await abortable(fetch(clip.src,{signal}),signal);
    if(!response.ok)throw Error('Film unavailable');
    const limit=200*1024*1024;
    if(Number(response.headers.get('content-length'))>limit)throw Error('Film exceeds preload limit');
    const bytes=await abortable(response.arrayBuffer(),signal);
    if(!bytes.byteLength||bytes.byteLength>limit)throw Error('Film exceeds preload limit');
    if(signal.aborted||epoch!==this.prepareEpoch||this.disposed)throw cancelled();
    const duration=readMovieDuration(bytes);
    const prepared={id,clip,video,duration,signal,epoch,blob:new Blob([bytes],{type:'video/mp4'}),url:null,released:false,
     dispose:()=>{if(prepared.released)return;prepared.released=true;abort.abort();prepared.blob=null;if(this.prepared===prepared)this.prepared=null;if(prepared.url!==this.activeURL)this.releaseURL(prepared.url);}};
    this.prepared=prepared;return prepared;
   }catch(error){if(timedOut)throw Error('Film download timed out');if(signal.aborted||epoch!==this.prepareEpoch)throw cancelled();throw error;}
   finally{clearTimeout(timer);}
  })().finally(()=>{if(this.preparing===job)this.preparing=null;});return job.promise;
 }
 async activate(prepared,live){
  if(!live())return;
  const owns=()=>!this.disposed&&!prepared.released&&!prepared.signal.aborted&&prepared.epoch===this.prepareEpoch&&this.prepared===prepared;
  if(!owns())throw cancelled();
  const video=this.videos[0],previous=this.active;
  if(previous){this.holdPicture(previous);this.active=null;previous.muted=true;}
  // Native drawing callbacks must finish before this decoder is unloaded.
  await new Promise(resolve=>setTimeout(resolve,0));
  if(!live())return;if(!owns())throw cancelled();
  video.pause();video.muted=true;video.removeAttribute('src');video.load();this.releaseURL(this.activeURL);
  prepared.url=URL.createObjectURL(prepared.blob);this.blobURLs.add(prepared.url);
  video._wispPrepareEpoch=prepared.epoch;video.loop=!!prepared.clip.loop;video.src=prepared.url;video.load();
  try{
   await this.frame(video,prepared.signal);
   if(!live()||!owns()){
    // Do not let a late old activation remove a newer source on this element.
    if(video.getAttribute('src')===prepared.url){video.pause();video.muted=true;video.removeAttribute('src');video.load();this.releaseURL(prepared.url);}
    return;
   }
   this.active=video;this.activeURL=prepared.url;this.heldFrame=null;
   video.dataset.cue=prepared.id;this.prepared=null;prepared.blob=null;
   this.compositor.reveal();this.syncSound();
  }catch(error){
   if(video.getAttribute('src')===prepared.url){video.pause();video.muted=true;video.removeAttribute('src');video.load();this.releaseURL(prepared.url);}
   if(this.prepared===prepared)this.prepared=null;prepared.dispose();
   throw error;
  }
 }
 blackout(){
  super.blackout();
  for(const video of this.videos){video.removeAttribute('src');video.load();}
  for(const url of [...this.blobURLs])this.releaseURL(url);
 }
 inspectPipeline(){return{kind:'single-native',videos:this.videos.length,blobURLs:this.blobURLs.size};}
}
