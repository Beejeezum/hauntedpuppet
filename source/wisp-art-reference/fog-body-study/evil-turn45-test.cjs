// Isolated BODY-ONLY art review. No production routes, provider or device access.
const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dense=process.argv.includes('--dense'),quantile=process.argv.includes('--quantile'),inbetween=process.argv.includes('--inbetween');
(async()=>{const out=path.resolve(__dirname,'../../../../wisp-live-rig-proof/fog-evil-turn45-study'+(dense?'-dense':'')+(quantile?'-quantile':'')+(inbetween?'-inbetween':''));fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 if(dense||quantile)await page.route('**/wisp-performance/body-views.js',route=>{const source=fs.readFileSync(path.resolve(__dirname,'../../../assets/wisp-performance/body-views.js'),'utf8');let code=source;if(dense){assert(code.includes('rows=72'));code=code.replace('rows=72','rows=216');}if(quantile){const needle='if(r>=l){top=Math.min(top,y);bottom=y;}';assert(code.includes(needle));code=code.replace(needle,`if(r>=l){let total=0;for(let xx=l;xx<=r;xx++){const a=p[(y*c.width+xx)*4+3]/255;total+=a*a;}let sum=0;cl=l;cr=r;let found=false;for(let xx=l;xx<=r;xx++){const a=p[(y*c.width+xx)*4+3]/255;sum+=a*a;if(!found&&sum>=total*.10){cl=xx;found=true;}if(sum>=total*.90){cr=xx;break;}}} `+needle);}return route.fulfill({body:code,contentType:'text/javascript'});});
 // PaintedBodyViews eagerly loads five images. Unused rear slots are placeholders,
 // explicitly excluded by the angle guard below; they do NOT provide evil rear art.
 await page.route('**/evil-turn45-fixture/body-*.png',route=>route.fulfill({path:path.join(__dirname,inbetween&&new URL(route.request().url()).pathname.endsWith('body-45.png')?'body-evil-22.5-v1.png':'body-evil-45-v1.png'),contentType:'image/png'}));
 await page.goto('http://127.0.0.1:8812/assets/wisp-performance/');
 const report=await page.evaluate(async({inbetween})=>{
  const P=await import('/assets/vendor/pixi/pixi.mjs'),{PaintedBodyViews}=await import('/assets/wisp-performance/body-views.js'),{auditMesh}=await import('/source/wisp-art-reference/fog-body-study/mesh-audit.mjs');
  const im=new Image();im.src='/source/wisp-art-reference/fog-body-study/body-evil-front-v1.png';await im.decode();
  const body=await new PaintedBodyViews(P).load(im,location.origin+'/evil-turn45-fixture/');
  const app=new P.Application();await app.init({width:1280,height:720,backgroundAlpha:0,autoStart:false,preserveDrawingBuffer:true});app.stop();app.stage.addChild(body.mesh);body.mesh.scale.set(.3);body.mesh.position.set(486.4,129.6);document.body.replaceChildren(app.canvas);document.body.style.cssText='margin:0;background:black';
  function render(angle){if(angle<0||angle>45)throw Error('Only0..45evil art exists');body.render(angle*(inbetween?2:1),(x,y)=>[x,y]);app.render();}
  const reference=body.samples[0].v,samples=[];for(let i=0;i<=180;i++){const angle=i<=90?i*.5:(180-i)*.5;render(angle);const audit=auditMesh(reference,body.mesh.vertices,body.mesh.geometry.indexBuffer.data,body.samples[0].uv);samples.push({angle,inverted:audit.inverted,collapsed:audit.collapsed,minimumRatio:audit.minimumRatio});}
  let collapsedDetail=[];
  if(inbetween){render(22.5);const c=document.createElement('canvas'),image=body.textures[1].source.resource;c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height).data,indices=body.mesh.geometry.indexBuffer.data,v=body.mesh.vertices,uv=body.samples[1].uv;
   const area=(p,a,b,c)=>(p[b*2]-p[a*2])*(p[c*2+1]-p[a*2+1])-(p[b*2+1]-p[a*2+1])*(p[c*2]-p[a*2]);
   for(let k=0;k<indices.length;k+=3){const ids=Array.from(indices.slice(k,k+3)),r=area(reference,...ids),q=area(v,...ids);if(Math.abs(r)<1e-7||Math.abs(q/r)>=.01)continue;const probes=ids.map(i=>[uv[i*2],uv[i*2+1]]);probes.push([(probes[0][0]+probes[1][0]+probes[2][0])/3,(probes[0][1]+probes[1][1]+probes[2][1])/3]);collapsedDetail.push({triangle:k/3,rows:ids.map(i=>Math.floor(i/(body.columns+1))),ratio:q/r,probeAlpha:probes.map(([x,y])=>pixels[(Math.max(0,Math.min(c.height-1,Math.round(y*c.height)))*c.width+Math.max(0,Math.min(c.width-1,Math.round(x*c.width))))*4+3])});}
  }
  window.__evilTurn={app,body,render};return{samples,collapsedDetail,scope:'181deterministic body-only front-to45-and-back samples; placeholder unused slots NEVER rendered; no face/arms/voice/RAF/physical acceptance',inbetween};
 },{inbetween});

 for(const angle of [0,11.25,22.5,33.75,45]){await page.evaluate(a=>__evilTurn.render(a),angle);await page.screenshot({path:path.join(out,'evil-angle-'+angle+'.png')});}
 await page.evaluate(()=>{__evilTurn.body.destroy();__evilTurn.app.destroy(true);});assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'review.json'),JSON.stringify({...report,dense,quantile,inbetween,errors},null,2));assert(report.samples.every(s=>s.inverted===0&&s.collapsed===0));console.log('PASS181body-only0..45reverse samples;5renders saved; not full character acceptance');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
