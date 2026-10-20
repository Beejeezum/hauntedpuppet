const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.HAUNT_PLAYWRIGHT||'playwright');
(async()=>{const browser=await chromium.launch({args:['--mute-audio']});try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('about:blank');
 const source=fs.readFileSync(path.join(__dirname,'../assets/stage-compositor.js'),'utf8');
 const result=await page.evaluate(async moduleSource=>{
  const {StageCompositor}=await import('data:text/javascript;base64,'+btoa(moduleSource));
  const canvas=document.createElement('canvas');canvas.width=canvas.height=4;
  const tile=color=>{const c=document.createElement('canvas');c.width=c.height=4;const x=c.getContext('2d');x.fillStyle=color;x.fillRect(0,0,4,4);return c};
  const c=new StageCompositor(canvas),pixel=()=>[...canvas.getContext('2d').getImageData(2,2,1,1).data].slice(0,3);
  c.add({id:'wisp',source:tile('#ff0000'),kind:'character'});c.add({id:'fog',source:tile('#0000ff'),opacity:.5});
  c.render();const startsBlack=pixel();c.reveal();c.render();const mixed=pixel();
  c.update('fog',{visible:false});c.render();const hidden=pixel();
  c.update('fog',{visible:true,opacity:1,blend:'screen'});c.render();const screened=pixel();
  c.update('fog',{blend:'source-over'});c.move('fog',0);c.render();const reordered=pixel();
  c.blackout();c.update('wisp',{opacity:.2});c.render();const blackout=pixel();
  let rejected=false;try{c.update('fog',{opacity:NaN})}catch{rejected=true}
  c.dispose();return{startsBlack,mixed,hidden,screened,reordered,blackout,rejected,disposed:c.disposed,layersAfterDispose:c.layers.length,mediaElements:document.querySelectorAll('audio,video').length};
 },source);
 assert.deepEqual(result.startsBlack,[0,0,0]);assert(Math.abs(result.mixed[0]-127)<=1&&Math.abs(result.mixed[2]-128)<=1);
 assert.deepEqual(result.hidden,[255,0,0]);assert.deepEqual(result.screened,[255,0,255]);assert.deepEqual(result.reordered,[255,0,0]);assert.deepEqual(result.blackout,[0,0,0]);assert(result.rejected&&result.disposed);assert.equal(result.layersAfterDispose,0);assert.equal(result.mediaElements,0);assert.deepEqual(errors,[]);
 console.log('PASS actual Chromium pixels: layer opacity, visibility, screen blend, ordering, latched whole-stage Blackout and disposal; compositor creates no media elements. Synthetic layers, not projected fog acceptance.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
