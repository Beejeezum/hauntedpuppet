// Native picture seeks; ambiguous identity is allowed only with bounded rig landmarks.
const assert=require('node:assert/strict'),fs=require('node:fs'),pw=require('playwright');
process.env.HAUNT_TONIGHT_ROOT='.';
const watchdog=setTimeout(()=>{console.error('Neutral pose audit exceeded60seconds');process.exit(1);},60000);
(async()=>{
 const fixture=await require('./tonight_fixture.cjs').start(),engine=process.env.HAUNT_BROWSER||'chromium';
 const browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{});
 try{
  const page=await browser.newPage();await page.route('**/pose-proof',r=>r.fulfill({contentType:'text/html',body:'<!doctype html>'}));await page.goto(fixture.base+'/pose-proof');
  const result=await page.evaluate(async()=>{
   const base='/source/wisp-art-reference/scary-speaking-study/neutral-motion-base-study/';
   const {NeutralPoseRegistration}=await import(base+'neutral-pose-registration.mjs');
   const {OwnedVideoFrameSource}=await import('/source/wisp-performance-reference/ambient-show/owned-video-frame-source.mjs');
   const profile=await fetch(base+'neutral-canonical-head-samples-v1.json').then(r=>r.json());
   const observations=await fetch(base+'neutral-lip-observations-v2.json').then(r=>r.json());
   const rig=new NeutralPoseRegistration(profile,observations),source=new OwnedVideoFrameSource();
   const video=document.createElement('video');video.muted=true;video.playsInline=true;document.body.append(video);
   const ready=new Promise((resolve,reject)=>{video.onloadeddata=resolve;video.onerror=reject;});video.src=base+'scary-neutral-body-base-v1.mp4';await ready;
   const samples=[];let firstCanvas;
   for(let index=0;index<193;index++){
    await new Promise(resolve=>{video.onseeked=resolve;video.currentTime=(index+.5)/24;});source.stop();const packet=await source.pull(video);
    const at=performance.now(),match=rig.match({...packet,time:999});let error=null;
    if(match){const actual=observations.observations[index],chosen=observations.observations[match.poseFrame],a=[...actual.lipSeam,...actual.eyes],b=[...chosen.lipSeam,...chosen.eyes];error=Math.max(...a.map((p,i)=>Math.hypot(p[0]-b[i][0],p[1]-b[i][1])));}
    samples.push({index,match,landmarkError:error,milliseconds:performance.now()-at});
    if(index===0){firstCanvas=document.createElement('canvas');firstCanvas.width=1088;firstCanvas.height=704;firstCanvas.getContext('2d').drawImage(packet.canvas,0,0);}
   }
   const tied=new NeutralPoseRegistration({...profile,fingerprints:profile.fingerprints.map(()=>profile.fingerprints[0])},observations);
   const incompatibleTie=tied.match({canvas:firstCanvas,time:0});tied.dispose();
   firstCanvas.getContext('2d').fillStyle='black';firstCanvas.getContext('2d').fillRect(0,0,1088,704);const blank=rig.match({canvas:firstCanvas,time:0});
   let badSource=false,badLandmarks=false;
   try{new NeutralPoseRegistration({...profile,sourceSha256:'wrong'},observations);}catch{badSource=true;}
   const broken=structuredClone(observations);broken.observations[0].lipSeam[0][0]=NaN;
   try{new NeutralPoseRegistration(profile,broken);}catch{badLandmarks=true;}
   rig.dispose();source.dispose();video.pause();video.removeAttribute('src');video.load();video.remove();firstCanvas.width=1;
   return{samples,incompatibleTie,blank,badSource,badLandmarks,ownership:source.inspect(),registration:rig.inspect()};
  });
  fs.mkdirSync('work/neutral-pose-registration',{recursive:true});fs.writeFileSync('work/neutral-pose-registration/'+engine+'.json',JSON.stringify(result,null,2));
  assert.equal(result.samples.length,193);
  for(const s of result.samples){assert(s.match,'Every native picture needs a bounded pose: '+s.index);assert(s.match.maxLandmarkSpread<=.5);assert(s.landmarkError<=.5);}
  assert(result.samples.some(s=>!s.match.identityProven),'Exercise geometric agreement when exact frame identity is ambiguous');
  assert.equal(result.incompatibleTie,null);assert.equal(result.blank,null);assert(result.badSource&&result.badLandmarks);
  assert.equal(result.ownership.created,result.ownership.closed);assert.equal(result.ownership.held,0);assert.equal(result.ownership.failures,0);assert(result.registration.disposed);
  console.log('PASS '+engine+'193 native pictures with <=0.5px pose uncertainty; no clock fallback or exact identity claim for ambiguous frames; invalid/tied/blank rejection and frame release');
 }finally{await browser.close();await fixture.close();clearTimeout(watchdog);}
})().catch(error=>{console.error(error);process.exitCode=1;});
