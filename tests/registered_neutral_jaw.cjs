// Native picture seeks; ambiguous identity is allowed only with bounded rig landmarks.
const assert=require('node:assert/strict'),fs=require('node:fs'),pw=require('playwright');
process.env.HAUNT_TONIGHT_ROOT='.';
const watchdog=setTimeout(()=>{console.error('Registered jaw audit exceeded90seconds');process.exit(1);},90000);
(async()=>{
 const fixture=await require('./tonight_fixture.cjs').start(),engine=process.env.HAUNT_BROWSER||'chromium';
 const browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{});
 try{
  const page=await browser.newPage();await page.route('**/pose-proof',r=>r.fulfill({contentType:'text/html',body:'<!doctype html>'}));await page.goto(fixture.base+'/pose-proof');
  const result=await page.evaluate(async()=>{
   const base='/source/wisp-art-reference/scary-speaking-study/neutral-motion-base-study/';
   const {RegisteredNeutralJaw}=await import(base+'registered-neutral-jaw.mjs');
   const {OwnedVideoFrameSource}=await import('/source/wisp-performance-reference/ambient-show/owned-video-frame-source.mjs');
   const profile=await fetch(base+'neutral-canonical-head-samples-v1.json').then(r=>r.json());
   const observations=await fetch(base+'neutral-lip-observations-v2.json').then(r=>r.json());
   const oral=new Image();oral.src='/source/wisp-art-reference/scary-speaking-study/neutral-face-rig-study/corrective-ah-v1/painted-ah-head-v1.png';await oral.decode();const oralMap=(await fetch('/source/wisp-art-reference/scary-speaking-study/neutral-face-rig-study/face-topology.json').then(r=>r.json())).oralArt;const rig=new RegisteredNeutralJaw(profile,observations,oral,{oralMap}),source=new OwnedVideoFrameSource(),stage=document.createElement('canvas');stage.width=1088;stage.height=704;const context=stage.getContext('2d');
   const video=document.createElement('video');video.muted=true;video.playsInline=true;document.body.append(video);
   const ready=new Promise((resolve,reject)=>{video.onloadeddata=resolve;video.onerror=reject;});video.src=base+'scary-neutral-body-base-v1.mp4';await ready;
   const samples=[];let firstCanvas;
   for(let index=0;index<193;index++){
    await new Promise(resolve=>{video.onseeked=resolve;video.currentTime=(index+.5)/24;});source.stop();const packet=await source.pull(video);
    const at=performance.now(),draw=rig.draw(context,{...packet,time:999},.6),match=draw.pose;let error=null;let outsideChanges=0,eyeChanges=0;
    if([0,24,48,72,96,111,142,143,144,145,192].includes(index)||match?.poseFrame!==index){const original=packet.canvas.getContext('2d').getImageData(0,0,1088,704).data,actual=context.getImageData(0,0,1088,704).data,[l,t,r,b]=draw.bounds;for(let i=0;i<actual.length;i+=4){if(actual[i]===original[i]&&actual[i+1]===original[i+1]&&actual[i+2]===original[i+2]&&actual[i+3]===original[i+3])continue;const x=i/4%1088,y=Math.floor(i/4/1088);if(x<l-2||x>r+2||y<t-2||y>b+2)outsideChanges++;for(const eye of observations.observations[index].eyes)if(Math.abs(x-Math.round(eye[0]))<=4&&Math.abs(y-Math.round(eye[1]))<=4)eyeChanges++;}}
    if(match){const actual=observations.observations[index],chosen=observations.observations[match.poseFrame],a=[...actual.lipSeam,...actual.eyes],b=[...chosen.lipSeam,...chosen.eyes];error=Math.max(...a.map((p,i)=>Math.hypot(p[0]-b[i][0],p[1]-b[i][1])));}
    samples.push({index,match,outsideChanges,eyeChanges,landmarkError:error,milliseconds:performance.now()-at});
    if(index===0){firstCanvas=document.createElement('canvas');firstCanvas.width=1088;firstCanvas.height=704;firstCanvas.getContext('2d').drawImage(packet.canvas,0,0);}
   }
   firstCanvas.getContext('2d').fillStyle='black';firstCanvas.getContext('2d').fillRect(0,0,1088,704);const unknown=rig.draw(context,{canvas:firstCanvas,time:0},1);const blank=context.getImageData(0,0,1088,704).data;let blankPeak=0;for(let i=0;i<blank.length;i+=4)blankPeak=Math.max(blankPeak,blank[i],blank[i+1],blank[i+2]);
   let invalidOpening=false;try{rig.draw(context,{canvas:firstCanvas},Infinity);}catch{invalidOpening=true;}
   rig.dispose();source.dispose();video.pause();video.removeAttribute('src');video.load();video.remove();firstCanvas.width=1;
   return{samples,unknown,blankPeak,invalidOpening,ownership:source.inspect(),registration:rig.inspect()};
  });
  fs.mkdirSync('work/registered-neutral-jaw',{recursive:true});fs.writeFileSync('work/registered-neutral-jaw/'+engine+'.json',JSON.stringify(result,null,2));
  assert.equal(result.samples.length,193);
  for(const s of result.samples){assert(s.match,'Every native picture needs a bounded pose: '+s.index);assert(s.match.maxLandmarkSpread<=.5);assert(s.landmarkError<=.5);assert.equal(s.outsideChanges,0);assert.equal(s.eyeChanges,0);}
  assert(result.samples.some(s=>!s.match.identityProven),'Exercise geometric agreement when exact frame identity is ambiguous');
  assert(result.unknown.heldClosed&&result.unknown.pose===null);assert.equal(result.blankPeak,0);assert(result.invalidOpening);assert.equal(result.registration.jaw.resources,0);
  assert.equal(result.ownership.created,result.ownership.closed);assert.equal(result.ownership.held,0);assert.equal(result.ownership.failures,0);assert(result.registration.disposed);assert.equal(result.registration.draws,194);assert.equal(result.registration.heldClosed,1);
  console.log('PASS '+engine+'193 actual decoded pictures drive connected jaw without clock;native pixel cases including near-identical ambiguous poses preserve body/irises; unknown picture stays unchanged, opening bounds and retirement pass');
 }finally{await browser.close();await fixture.close();clearTimeout(watchdog);}
})().catch(error=>{console.error(error);process.exitCode=1;});
