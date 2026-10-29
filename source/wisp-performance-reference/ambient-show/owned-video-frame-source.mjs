/** Experimental detached-picture source. Not installed in the runtime transport.
 * Own at most one VideoFrame; publish detached RGBA pixels + the browser-reported timestamp.
 * A playing WebKit timestamp is not proven to identify the decoded frame index.
 * Generation guards retire late copies after Stop, source change or disposal.
 */
export class OwnedVideoFrameSource{
 constructor({createFrame=video=>new VideoFrame(video),maxPixels=4096*2160}={}){
  this.createFrame=createFrame;this.maxPixels=maxPixels;this.canvas=document.createElement('canvas');this.scratch=document.createElement('canvas');this.ctx=this.canvas.getContext('2d');this.scratchCtx=this.scratch.getContext('2d',{willReadFrequently:true});this.epoch=0;this.disposed=false;this.video=null;this.sourceURL=null;this.pending=null;this.packet=null;this.bytes=null;this.lastFailure=null;this.stats={created:0,closed:0,held:0,maxHeld:0,published:0,duplicates:0,unavailable:0,discarded:0,failures:0,rgbaCopies:0,canvasCopies:0};
 }
 close(job){if(job.frame&&!job.closed){job.closed=true;job.frame.close();this.stats.closed++;this.stats.held--;}}
 clear(){this.packet=null;this.bytes=null;this.canvas.width=this.scratch.width=1;this.canvas.height=this.scratch.height=1;}
 stop(){this.epoch++;if(this.pending)this.close(this.pending);this.video=null;this.sourceURL=null;this.clear();}
 pull(video){
  if(this.disposed)return Promise.resolve(null);
  const url=video?.currentSrc||video?.src||'';
  if(this.video!==video||this.sourceURL!==url){this.stop();this.video=video;this.sourceURL=url;}
  // A cancelled asynchronous copy retains its slot until settlement. Never
  // allocate another frame/buffer behind it, even when a new source arrives.
  if(this.pending)return this.pending.epoch===this.epoch?this.pending.promise:Promise.resolve(null);
  if(!video||video.readyState<2||!video.videoWidth||!video.videoHeight)return Promise.resolve(null);
  const job={epoch:this.epoch,frame:null,closed:false,promise:null,stage:"create-frame"};this.pending=job;
  job.promise=Promise.resolve().then(async()=>{
   try{
    if(this.disposed||job.epoch!==this.epoch)return null;
    const frame=job.frame=this.createFrame(video);this.stats.created++;this.stats.held++;this.stats.maxHeld=Math.max(this.stats.maxHeld,this.stats.held);
    job.stage="validate-frame";const width=frame.displayWidth,height=frame.displayHeight,time=frame.timestamp/1e6;
    if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width*height>this.maxPixels||!Number.isFinite(time)||time<0)throw Error('Invalid owned picture');
    if(this.packet?.time===time&&this.packet.width===width&&this.packet.height===height){this.stats.duplicates++;return this.packet;}
    job.stage='select-copy';const options={format:'RGBA',layout:[{offset:0,stride:width*4}]};let packed=false;try{packed=['RGBA','RGBX'].includes(frame.format)&&frame.allocationSize(options)===width*height*4}catch{}
    let pixels,method;
    if(packed){
     const bytes=this.bytes?.length===width*height*4?this.bytes:new Uint8ClampedArray(width*height*4);this.bytes=bytes;
     job.stage='copy-rgba';const layout=await frame.copyTo(bytes,options);
     if(this.disposed||job.epoch!==this.epoch){this.stats.discarded++;return null;}
     job.stage='validate-layout';if(layout.length!==1||layout[0].offset!==0||layout[0].stride!==width*4)throw Error('Owned RGBA layout unavailable');
     job.stage='create-image-data';pixels=new ImageData(bytes,width,height);method='rgba';
    }else{
     // Allocation size does not guarantee RGBA conversion: Linux WebKit
     // BGRX can report packed size then reject copyTo. Only native RGBA/RGBX
     // use the packed path. Let native
     // Canvas convert, read pixels, then clear the native-frame scratch target.
     job.stage='canvas-convert';this.scratch.width=width;this.scratch.height=height;
     try{this.scratchCtx.drawImage(frame,0,0,width,height);pixels=this.scratchCtx.getImageData(0,0,width,height);}finally{this.scratch.width=this.scratch.width;}
     method='canvas';
    }
    if(this.disposed||job.epoch!==this.epoch){this.stats.discarded++;return null;}
    if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;}
    job.stage='publish-pixels';this.ctx.putImageData(pixels,0,0);this.stats[method==='rgba'?'rgbaCopies':'canvasCopies']++;this.stats.published++;
    this.packet={canvas:this.canvas,time,width,height,sequence:this.stats.published};return this.packet;
   }catch(error){if(this.disposed||job.epoch!==this.epoch){this.stats.discarded++;return null;}if(!job.frame&&error?.name==='InvalidStateError'){this.stats.unavailable++;return null;}this.stats.failures++;this.lastFailure={stage:job.stage,name:['NotSupportedError','InvalidStateError','SecurityError','TypeError','RangeError','Error'].includes(error?.name)?error.name:'OtherError',width:job.frame?.displayWidth??null,height:job.frame?.displayHeight??null,format:['RGBA','RGBX','BGRA','BGRX','NV12','I420','I420A','I422','I444'].includes(job.frame?.format)?job.frame.format:'unknown'};throw error;
   }finally{this.close(job);if(this.pending===job)this.pending=null;}
  });return job.promise;
 }
 inspect(){return{...this.stats,lastFailure:this.lastFailure,pending:!!this.pending,ready:!!this.packet,disposed:this.disposed,time:this.packet?.time??null};}
 dispose(){if(this.disposed)return;this.stop();this.disposed=true;}
}
