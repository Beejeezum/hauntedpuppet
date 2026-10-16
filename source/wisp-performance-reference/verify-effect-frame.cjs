const {chromium,webkit}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{const browser=await(process.env.HAUNT_BROWSER==='webkit'?webkit:chromium).launch({args:['--mute-audio']});try{
 const page=await browser.newPage();await page.route('**/frame-pilot',r=>r.fulfill({contentType:'text/html',body:'<body style="background:black">'}));await page.goto((process.env.HAUNT_TEST_BASE||'http://127.0.0.1:8812')+'/frame-pilot');
 const result=await page.evaluate(async()=>{
  const {SpiritAtmosphere}=await import('/assets/spirit-atmosphere.js'),{effectFrame}=await import('/source/wisp-performance-reference/effect-frame.js');
  const fx=await new SpiritAtmosphere().load();if(!fx.ready)throw Error(fx.error);
  const canvas=document.createElement('canvas');canvas.width=2304;canvas.height=1744;const ctx=canvas.getContext('2d');let corners=0,maxParticles=0,minimumClearance=1;
  function contains(b,x,y){return x>=b.minX-1e-7&&x<=b.maxX+1e-7&&y>=b.minY-1e-7&&y<=b.maxY+1e-7;}
  for(let i=0;i<1800;i++){
   const t=i/60,dx=Math.sin(t*1.7)*550,dy=Math.sin(t*.9)*220;
   const body={minX:480+dx,maxX:800+dx,minY:50+dy,maxY:690+dy};
   const emitters=[{id:'head',x:640+dx,y:50+dy},{id:'left',x:480+dx,y:280+dy},{id:'right',x:800+dx,y:280+dy},{id:'tail',x:640+dx,y:690+dy}];
   ctx.clearRect(0,0,2304,1744);ctx.save();ctx.translate(512,512);fx.draw(ctx,{clock:t,body,emissionPoints:emitters,amount:1});ctx.restore();
   const vapor=fx.bounds(),frame=effectFrame([body,vapor],{offsetX:Math.sin(t)*900,offsetY:Math.cos(t)*700,scale:1.3});
   for(const b of[body,vapor].filter(Boolean))for(const x of[b.minX,b.maxX])for(const y of[b.minY,b.maxY])if(!contains(frame.safe,frame.x+x*frame.scale,frame.y+y*frame.scale))throw Error('Unsafe complete effect transform');
   for(const p of fx.particles){const extent=p.size*(1+p.age/p.life*.45),c=Math.cos(p.angle),s=Math.sin(p.angle);for(const x of[-extent*.52,extent*.48])for(const y of[-extent*.33,extent*.33]){const px=p.x+x*c-y*s,py=p.y+x*s+y*c;if(!contains(vapor,px,py))throw Error('Vapor bounds missed actual raster corner');corners++;}}
   minimumClearance=Math.min(minimumClearance,frame.bounds.minX/1280,frame.bounds.minY/720,(1280-frame.bounds.maxX)/1280,(720-frame.bounds.maxY)/720);maxParticles=Math.max(maxParticles,fx.particles.length);
  }
  fx.clear();const cleared=fx.bounds();fx.draw(ctx,{clock:40,body:{minX:0,minY:0,maxX:1,maxY:1},reduced:true});
  return{frames:1800,corners,maxParticles,minimumClearance,cleared,reducedBounds:fx.bounds(),scope:'Actual particle quad geometry and source-space framing pilot. Not integrated live compositor, physical projection or premium art acceptance.'};
 });assert(result.corners>10000);assert(result.minimumClearance>=.15-1e-7);assert.equal(result.cleared,null);assert.equal(result.reducedBounds,null);const dest=path.resolve('../wisp-live-rig-proof/effect-framing-'+(process.env.HAUNT_BROWSER||'chromium')+'.json');fs.writeFileSync(dest,JSON.stringify(result,null,2));console.log('PASS',result);
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
