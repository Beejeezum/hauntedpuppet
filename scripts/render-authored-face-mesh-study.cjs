const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'work/authored-face-registration');
(async()=>{const fixture=await require('../tests/tonight_fixture.cjs').start(),browser=await require('playwright').chromium.launch({args:['--mute-audio']});try{
 const page=await browser.newPage();await page.route('**/mesh-study',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Private face study</title>'}));await page.goto(fixture.base+'/mesh-study');
 page.on('pageerror',e=>console.error('Browser study:',e.message));const result=await page.evaluate(async()=>{
  const {AuthoredFaceMeshStudy}=await import('/scripts/authored-face-mesh-study.mjs');
  const dir='/source/wisp-art-reference/painted-speech-study/authored-face-study/';
  const [mesh,anchors]=await Promise.all([fetch('/work/authored-face-registration/skin-mesh.json').then(r=>r.json()),fetch(dir+'wisp-friendly-speech-design-v1-anchor-study.json').then(r=>r.json())]);
  const image=new Image();image.src=dir+'wisp-friendly-speech-design-v1.png';await image.decode();
  const gl=document.createElement('canvas');gl.width=512;gl.height=768;const rig=new AuthoredFaceMeshStudy(gl,mesh,anchors,image),full=document.createElement('canvas');full.width=512;full.height=768;const ctx=full.getContext('2d');
  function frame(w){ctx.drawImage(image,0,0,512,768,0,0,512,768);rig.draw(w);ctx.drawImage(gl,0,0)}
  const contact=document.createElement('canvas');contact.width=1280;contact.height=350;const c=contact.getContext('2d');c.fillStyle='#10151e';c.fillRect(0,0,1280,350);
  for(let i=0;i<4;i++){frame([0,1,2,3].map(j=>j===i?1:0));c.drawImage(full,145,360,235,230,i*320,30,320,310);c.fillStyle='white';c.font='18px sans-serif';c.fillText(['rest','AH','OO','EE'][i],i*320+10,23)}
  const stage=document.createElement('canvas');stage.width=512;stage.height=512;const s=stage.getContext('2d');document.body.replaceChildren(stage);
  const stream=stage.captureStream(30),chunks=[];const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9'});recorder.ondataavailable=e=>chunks.push(e.data);const stopped=new Promise(r=>recorder.onstop=r);recorder.start();const start=performance.now();let frames=0;
  await new Promise((resolve,reject)=>{const limit=setTimeout(()=>reject(Error('Motion study exceeded 20 seconds')),20000);function step(now){const time=(now-start)/1000,phase=Math.max(0,Math.min(5.999,time)),seq=[0,1,0,2,0,3,0],index=Math.floor(phase),t=(phase-index),ease=t*t*(3-2*t),weights=[0,0,0,0];weights[seq[index]]+=1-ease;weights[seq[index+1]]+=ease;frame(weights);s.fillStyle='black';s.fillRect(0,0,512,512);s.drawImage(full,100,300,310,330,0,0,512,512);frames++;if(time>=6){clearTimeout(limit);resolve();}else requestAnimationFrame(step)}requestAnimationFrame(step)});
  recorder.stop();await stopped;stream.getTracks().forEach(t=>t.stop());const bytes=new Uint8Array(await new Blob(chunks).arrayBuffer());rig.dispose();return{contact:contact.toDataURL(),video:Array.from(bytes),frames,disposed:rig.disposed,scope:'Static approved sheet with unapproved shared-topology oral/skin material deformation. No native moving-body registration or speech alignment.'};
 });assert(result.frames>90);assert(result.disposed);fs.writeFileSync(path.join(out,'mesh-painted-contact.png'),Buffer.from(result.contact.split(',')[1],'base64'));fs.writeFileSync(path.join(out,'mesh-painted-motion.webm'),Buffer.from(result.video));delete result.video;delete result.contact;fs.writeFileSync(path.join(out,'mesh-render-review.json'),JSON.stringify(result,null,2));console.log(result);
 }finally{await browser.close();await fixture.close()}})().catch(e=>{console.error(e);process.exitCode=1});
