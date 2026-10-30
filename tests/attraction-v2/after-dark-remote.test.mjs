import test from 'node:test';
import assert from 'node:assert/strict';
import {AfterDarkRemote} from '../../source/attraction-v2/console/after-dark-remote.mjs';

function rig(){
 const state={available:{eyes:true,spider:true,apparitions:true},running:false,loading:false,program:'eyes',nightWatch:{running:false}},calls=[];
 let gate=null,epoch=0;
 const remote=new AfterDarkRemote({inspect:()=>state,
  select:async program=>{const own=epoch;calls.push(['select',program]);if(gate)await gate;if(own!==epoch)return false;state.program=program;state.nightWatch.running=false;return true;},
  start:async()=>{calls.push(['start']);state.running=true;return true;},
  stop:()=>{epoch++;calls.push(['stop']);state.running=false;state.loading=false;state.nightWatch.running=false;},
  nightWatch:async()=>{calls.push(['night']);state.running=state.nightWatch.running=true;return true;}
 });
 return{state,calls,remote,setGate:p=>gate=p};
}
test('advertises only available after-dark cues with bounded silent state',()=>{
 const r=rig();assert.deepEqual(r.remote.remoteState().cues,['Watching-Eyes','Spider-on-Silk','Quiet-Apparitions','Night-Watch']);
 assert.deepEqual(r.remote.remoteState().state,{workspace:'films',loop:'after-dark',blackout:true,status:'After dark is stopped',volume:0});
 r.state.available.spider=false;assert(!r.remote.remoteState().cues.includes('Spider-on-Silk'));
 r.state.available={};assert.deepEqual(r.remote.remoteState().cues,[]);
});
test('starts a selected scene from black, preserves a running scene and supports Night watch',async()=>{
 const r=rig();await r.remote.remoteCommand('cue','Spider-on-Silk');assert.deepEqual(r.calls,[['select','spider'],['start']]);
 await r.remote.remoteCommand('cue','Watching-Eyes');assert.equal(r.calls.filter(c=>c[0]==='start').length,1);
 await r.remote.remoteCommand('cue','Night-Watch');assert(r.state.nightWatch.running);assert.match(r.remote.remoteState().state.status,/Night watch/);
 await r.remote.remoteCommand('cue','Quiet-Apparitions');assert(!r.state.nightWatch.running);assert.equal(r.state.program,'apparitions');
});
test('never accepts speech, volume, capture, unknown or unavailable cues',async()=>{
 const r=rig();r.state.available.spider=false;
 for(const [command,value] of [['perform',{text:'Boo'}],['volume',1],['welcome',null],['cue','Spider-on-Silk'],['cue','Start-Show'],['cue','__proto__'],['blackout','off']])await assert.rejects(r.remote.remoteCommand(command,value));
 assert.deepEqual(r.calls,[]);
});
test('remote Stop cancels a pending scene before it can restart the picture',async()=>{
 const r=rig();let release;r.setGate(new Promise(resolve=>release=resolve));
 const task=r.remote.remoteCommand('cue','Quiet-Apparitions'),rejected=assert.rejects(task,e=>e.cancelled===true);
 await r.remote.remoteCommand('stop',null);release();await rejected;
 assert(!r.state.running);assert(!r.calls.some(c=>c[0]==='start'));
});
test('local takeover or page disposal invalidates an old phone acknowledgement',async()=>{
 for(const action of ['invalidate','dispose']){
  const r=rig();let release;r.setGate(new Promise(resolve=>release=resolve));
  const task=r.remote.remoteCommand('cue','Spider-on-Silk'),rejected=assert.rejects(task,e=>e.cancelled===true);
  r.remote[action]();release();await rejected;assert(!r.calls.some(c=>c[0]==='start'));
  if(action==='dispose')await assert.rejects(r.remote.remoteCommand('cue','Night-Watch'),e=>e.cancelled===true);
 }
});
test('failed preparation cannot be acknowledged as a running scene',async()=>{
 const r=rig();r.remote.start=async()=>false;await assert.rejects(r.remote.remoteCommand('cue','Quiet-Apparitions'),e=>e.cancelled===true);
 assert(!r.state.running);
});

test('recovery is visible to the silent phone and omits the failed scene',()=>{
 const r=rig();r.state.recovering=true;r.state.available.apparitions=false;
 assert.match(r.remote.remoteState().state.status,/dark pause/);
 assert(!r.remote.remoteState().cues.includes('Quiet-Apparitions'));
 assert.equal(r.remote.remoteState().state.volume,0);
});
