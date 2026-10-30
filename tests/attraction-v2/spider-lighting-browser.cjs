// Compare the exact painted rig with and without a small ambient-light composite.
const assert=require('node:assert/strict'),fs=require('node:fs'),pw=require('playwright');process.env.HAUNT_TONIGHT_ROOT='.';
(async()=>{
 const fixture=await require('../tonight_fixture.cjs').start(),engine=process.env.HAUNT_BROWSER||'chromium',browser=await pw[engine].launch(),page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const folder=`work/yard-spider/light-${engine}`;fs.mkdirSync(folder,{recursive:true});
 try{
  await page.goto(fixture.base+'/source/attraction-v2/console/spider-study.html');await page.waitForFunction(()=>window.WispSpiderStudy?.inspect().ready);
  const result=await page.evaluate(async()=>{
   const {SilkSpider}=await import('./silk-spider.mjs'),lights=[0,.10,.16,.24],rigs=lights.map(light=>new SilkSpider({light}));await Promise.all(rigs.map(r=>r.load()));rigs.forEach(r=>r.start(0));
   const canvases=lights.map(()=>Object.assign(document.createElement('canvas'),{width:1280,height:720})),contexts=canvases.map(c=>c.getContext('2d',{willReadFrequently:true}));
   const snapshots=[],problems=[];
   for(const t of [3.5,6,11,17,19.4,22,25.7,28,39.5,42,47,53,55.4,58,61.7,64]){
    const pixels=[];
    for(let i=0;i<rigs.length;i++){contexts[i].clearRect(0,0,1280,720);rigs[i].draw(contexts[i],t);pixels.push(contexts[i].getImageData(0,0,1280,720).data);}
    const summaries=[];
    for(let i=0;i<lights.length;i++){
     let alphaChanges=0,outside=0,lit=0,white=0,sum=0,opaque=0;const a=pixels[0],b=pixels[i];
     for(let p=0;p<a.length;p+=4){if(a[p+3]!==b[p+3])alphaChanges++;if(!a[p+3]&&b[p+3])outside++;if(b[p+3]>200){sum+=(b[p]+b[p+1]+b[p+2])/3;opaque++;if(b[p]>250&&b[p+1]>250&&b[p+2]>250)white++;}if(b[p]>a[p]+3||b[p+1]>a[p+1]+3||b[p+2]>a[p+2]+3)lit++;}
     if(alphaChanges||outside)problems.push({t,light:lights[i],alphaChanges,outside});summaries.push({light:lights[i],litPixels:lit,opaqueMean:opaque?sum/opaque:0,whitePixels:white,alphaChanges,outside,bounds:rigs[i].inspect().bounds});
    }
    snapshots.push({t,phase:rigs[0].inspect().phase,summaries,images:[6,11,17,22].includes(t)?canvases.map(c=>c.toDataURL()):null});
   }
   rigs.forEach(r=>r.dispose());return{lights,problems,snapshots};
  });
  assert.deepEqual(result.problems,[],'Lighting must preserve every alpha value and not grow a halo');
  for(const frame of result.snapshots){for(const s of frame.summaries)assert.deepEqual(s.bounds,frame.summaries[0].bounds);if(frame.phase==='empty')assert(frame.summaries.every(s=>s.litPixels===0));}
  const held=result.snapshots.find(s=>s.t===11);assert(held.summaries[2].opaqueMean>held.summaries[0].opaqueMean+15);assert(held.summaries[2].whitePixels<=held.summaries[0].whitePixels,'No newly blown white details');
  for(const frame of result.snapshots){if(frame.images){for(const [i,data] of frame.images.entries())fs.writeFileSync(`${folder}/${frame.t}s-light-${result.lights[i]}.png`,Buffer.from(data.split(',')[1],'base64'));}delete frame.images;}
  assert.deepEqual(errors,[]);fs.writeFileSync(folder+'/report.json',JSON.stringify({engine,scope:'actual browser raster comparison; same source identity/motion/alpha, no physical projection or human art approval',errors,...result},null,2));console.log('PASS '+engine+' painted light lift, identical alpha/bounds and no new white clipping over both placements.');
 }finally{await browser.close();await fixture.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
