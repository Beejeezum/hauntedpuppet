// Decode comparison pictures in fresh, isolated browser processes BEFORE the
// one-decoder study. A second media pipeline would contaminate that experiment.
module.exports=async function nativeGoldens(pw,engine,base,references){
 const pictures={};
 for(const ref of references){
  const browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{});
  try{
   const page=await browser.newPage();
   const root=base+'/source/wisp-performance-reference/ambient-show/single-movie-study/references/';
   await page.route(base+'/atlas-golden.html',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Isolated native frame reference</title>'}));
   await page.goto(base+'/atlas-golden.html');
   await page.setContent('<video muted playsinline width="1280" height="720"></video><canvas width="1280" height="720"></canvas>');
   pictures[ref.id]=await page.evaluate(async src=>{
    const video=document.querySelector('video');video.muted=true;video.volume=0;video.src=src;
    await new Promise((resolve,reject)=>{
     let timer,frame,done=false;
     const finish=error=>{if(done)return;done=true;clearTimeout(timer);cancelAnimationFrame(frame);video.removeEventListener('error',failed);error?reject(error):resolve()};
     const failed=()=>finish(Error('Isolated native reference decode failed'));
     const check=()=>{if(video.readyState>=2&&video.currentTime>.01)finish();else if(!done)frame=requestAnimationFrame(check)};
     video.addEventListener('error',failed,{once:true});
     timer=setTimeout(()=>finish(Error('Isolated native reference deadline')),6000);
     video.play().catch(finish);frame=requestAnimationFrame(check);
    });
    video.pause();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const canvas=document.querySelector('canvas');canvas.getContext('2d').drawImage(video,0,0);
    const picture=canvas.toDataURL();video.removeAttribute('src');video.load();video.remove();return picture;
   },root+ref.id+'.mp4');
  }finally{await browser.close();}
 }
 return pictures;
};
