const {liveWorkspaceUrl}=require('./live-url.cjs');
const{chromium,webkit}=require(process.env.HAUNT_PLAYWRIGHT||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await(process.env.HAUNT_BROWSER==='webkit'?webkit:chromium).launch({args:process.env.HAUNT_BROWSER==='webkit'?[]:['--mute-audio']}),page=await browser.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.route('**/living-skin-test',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0;background:black">'}));
  await page.goto(liveWorkspaceUrl((process.env.HAUNT_TEST_BASE||'http://127.0.0.1:8770')+'/living-skin-test'));
  const report=await page.evaluate(async()=>{
   const{WispPerformanceRuntime}=await import('/assets/wisp-performance-runtime.js');const r=await new WispPerformanceRuntime().load();if(!r.frontRig?.ready)throw Error(r.frontError);document.body.append(r.canvas);
   r.render({clock:0,freeze:true,state:'idle'},0);const rig=r.frontRig,uv=rig.body.geometry.getBuffer('aSpiritUV').data,bodyUniforms=rig.bodyViews.shader.resources.spiritUniforms.uniforms;
   r.face.visible=false;for(const a of rig.arms){a.mesh.visible=false;a.front.visible=false;}
   const scan=document.createElement('canvas');scan.width=1280;scan.height=720;const x=scan.getContext('2d',{willReadFrequently:true});
   function pixels(strength,time){bodyUniforms.uSpiritStrength=strength;bodyUniforms.uSpiritTime=time;r.app.renderer.render(r.app.stage);x.clearRect(0,0,1280,720);x.drawImage(r.canvas,0,0);return x.getImageData(0,0,1280,720).data;}
   const solid=pixels(0,0),a=pixels(.9,0),b=pixels(.9,4);let head=0,tail=0,hn=0,tn=0,changing=0;
   for(let k=0;k<solid.length;k+=4){const y=Math.floor(k/4/1280);if(solid[k+3]<245||solid[k]<140)continue;if(y<330){head+=a[k+3]/solid[k+3];hn++;}if(y>450){tail+=a[k+3]/solid[k+3];tn++;}if(Math.abs(a[k+3]-b[k+3])>6)changing++;if(a[k+3]>solid[k+3]+1)throw Error('Transmission added opacity outside the painting');}
   if(hn<100||tn<100||head/hn<.8||tail/tn>.75||changing<200)throw Error('Actual GPU transmission missing '+JSON.stringify({hn,tn,head:head/hn,tail:tail/tn,changing}));
   // Splitting a translucent arm around the torso must preserve one arm's opacity.
   rig.body.visible=false;let maxLayerError=0,maxAlphaError=0,worstLayer=null;
   for(const arm of rig.arms){
    for(const part of rig.arms){part.mesh.visible=part===arm;part.front.visible=part===arm;}
    for(const mesh of [arm.mesh,arm.front]){mesh.vertices.set(arm.base);mesh.geometry.getBuffer('aPosition').update();}
    for(const shader of [arm.shader,arm.frontShader]){shader.resources.spiritUniforms.uniforms.uSpiritStrength=.9;shader.resources.spiritUniforms.uniforms.uSpiritTime=0;}
    let reference;
    for(const coverage of [0,.5,1]){
     for(const shader of [arm.shader,arm.frontShader])shader.resources.morphUniforms.uniforms.uFrontAmount=coverage;
     r.app.renderer.render(r.app.stage);x.clearRect(0,0,1280,720);x.drawImage(r.canvas,0,0);const data=x.getImageData(0,0,1280,720).data;
     if(!reference)reference=data;else for(let k=0;k<data.length;k+=4){maxAlphaError=Math.max(maxAlphaError,Math.abs(data[k+3]-reference[k+3]));for(let c=0;c<3;c++){const error=Math.abs(data[k+c]*data[k+3]/255-reference[k+c]*reference[k+3]/255);if(error>maxLayerError){maxLayerError=error;worstLayer={side:arm.side,coverage,xy:[k/4%1280,Math.floor(k/4/1280)],before:[...reference.slice(k,k+4)],after:[...data.slice(k,k+4)]};}}}
    }
   }
   if(maxLayerError>4||maxAlphaError>3)throw Error('Transparent arm is painted twice '+JSON.stringify({maxLayerError,maxAlphaError,worstLayer}));
   rig.body.visible=true;r.face.visible=true;for(const arm of rig.arms){arm.mesh.visible=true;arm.front.visible=true;}
   const headRow=Math.round((600-rig.bodyViews.reference.top+12)/(rig.bodyViews.reference.bottom-rig.bodyViews.reference.top+24)*rig.bodyViews.rows),tailRow=Math.round((1300-rig.bodyViews.reference.top+12)/(rig.bodyViews.reference.bottom-rig.bodyViews.reference.top+24)*rig.bodyViews.rows),col=rig.bodyViews.columns/2,stride=rig.bodyViews.columns+1,values=[];
   for(let n=0;n<=480;n++){r.render({clock:n/60,dt:1/60,state:'idle'},n>240?1:0);const v=rig.body.vertices;if(n<=240)values.push(v[(tailRow*stride+col)*2]-v[(headRow*stride+col)*2]);if(!r.inspect().bounds.inside)throw Error('Living skin clips the stage');}
   const relativeBend=Math.max(...values)-Math.min(...values);if(relativeBend<45)throw Error('Body remains rigid '+relativeBend);
   if(r.inspect().frontRig.livingSkin.translucency<.8)throw Error('Normal runtime does not enable the material');
   r.render({clock:10,reduced:true,state:'idle'},0);const first=[...rig.body.vertices];r.render({clock:40,reduced:true,state:'idle'},0);if(rig.body.vertices.some((v,i)=>v!==first[i])||bodyUniforms.uSpiritTime!==0)throw Error('Reduced motion keeps animating skin');
   r.render({clock:41,freeze:true,state:'idle'},0);if(bodyUniforms.uSpiritStrength!==0)throw Error('Frozen artwork reference changed');
   r.render({clock:42,visible:0,state:'hidden'},0);x.clearRect(0,0,1280,720);x.drawImage(r.canvas,0,0);if(x.getImageData(0,0,1280,720).data.some(v=>v!==0))throw Error('Living material escapes blackout');
   const result={headTransmission:head/hn,tailTransmission:tail/tn,animatedAlphaPixels:changing,maxLayerError,maxAlphaError,relativeSpineBend:relativeBend,bodyVertices:uv.length/2,reducedMotion:true,blackout:true,scope:'Actual isolated GPU pixels and mesh deformation; no physical projection or provider audio'};r.dispose();return result;
  });
  assert.deepEqual(errors,[]);fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/wisp-living-skin.json',JSON.stringify(report,null,2));console.log('PASS living painted skin',report);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
