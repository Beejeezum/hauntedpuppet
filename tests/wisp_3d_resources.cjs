const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch();
  try{
    const page=await browser.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/wisp-resource-soak',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Silent Wisp resource test</title>'}));
    await page.goto((process.env.HAUNT_TEST_BASE||'http://127.0.0.1:8770')+'/wisp-resource-soak');
    const result=await page.evaluate(async()=>{
      const {Wisp3DRuntime}=await import('/assets/wisp-3d-runtime.js');
      const cycles=[];let activeContexts=0,maxActiveContexts=0;
      for(let cycle=0;cycle<8;cycle++){
        const rig=new Wisp3DRuntime();await rig.load();
        if(!rig.ready)throw new Error('Rig load failed: '+rig.error);
        const canvas=rig.canvas,gl=rig.renderer.getContext();
        activeContexts++;maxActiveContexts=Math.max(maxActiveContexts,activeContexts);
        let contextLost=0;canvas.addEventListener('webglcontextlost',()=>{contextLost++;activeContexts--},{once:true});
        document.body.append(canvas);
        for(let frame=0;frame<4;frame++){
          rig.render({clock:cycle+frame/30,dt:1/30,state:'idle',motion:{gesture:100,float:100}},frame/3);
          await new Promise(requestAnimationFrame);
        }
        const sets={geometry:new Set(),material:new Set(),texture:new Set(),skeleton:new Set()};
        rig.model.traverse(object=>{
          if(object.geometry)sets.geometry.add(object.geometry);
          if(object.skeleton)sets.skeleton.add(object.skeleton);
          for(const material of object.material?(Array.isArray(object.material)?object.material:[object.material]):[]){
            sets.material.add(material);
            for(const value of Object.values(material))if(value?.isTexture)sets.texture.add(value);
          }
        });
        const disposed={geometry:0,material:0,texture:0,skeleton:0};
        for(const kind of ['geometry','material','texture'])for(const resource of sets[kind])resource.addEventListener('dispose',()=>disposed[kind]++);
        for(const skeleton of sets.skeleton){const original=skeleton.dispose;skeleton.dispose=function(){disposed.skeleton++;return original.call(this)}}
        const expected=Object.fromEntries(Object.entries(sets).map(([kind,set])=>[kind,set.size]));
        const memoryBefore={...rig.renderer.info.memory};
        rig.dispose();rig.dispose();
        const until=performance.now()+2000;
        while(!contextLost&&performance.now()<until)await new Promise(resolve=>setTimeout(resolve,20));
        cycles.push({expected,disposed,memoryBefore,memoryAfter:{...rig.renderer.info.memory},contextLost,isContextLost:gl.isContextLost(),ready:rig.ready,modelCleared:rig.model===null,bonesCleared:Object.keys(rig.bones).length===0,activeContexts});
        canvas.remove();
      }
      return {cycles,maxActiveContexts,activeContexts,captureElements:document.querySelectorAll('audio,video').length};
    });
    assert.equal(result.cycles.length,8);
    for(const [cycle,sample]of result.cycles.entries()){
      assert(sample.expected.geometry>0&&sample.expected.texture>0&&sample.expected.skeleton>0,'Actual model resources must be observed');
      assert.deepEqual(sample.disposed,sample.expected,'Every unique model resource disposed exactly once on cycle '+cycle);
      assert.equal(sample.contextLost,1,'One explicit context loss per disposed rig');
      assert(sample.isContextLost&&!sample.ready&&sample.modelCleared&&sample.bonesCleared);
      assert.equal(sample.activeContexts,0);
      assert(sample.memoryAfter.geometries<sample.memoryBefore.geometries,'Rendered geometry allocations released');
      assert(sample.memoryAfter.textures<sample.memoryBefore.textures,'Rendered texture allocations released');
    }
    assert.equal(result.maxActiveContexts,1);assert.equal(result.activeContexts,0);assert.equal(result.captureElements,0);assert.deepEqual(errors,[]);
    console.log('PASS eight silent GLB load/render/morph/dispose cycles; unique resources disposed once, GPU allocations reduced, each context lost, no overlapping live contexts',JSON.stringify(result));
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
