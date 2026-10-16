// Isolated BODY-ONLY art review. No production routes, provider or device access.
const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dense=process.argv.includes('--dense');
(async()=>{const out=path.resolve(__dirname,'../../../../wisp-live-rig-proof/fog-evil-turn45-study'+(dense?'-dense':''));fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 if(dense)await page.route('**/wisp-performance/body-views.js',route=>{const source=fs.readFileSync(path.resolve(__dirname,'../../../assets/wisp-performance/body-views.js'),'utf8');assert(source.includes('rows=72'));return route.fulfill({body:source.replace('rows=72','rows=216'),contentType:'text/javascript'});});
 // PaintedBodyViews eagerly loads five images. Unused rear slots are placeholders,
 // explicitly excluded by the angle guard below; they do NOT provide evil rear art.
 await page.route('**/evil-turn45-fixture/body-*.png',route=>route.fulfill({path:path.join(__dirname,'body-evil-45-v1.png'),contentType:'image/png'}));
 await page.goto('http://127.0.0.1:8812/assets/wisp-performance/');
 const report=await page.evaluate(async()=>{
  const P=await import('/assets/vendor/pixi/pixi.mjs'),{PaintedBodyViews}=await import('/assets/wisp-performance/body-views.js'),{auditMesh}=await import('/source/wisp-art-reference/fog-body-study/mesh-audit.mjs');
  const im=new Image();im.src='/source/wisp-art-reference/fog-body-study/body-evil-front-v1.png';await im.decode();
  const body=await new PaintedBodyViews(P).load(im,location.origin+'/evil-turn45-fixture/');
  const app=new P.Application();await app.init({width:1280,height:720,backgroundAlpha:0,autoStart:false,preserveDrawingBuffer:true});app.stop();app.stage.addChild(body.mesh);body.mesh.scale.set(.3);body.mesh.position.set(486.4,129.6);document.body.replaceChildren(app.canvas);document.body.style.cssText='margin:0;background:black';
  function render(angle){if(angle<0||angle>45)throw Error('Only0..45evil art exists');body.render(angle,(x,y)=>[x,y]);app.render();}
  const reference=body.samples[0].v,samples=[];for(let i=0;i<=180;i++){const angle=i<=90?i*.5:(180-i)*.5;render(angle);const audit=auditMesh(reference,body.mesh.vertices,body.mesh.geometry.indexBuffer.data,body.samples[0].uv);samples.push({angle,inverted:audit.inverted,collapsed:audit.collapsed,minimumRatio:audit.minimumRatio});}
  window.__evilTurn={app,body,render};return{samples,scope:'181deterministic body-only front-to45-and-back samples; placeholder rear slots NEVER rendered; no face/arms/voice/RAF/physical acceptance'};
 });
 assert(report.samples.every(s=>s.inverted===0&&s.collapsed===0));
 for(const angle of [0,11.25,22.5,33.75,45]){await page.evaluate(a=>__evilTurn.render(a),angle);await page.screenshot({path:path.join(out,'evil-angle-'+angle+'.png')});}
 await page.evaluate(()=>{__evilTurn.body.destroy();__evilTurn.app.destroy(true);});assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'review.json'),JSON.stringify({...report,dense,errors},null,2));console.log('PASS181body-only0..45reverse samples;5renders saved; not full character acceptance');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
