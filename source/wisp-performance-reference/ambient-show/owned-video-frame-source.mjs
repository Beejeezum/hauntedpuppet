/** Experimental detached-picture source. Not installed in the runtime transport.
 * Own at most one VideoFrame; publish detached RGBA pixels + the browser-reported timestamp.
 * A playing WebKit timestamp is not proven to identify the decoded frame index.
 * Generation guards retire late copies after Stop, source change or disposal.
 */
export class OwnedVideoFrameSource{
 constructor({createFrame=video=>new VideoFrame(video),createCpuFrame=(bytes,init)=>new VideoFrame(bytes,init),cpuStaging=false,cpuColorRange='metadata',maxPixels=4096*2160}={}){
  if(!['metadata','video','full'].includes(cpuColorRange))throw Error('Invalid CPU color range');this.cpuColorRange=cpuColorRange;if(typeof cpuStaging!=='boolean')throw Error('Invalid CPU staging mode');this.cpuStaging=cpuStaging;this.createCpuFrame=createCpuFrame;this.nativeBytes=null;this.createFrame=createFrame;this.maxPixels=maxPixels;this.canvas=document.createElement('canvas');this.scratch=document.createElement('canvas');this.ctx=this.canvas.getContext('2d');this.scratchCtx=this.scratch.getContext('2d',{willReadFrequently:true});this.epoch=0;this.disposed=false;this.video=null;this.sourceURL=null;this.pending=null;this.packet=null;this.bytes=null;this.lastFailure=null;this.stats={created:0,closed:0,held:0,maxHeld:0,published:0,duplicates:0,unavailable:0,discarded:0,failures:0,rgbaCopies:0,canvasCopies:0,cpuStagedCopies:0};
 }
 close(job){if(job.frame&&!job.closed){job.closed=true;job.frame.close();this.stats.closed++;this.stats.held--;}}
 clear(){this.packet=null;this.bytes=null;this.nativeBytes=null;this.canvas.width=this.scratch.width=1;this.canvas.height=this.scratch.height=1;}
 stop(){this.epoch++;if(this.pending)this.close(this.pending);this.video=null;this.sourceURL=null;this.clear();}
 async stageCpuPicture(job,frame,width,height){
  const format=frame.format,formats=['RGBA','RGBX','BGRA','BGRX','I420','I420A','I422','I444','NV12'];
  if(!formats.includes(format))throw Error('Native CPU pixel format unavailable');
  const r=frame.visibleRect||{x:0,y:0,width:frame.codedWidth||width,height:frame.codedHeight||height},rect={x:r.x,y:r.y,width:r.width,height:r.height};
  if(Object.values(rect).some(n=>!Number.isSafeInteger(n)||n<0)||!rect.width||!rect.height||rect.width*rect.height>this.maxPixels)throw Error('Invalid native pixel rectangle');
  const options={rect};job.stage='allocate-native';const size=frame.allocationSize(options);
  if(!Number.isSafeInteger(size)||size<1||size>this.maxPixels*8)throw Error('Native pixel copy exceeds bound');
  const bytes=this.nativeBytes?.length===size?this.nativeBytes:new Uint8Array(size);this.nativeBytes=bytes;
  job.stage='copy-native';const layout=await frame.copyTo(bytes,options);
  if(this.disposed||job.epoch!==this.epoch){this.stats.discarded++;return null;}
  const cw=rect.width,ch=rect.height,packed=['RGBA','RGBX','BGRA','BGRX'].includes(format),planes=packed?[[cw*4,ch]]:format==='NV12'?[[cw,ch],[Math.ceil(cw/2)*2,Math.ceil(ch/2)]]:format==='I444'?[[cw,ch],[cw,ch],[cw,ch]]:[[cw,ch],[Math.ceil(cw/2),format==='I422'?ch:Math.ceil(ch/2)],[Math.ceil(cw/2),format==='I422'?ch:Math.ceil(ch/2)],...(format==='I420A'?[[cw,ch]]:[])];
  job.stage='validate-native-layout';if(layout.length!==planes.length)throw Error('Native pixel plane count changed');
  layout.forEach((p,i)=>{const[row,rows]=planes[i];if(!Number.isSafeInteger(p.offset)||p.offset<0||!Number.isSafeInteger(p.stride)||p.stride<row||p.offset+p.stride*(rows-1)+row>bytes.length)throw Error('Native pixel plane exceeds copied bytes');});
  const nativeColorSpace=frame.colorSpace?.toJSON?.(),colorSpace=nativeColorSpace?{...nativeColorSpace}:{};if(!packed&&this.cpuColorRange!=='metadata')colorSpace.fullRange=this.cpuColorRange==='full';const timestamp=frame.timestamp;
  // Retire the decoder-backed frame before constructing or drawing the CPU one.
  this.close(job);job.stage='create-cpu-picture';const cpu=this.createCpuFrame(bytes,{format,codedWidth:cw,codedHeight:ch,displayWidth:width,displayHeight:height,layout:layout.map(p=>({offset:p.offset,stride:p.stride})),timestamp,...(colorSpace?{colorSpace}:{})});
  job.frame=cpu;job.closed=false;this.stats.created++;this.stats.held++;this.stats.maxHeld=Math.max(this.stats.maxHeld,this.stats.held);
  try{
   if(this.disposed||job.epoch!==this.epoch){this.stats.discarded++;return null;}
   job.stage='convert-cpu-picture';this.scratch.width=width;this.scratch.height=height;
   this.scratchCtx.drawImage(cpu,0,0,width,height);return this.scratchCtx.getImageData(0,0,width,height);
  }finally{this.scratch.width=this.scratch.height=1;this.close(job);}
 }
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
    job.stage="validate-frame";const width=frame.displayWidth,height=frame.displayHeight,time=frame.timestamp/1e6;job.metadata={width,height,format:frame.format};
    if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width*height>this.maxPixels||!Number.isFinite(time)||time<0)throw Error('Invalid owned picture');
    if(this.packet?.time===time&&this.packet.width===width&&this.packet.height===height){this.stats.duplicates++;return this.packet;}
    job.stage='select-copy';const options={format:'RGBA',layout:[{offset:0,stride:width*4}]};let packed=false;try{packed=['RGBA','RGBX'].includes(frame.format)&&frame.allocationSize(options)===width*height*4}catch{}
    let pixels,method;
    if(this.cpuStaging){pixels=await this.stageCpuPicture(job,frame,width,height);if(!pixels)return null;method='cpu';}else if(packed){
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
    job.stage='publish-pixels';this.ctx.putImageData(pixels,0,0);this.stats[method==='cpu'?'cpuStagedCopies':method==='rgba'?'rgbaCopies':'canvasCopies']++;this.stats.published++;
    this.packet={canvas:this.canvas,time,width,height,sequence:this.stats.published};return this.packet;
   }catch(error){if(this.disposed||job.epoch!==this.epoch){this.stats.discarded++;return null;}if(!job.frame&&error?.name==='InvalidStateError'){this.stats.unavailable++;return null;}this.stats.failures++;this.lastFailure={stage:job.stage,name:['NotSupportedError','InvalidStateError','SecurityError','TypeError','RangeError','Error'].includes(error?.name)?error.name:'OtherError',width:job.metadata?.width??job.frame?.displayWidth??null,height:job.metadata?.height??job.frame?.displayHeight??null,format:['RGBA','RGBX','BGRA','BGRX','NV12','I420','I420A','I422','I444'].includes(job.metadata?.format??job.frame?.format)?(job.metadata?.format??job.frame.format):'unknown'};throw error;
   }finally{this.close(job);if(this.pending===job)this.pending=null;}
  });return job.promise;
 }
 inspect(){return{...this.stats,cpuStaging:this.cpuStaging,cpuColorRange:this.cpuColorRange,lastFailure:this.lastFailure,pending:!!this.pending,ready:!!this.packet,disposed:this.disposed,time:this.packet?.time??null};}
 dispose(){if(this.disposed)return;this.stop();this.disposed=true;}
}
