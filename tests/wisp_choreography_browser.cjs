const {liveWorkspaceUrl}=require('./live-url.cjs');
const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>route.request().isNavigationRequest()&&new URL(route.request().url()).pathname==='/'?route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Wisp offline animation rehearsal</title><body></body>'}):route.continue());
 await page.goto(liveWorkspaceUrl(process.env.HAUNT_TEST_BASE||'http://127.0.0.1:8770'));
 const result=await page.evaluate(async()=>{
  const {PaintedWisp,WISP_MOUTHS,WISP_EXPRESSIONS}=await import('/assets/painted-wisp.js'),{WISP_CHOREOGRAPHY_ACTIONS}=await import('/assets/wisp-choreography.js');
  const w=new PaintedWisp();await w.load();const p={dt:1/60,state:'idle',visible:1,density:1,motion:{float:100,gesture:100},acting:{},gaze:'audience',blink:0};let frames=0,minX=Infinity,maxX=0,minY=Infinity,maxY=0,poses={};
  for(const [kind,duration]of Object.entries(WISP_CHOREOGRAPHY_ACTIONS)){
   let travel={x:[],y:[],rotation:[]};
   for(let n=0;n<Math.ceil((duration+.4)*30);n++){
    w.render({...p,clock:frames/30,dt:1/30,action:{kind,at:n/30}});const s=w.inspect();if(!s.bounds.inside)throw Error(kind+' clipped: '+JSON.stringify(s.bounds));
    minX=Math.min(minX,s.bounds.minX);maxX=Math.max(maxX,s.bounds.maxX);minY=Math.min(minY,s.bounds.minY);maxY=Math.max(maxY,s.bounds.maxY);travel.x.push(s.pose.dx);travel.y.push(s.pose.dy);travel.rotation.push(s.pose.rotation);frames++;
   }
   poses[kind]={x:Math.max(...travel.x)-Math.min(...travel.x),y:Math.max(...travel.y)-Math.min(...travel.y),rotation:Math.max(...travel.rotation)-Math.min(...travel.rotation)};
   // Every possible painted mouth/expression stays registered at the most expanded action phase.
   for(const mouth of WISP_MOUTHS)for(const expression of WISP_EXPRESSIONS){w.setTestPose({mouth,expression,freeze:false});w.render({...p,clock:frames/30,action:{kind,at:duration*.4}});if(!w.inspect().bounds.inside)throw Error('Pose clipped '+kind+' '+mouth+' '+expression);frames++;}w.setTestPose(null);
   // Interruption returns to idle without reverse full turns, stale mouth or animation ownership.
   w.render({...p,clock:frames/30,action:{kind,at:duration*.45}});const initial=w.inspect().pose.rotation;
   for(let n=0;n<120;n++)w.render({...p,gaze:'center',motion:{float:0,gesture:100},clock:frames/30,action:{kind:'',at:100}});
   const settled=w.inspect();if(settled.choreography.active||Math.abs(settled.pose.rotation)>.001||Math.abs(settled.pose.dx)>.001||Math.abs(settled.pose.dy)>.01)throw Error('Did not settle '+kind);
  }
  const transitionBase={...p,gaze:'center',motion:{float:0,gesture:100},clock:0};
  for(let n=0;n<30;n++)w.render({...transitionBase,action:{kind:'dance',at:2.5}});
  const beforeSwitch=w.inspect().pose;w.render({...transitionBase,action:{kind:'twirl',at:0}});const afterSwitch=w.inspect().pose,handoffDelta=Math.abs(afterSwitch.dx-beforeSwitch.dx),handoffAngle=Math.abs(Math.atan2(Math.sin(afterSwitch.rotation-beforeSwitch.rotation),Math.cos(afterSwitch.rotation-beforeSwitch.rotation)));
  if(handoffDelta>25||handoffAngle>.12)throw Error('New operator action snapped instead of handing off');
  for(let n=0;n<120;n++)w.render({...transitionBase,action:{kind:'',at:100}});
  // Attach only the approved-art canvas for the visual proof, no application or microphone work.
  w.render({...p,clock:3,action:{kind:'celebrate',at:.73}});document.body.replaceChildren(w.canvas);document.body.style.cssText='margin:0;background:#08091a;display:grid;place-items:center;min-height:100vh';w.canvas.style.width='min(100vw,1280px)';
  return {frames,minX,maxX,minY,maxY,handoffDelta,handoffAngle,poses,envelope:w.verifyEnvelope(),registeredLayers:w.layers.size};
 });
 const depth=await page.evaluate(async()=>{const {PaintedWisp}=await import('/assets/painted-wisp.js'),{ScaryWisp}=await import('/assets/scary-wisp.js'),{actionDuration}=await import('/assets/wisp-choreography.js'),report={};for(const [form,Constructor]of [['friendly',PaintedWisp],['haunting',ScaryWisp]]){const w=new Constructor();await w.load();await w.tailCelPromise;for(const kind of ['enter','exit','orbit']){let min=Infinity,max=0;for(let n=0;n<=360;n++){w.render({clock:n/60,dt:1/60,state:'idle',visible:1,density:1,gaze:'center',motion:{float:80,gesture:85},action:{kind,at:n/360*actionDuration(kind)}});const s=w.inspect(),h=s.bounds.maxY-s.bounds.minY;if(!s.bounds.inside)throw Error(form+' '+kind+' depth clipped');min=Math.min(min,h);max=Math.max(max,h);}report[form+' '+kind]={minHeight:min,maxHeight:max};if(kind!=='orbit'&&(min>16||max<600))throw Error('Depth not dramatic enough '+form+' '+kind+' '+min+'/'+max);}}return report;});console.log('DEPTH',JSON.stringify(depth));
 assert(result.frames>2000);assert(result.envelope.inside);assert.equal(result.registeredLayers,23);assert(result.poses.dance.x>160);assert(result.poses.twirl.rotation>6);assert.deepEqual(errors,[]);
 fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/wisp-depth-validation.json',JSON.stringify({depth,...result},null,2));await page.screenshot({path:'test-results/wisp-bold-choreography.png'});
 await page.evaluate(async()=>{const {PaintedWisp}=await import('/assets/painted-wisp.js'),{WISP_CHOREOGRAPHY_ACTIONS}=await import('/assets/wisp-choreography.js'),w=new PaintedWisp();await w.load();const sheet=document.createElement('canvas');sheet.width=1440;sheet.height=1240;const c=sheet.getContext('2d');c.fillStyle='#08091a';c.fillRect(0,0,sheet.width,sheet.height);const phase={wave:.9,shy:1.4,laugh:.8,surprise:.48,dance:.75,twirl:1.6,bounce:.65,peekaboo:1.5,celebrate:.73,orbit:1.25,enter:.85,exit:1.2};let i=0;for(const kind of Object.keys(WISP_CHOREOGRAPHY_ACTIONS)){for(let n=0;n<15;n++)w.render({state:'idle',clock:0,dt:1/60,visible:1,density:1,motion:{float:0,gesture:100},gaze:'center',acting:{},action:{kind,at:phase[kind]},blink:0});const x=(i%3)*480,y=Math.floor(i/3)*310;c.drawImage(w.canvas,x,y,480,270);c.fillStyle='#e5dcff';c.font='18px sans-serif';c.textAlign='center';c.fillText(kind,x+240,y+292);i++;}document.body.replaceChildren(sheet);sheet.style.cssText='width:1440px;height:1240px';});
 await page.setViewportSize({width:1440,height:1240});await page.screenshot({path:'test-results/wisp-choreography-contact-sheet.png'});await browser.close();console.log('PASS painted authored routines:',JSON.stringify(result));
})().catch(e=>{console.error(e);process.exit(1)});
