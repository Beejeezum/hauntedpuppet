/** Static coordinate review only; does not synthesize or approve a talking rig. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'source/wisp-art-reference/painted-speech-study/authored-face-study');
(async()=>{
 const bytes=fs.readFileSync(path.join(dir,'wisp-friendly-speech-design-v1.png'));
 const review=JSON.parse(fs.readFileSync(path.join(dir,'wisp-friendly-speech-design-v1-review.json')));
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),review.imageSha256);
 const cells=JSON.parse(fs.readFileSync(path.join(dir,'wisp-friendly-speech-design-v1-anchor-study.json'))).cells;
 const pw=require('playwright'),browser=await pw.chromium.launch({args:['--mute-audio']});
 try{
 const page=await browser.newPage();await page.goto('about:blank');
 const result=await page.evaluate(async({uri,cells})=>{
  const img=new Image();img.src=uri;await img.decode();
  const c=document.createElement('canvas');c.width=1280;c.height=350;const ctx=c.getContext('2d');ctx.fillStyle='#10151e';ctx.fillRect(0,0,c.width,c.height);
  const eye=(cell)=>cell.eyeComponents.map(x=>x.center),rest=eye(cells[0]);
  const length=p=>Math.hypot(p[1][0]-p[0][0],p[1][1]-p[0][1]);
  const angle=p=>Math.atan2(p[1][1]-p[0][1],p[1][0]-p[0][0]);
  const checks=[];
  cells.forEach((cell,i)=>{
   const p=eye(cell),mid=[(p[0][0]+p[1][0])/2,(p[0][1]+p[1][1])/2];
   const scale=1.4*length(rest)/length(p),theta=angle(rest)-angle(p),co=Math.cos(theta)*scale,si=Math.sin(theta)*scale;
   const tx=160-co*mid[0]+si*mid[1],ty=120-si*mid[0]-co*mid[1];
   const mapped=p.map(([x,y])=>[co*x-si*y+tx,si*x+co*y+ty]);
   ctx.save();ctx.beginPath();ctx.rect(i*320,30,320,300);ctx.clip();ctx.translate(i*320,0);ctx.transform(co,si,-si,co,tx,ty);ctx.drawImage(img,(i%2)*512,Math.floor(i/2)*768,512,768,0,0,512,768);ctx.restore();
   ctx.fillStyle='#fff';ctx.font='18px sans-serif';ctx.fillText(cell.shape,i*320+12,24);
   ctx.strokeStyle='#48cddd';ctx.lineWidth=1;for(const [x,y]of mapped){ctx.beginPath();ctx.moveTo(i*320+x-5,y);ctx.lineTo(i*320+x+5,y);ctx.moveTo(i*320+x,y-5);ctx.lineTo(i*320+x,y+5);ctx.stroke();}
   checks.push({shape:cell.shape,matrix:[co,si,-si,co,tx,ty],mappedIrisCenters:mapped});
  });
  return {png:c.toDataURL(),checks};
 },{uri:'data:image/png;base64,'+bytes.toString('base64'),cells});
 const target=result.checks[0].mappedIrisCenters;
 for(const c of result.checks)for(let i=0;i<2;i++)assert(Math.hypot(c.mappedIrisCenters[i][0]-target[i][0],c.mappedIrisCenters[i][1]-target[i][1])<1e-8);
 const out=path.join(root,'work/authored-face-registration');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'aligned-contact.png'),Buffer.from(result.png.split(',')[1],'base64'));delete result.png;
 result.status='static_candidate_alignment_only';result.sourceSha256=review.imageSha256;result.limits=['Iris centers are coarse authoring aids, not stable motion landmarks.','One similarity transform aligns eyes, not independent cheek/jaw surfaces.','No crossfade animation, runtime replacement or finished lip-sync acceptance.'];
 fs.writeFileSync(path.join(out,'registration.json'),JSON.stringify(result,null,2)+'\n');console.log(out);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
