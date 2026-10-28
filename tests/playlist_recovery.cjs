const assert=require('node:assert/strict'),pw=require('playwright');
process.env.HAUNT_TONIGHT_ROOT='dist';
(async()=>{const fixture=await require('./tonight_fixture.cjs').start(),browser=await pw.chromium.launch({args:['--mute-audio']});try{
 const page=await browser.newPage();await page.goto(fixture.base+'/assets/wisp-showdesk/director.html');
 const result=await page.evaluate(async()=>{
  const {mountPlaylists}=await import('/assets/wisp-showdesk/saved-playlists.mjs');
  const key='hauntedpuppet-film-playlists-v1',missing={name:'Unavailable arrival',steps:[{cue:'arrival',seconds:10}]};
  localStorage.setItem(key,JSON.stringify([{name:'Ready show',steps:[{cue:'cute',seconds:10}]},missing]));
  const host=document.createElement('div');document.body.append(host);let runs=0;
  const ui=mountPlaylists(host,{clips:[{id:'cute',title:'Friendly'}],onRun:()=>runs++});
  const recovered=ui.querySelector('[data-saved]').options.length===1&&ui.querySelector('[data-name]').value==='Ready show';
  const warning=ui.querySelector('[data-message]').textContent.includes('remain saved');
  ui.querySelector('[data-name]').value='Edited show';ui.querySelector('[data-save]').click();
  const afterSave=JSON.parse(localStorage.getItem(key));ui.querySelector('[data-run]').click();ui.querySelector('[data-delete]').click();
  const afterDelete=JSON.parse(localStorage.getItem(key));
  return{recovered,warning,runs,preservedSave:afterSave.some(p=>p.name===missing.name),preservedDelete:afterDelete.some(p=>p.name===missing.name),deleted:!afterDelete.some(p=>p.name==='Edited show')};
 });assert.deepEqual(result,{recovered:true,warning:true,runs:1,preservedSave:true,preservedDelete:true,deleted:true});
 console.log('PASS saved playlist recovery, clear warning, editable valid shows and unavailable-record preservation through save/delete (browser storage).');
 }finally{await browser.close();await fixture.close()}})().catch(e=>{console.error(e);process.exitCode=1});
