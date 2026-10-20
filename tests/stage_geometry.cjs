const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
(async()=>{const browser=await chromium.launch({args:['--mute-audio']});try{
 const page=await browser.newPage();await page.goto('about:blank');
 const module=fs.readFileSync(path.join(__dirname,'../assets/stage-compositor.js'),'base64');
 const art=path.join(__dirname,'../source/wisp-performance-reference/ambient-show/fog-lettering-study');
 const png=fs.readFileSync(path.join(art,'happy-halloween-fog-v1.png'),'base64');
 const result=await page.evaluate(async({module,png})=>{
  const {StageCompositor}=await import('data:text/javascript;base64,'+module);
  const tile=document.createElement('canvas');tile.width=tile.height=100;const tx=tile.getContext('2d');tx.fillStyle='red';tx.fillRect(0,0,100,100);
  const c=document.createElement('canvas');c.width=c.height=100;const s=new StageCompositor(c);s.add({id:'test',source:tile,scale:.5,x:.1,y:-.1});s.reveal();s.render();
  const pixels=c.getContext('2d').getImageData(0,0,100,100).data;let xs=[],ys=[];for(let y=0;y<100;y++)for(let x=0;x<100;x++)if(pixels[(y*100+x)*4]>100){xs.push(x);ys.push(y);}
  const bounds=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];let invalid=0;for(const patch of [{scale:null},{scale:NaN},{x:Infinity},{y:2}])try{s.update('test',patch)}catch{invalid++;}
  const saved=s.inspect().layers[0];s.blackout();s.update('test',{scale:1});s.render();const staysBlack=!c.getContext('2d').getImageData(0,0,100,100).data.some((v,i)=>i%4!==3&&v);
  const image=new Image();image.src='data:image/png;base64,'+png;await image.decode();const stage=document.createElement('canvas');stage.width=1280;stage.height=720;const comp=new StageCompositor(stage);comp.add({id:'lettering',source:image,scale:.7});comp.reveal();comp.render();const p=stage.getContext('2d').getImageData(0,0,1280,720).data,checks={};
  for(const threshold of [1,4,16]){let minX=1280,minY=720,maxX=-1,maxY=-1;for(let y=0;y<720;y++)for(let x=0;x<1280;x++){const i=(y*1280+x)*4;if(Math.max(p[i],p[i+1],p[i+2])>threshold){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}}checks[threshold]=[minX/1280,minY/720,(1279-maxX)/1280,(719-maxY)/720];}
  const stagePng=stage.toDataURL('image/png').split(',')[1];comp.blackout();const emptyStagePng=stage.toDataURL('image/png').split(',')[1];return{bounds,invalid,saved,staysBlack,checks,stagePng,emptyStagePng};
 },{module,png});
 assert.deepEqual(result.bounds,[35,15,84,64]);assert.equal(result.invalid,4);assert.equal(result.saved.scale,.5);assert.equal(result.saved.x,.1);assert(result.staysBlack);for(const m of Object.values(result.checks))assert(Math.min(...m)>=.2,'Rendered complete effect must retain20percent reserve');
 const out=path.join(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'stage-geometry-fog.png'),Buffer.from(result.stagePng,'base64'));fs.writeFileSync(path.join(out,'stage-geometry-empty.png'),Buffer.from(result.emptyStagePng,'base64'));delete result.stagePng;delete result.emptyStagePng;fs.writeFileSync(path.join(out,'stage-geometry.json'),JSON.stringify({...result,scope:'Actual compositor render of static lettering at70percent; not animated clearance or physical projection'},null,2));console.log('PASS layer scale/offset, invalid placement rejection, Blackout latch and actual fog-lettering20percent stage reserve.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
