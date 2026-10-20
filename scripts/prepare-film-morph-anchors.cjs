// Stage exact decoded film endpoints using the same compositor as the show desk.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
(async()=>{
 const root=process.argv[2]||'source/wisp-performance-reference/runway-pilots/film-morph-handoff-study';
 const sources=JSON.parse(fs.readFileSync(path.join(root,'decoded-sources.json')));
 const browser=await chromium.launch({args:['--mute-audio']});
 try{const page=await browser.newPage();await page.goto('about:blank');const rows=[];
  for(const source of sources){
   const file=path.join(root,source.label+'-staged.png');if(fs.existsSync(file))throw Error('Preserve existing anchor');
   const result=await page.evaluate(async({module,png})=>{
    const {StageCompositor}=await import('data:text/javascript;base64,'+module),image=new Image();image.src='data:image/png;base64,'+png;await image.decode();
    const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;const stage=new StageCompositor(canvas);stage.add({id:'film',source:image,scale:.85});stage.reveal();stage.render();
    const data=canvas.getContext('2d').getImageData(0,0,1280,720).data,checks={};
    for(const threshold of [4,8,16]){let left=1280,top=720,right=-1,bottom=-1;for(let y=0;y<720;y++)for(let x=0;x<1280;x++){const i=(y*1280+x)*4;if(Math.max(data[i],data[i+1],data[i+2])>threshold){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}}checks[threshold]=[left/1280,top/720,(1279-right)/1280,(719-bottom)/720];}
    const stagedPng=canvas.toDataURL('image/png');stage.dispose();return{png:stagedPng,checks};
   },{module:fs.readFileSync('assets/stage-compositor.js','base64'),png:fs.readFileSync(path.join(root,source.decoded),'base64')});
   if(Object.values(result.checks).some(m=>Math.min(...m)<.2))throw Error('Endpoint misses20percent reserve');
   const bytes=Buffer.from(result.png.split(',')[1],'base64');fs.writeFileSync(file,bytes);rows.push({...source,staged:path.basename(file),stagedSha256:crypto.createHash('sha256').update(bytes).digest('hex'),margins:result.checks});
  }
  fs.writeFileSync(path.join(root,'preflight.json'),JSON.stringify({status:'prepared; no generation submitted',scale:.85,canvas:[1280,720],method:sources.some(s=>s.kind==='painted-reference')?'Painted reference images staged at85percent whole-frame fit through the actual compositor; not decoded film endpoints. No repaint, crop or pose registration.':'Exact decoded film endpoints staged at identical85percent fit; source films must use this same fit in the join review. No pose repaint or registration.',sources:rows},null,2)+'\n');
  console.log('Prepared '+rows.length+' staged reference(s) with20percent reserve.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
