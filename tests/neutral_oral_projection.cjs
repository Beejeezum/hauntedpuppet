const assert=require('node:assert/strict'),fs=require('node:fs'),pw=require('playwright');
(async()=>{
 const fixture=await require('./tonight_fixture.cjs').start(),engine=process.env.HAUNT_BROWSER||'chromium',browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(fixture.base+'/source/wisp-art-reference/scary-speaking-study/neutral-face-rig-study/index.html');await page.waitForFunction(()=>window.WispNeutralFaceStudy?.rig.ready);
  const result=await page.evaluate(()=>{
   const rig=WispNeutralFaceStudy.rig,gl=rig.gl,buffers=[];rig.canvas.width=rig.canvas.height=100;
   gl.viewport(0,0,100,100);gl.useProgram(rig.program);gl.uniform2f(gl.getUniformLocation(rig.program,'size'),100,100);gl.uniform1f(rig.cavity,2);
   const attr=(location,data)=>{const b=gl.createBuffer();buffers.push(b);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);return b;};
   const position=attr(rig.positionLocation,new Array(12).fill(0));attr(rig.uvLocation,[0,0,1,0,0,1,1,0,1,1,0,1]);attr(rig.oralLimitsLocation,[0,1,0,1,0,1,0,1,0,1,0,1]);
   // Calibration stripes stand in for tooth thickness; these are not Wisp art.
   const pixels=new Uint8Array(100*100*4);for(let y=0;y<100;y++)for(let x=0;x<100;x++){const i=(y*100+x)*4;pixels[i+3]=255;if(y>=5&&y<15)pixels[i]=255;if(y>=85&&y<95)pixels[i+1]=255;}
   const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,100,100,0,gl.RGBA,gl.UNSIGNED_BYTE,pixels);for(const key of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,key,gl.NEAREST);for(const key of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,key,gl.CLAMP_TO_EDGE);
   const sample=(open,rigid)=>{const bottom=10+80*open;gl.bindBuffer(gl.ARRAY_BUFFER,position);gl.bufferSubData(gl.ARRAY_BUFFER,0,new Float32Array([10,10,90,10,10,bottom,90,10,90,bottom,10,bottom]));gl.uniform1f(rig.jawOpen,open);gl.uniform1f(rig.rigidOralUniform,rigid?1:0);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,6);const out=new Uint8Array(100*100*4);gl.readPixels(0,0,100,100,gl.RGBA,gl.UNSIGNED_BYTE,out);const stripe=channel=>{const rows=[];for(let y=0;y<100;y++){const i=((99-y)*100+50)*4;if(out[i+channel]>180&&out[i+(1-channel)]<30)rows.push(y);}return{height:rows.length,first:rows[0]??null,last:rows.at(-1)??null};};return{open,rigid,upper:stripe(0),lower:stripe(1)};};
   const samples=[sample(1,true),sample(.75,true),sample(.5,true),sample(.5,false),sample(.125,true)],gpuError=gl.getError();for(const b of buffers)gl.deleteBuffer(b);gl.deleteTexture(texture);rig.dispose();return{samples,gpuError};
  });
  const [full,threeQuarter,half,stretched,almostClosed]=result.samples;assert.equal(result.gpuError,0);assert(full.upper.height>=7&&full.lower.height>=7);
  for(const r of [threeQuarter,half]){assert.equal(r.upper.height,full.upper.height,'Upper oral feature keeps its actual rendered thickness');assert.equal(r.lower.height,full.lower.height,'Lower oral feature keeps its actual rendered thickness');assert.equal(r.upper.first,full.upper.first,'Upper feature stays attached to fixed upper lip');}
  assert.equal(full.lower.last-half.lower.last,40,'Lower feature follows jaw displacement');assert(stretched.upper.height<half.upper.height-2,'Prior stretch mode measurably shrinks features');assert(almostClosed.upper.height<half.upper.height,'Closing occludes the oral feature at the gap');assert.deepEqual(errors,[]);
  fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/neutral-oral-projection-'+engine+'.json',JSON.stringify({passed:true,...result,scope:'Actual face WebGL shader with synthetic calibration stripes on a controlled quad. Proves attachment, constant oral feature thickness and occlusion, not beautiful teeth, phonemes, head/body tracking, voice or physical projection.'},null,2));console.log('PASS '+engine+' actual oral shader preserves upper/lower feature thickness, upper attachment and lower jaw displacement; closure occludes instead of scaling.');
 }finally{await browser.close();await fixture.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
