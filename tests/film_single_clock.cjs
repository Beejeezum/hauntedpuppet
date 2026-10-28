const assert=require('node:assert/strict'),pw=require('playwright');
process.env.HAUNT_TONIGHT_ROOT='dist';
(async()=>{const fixture=await require('./tonight_fixture.cjs').start(),engine=process.env.HAUNT_BROWSER||'chromium',browser=await pw[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{});try{
 const page=await browser.newPage();await page.goto(fixture.base+'/assets/wisp-showdesk/director.html');
 const result=await page.evaluate(async()=>{
  const {FilmTransport}=await import('/assets/wisp-showdesk/film-transport.mjs'),{StageCompositor}=await import('/assets/stage-compositor.js');
  const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;document.body.append(canvas);const host=document.createElement('div');document.body.append(host);
  const comp=new StageCompositor(canvas),transport=new FilmTransport(comp,[{id:'first',src:'/assets/wisp-showdesk/friendly.mp4',loop:true,exitPolicy:'finish'},{id:'next',src:'/assets/wisp-showdesk/scary.mp4',loop:false,exitPolicy:'finish'}],{mediaHost:host});
  const one=await transport.prepare('first');await transport.activate(one,()=>true);comp.setLevel(1);comp.render();
  const two=await transport.prepare('next'),old=transport.active;
  const checksum=()=>{comp.render();const d=canvas.getContext('2d').getImageData(0,0,1280,720).data;let sum=0;for(let i=0;i<d.length;i+=4)sum=(sum+d[i]*3+d[i+1]*5+d[i+2]*7)>>>0;return sum};
  let release;const actualFrame=transport.frame.bind(transport);transport.frame=async video=>{if(transport.active!==null||!old.paused||old.getAttribute('src')!==null)throw Error('Outgoing pipeline was not released before starting incoming film');await new Promise(r=>release=r);await actualFrame(video);};
  const switching=transport.activate(two,()=>true);const held=checksum();if(!transport.heldFrame||!held)throw Error('Exact outgoing picture was not retained');
  await new Promise(r=>setTimeout(r,120));const stillHeld=checksum();await transport.exit(10,()=>true,{keepPicture:true});const retainedCut=!comp.black&&comp.level===1;
  release();await switching;const activeIsIncoming=transport.active===two.video&&!transport.heldFrame;
  const cancelled=await transport.prepare('first');let live=true,finish;transport.frame=()=>new Promise(r=>finish=r);const late=transport.activate(cancelled,()=>live);live=false;transport.blackout();finish();await late;
  const cleared=!transport.active&&!transport.heldFrame&&transport.frameCanvas.width===0&&comp.black;transport.dispose();comp.dispose();host.remove();canvas.remove();
  return{held,stillHeld,retainedCut,activeIsIncoming,cleared};
 });assert.equal(result.held,result.stillHeld,'Outgoing image must remain pixel-identical during clock handoff');assert(result.retainedCut&&result.activeIsIncoming&&result.cleared);console.log('PASS '+engine+' outgoing clock release before incoming playback, exact held picture, reviewed-cut hold and Blackout cleanup (real film decoding, muted)');
 }finally{await browser.close();await fixture.close()}})().catch(e=>{console.error(e);process.exitCode=1});
