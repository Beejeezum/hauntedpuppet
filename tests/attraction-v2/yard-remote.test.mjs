import test from 'node:test';
import assert from 'node:assert/strict';
import {YardRemote} from '../../source/attraction-v2/console/yard-remote.mjs';

function rig(){
 let tone='gentle',mode='host',current='friendly',startGate=null,startEpoch=0;const calls=[],pending=[];
 const player={running:true,inspect:()=>({running:player.running,mode,current,form:current,next:[]}),request:id=>calls.push(['moment',id])};
 const speech={configured:true,castReady:{friendly:true,scary:true},context:{state:'running'},inspect:()=>({configured:speech.configured,castReady:speech.castReady,active:false,phase:'idle'}),enqueue:(text,form,lettering,settled)=>{calls.push(['speech',text,form,lettering]);pending.push(settled);},stop:()=>{while(pending.length)pending.shift()(Object.assign(Error('Cancelled'),{cancelled:true}));}};
 const scene={motion:{request:action=>calls.push(['motion',action])},lettering:{show:text=>calls.push(['lettering',text])}};
 let remote;remote=new YardRemote({player,scene,speech,getTone:()=>tone,setTone:value=>{if(value===tone)return;remote.invalidate();speech.stop();tone=value;current=value==='haunted'?'scary':'friendly';},setMode:value=>{mode=value;},start:async()=>{const own=startEpoch;if(startGate)await startGate;if(own!==startEpoch)return false;player.running=true;return true;},stop:()=>{startEpoch++;player.running=false;remote.invalidate();speech.stop();},action:action=>calls.push(['action',action])});
 return{remote,player,speech,calls,pending,setStart:promise=>startGate=promise,setCurrent:id=>current=id};
}
test('yard remote accepts only advertised controls and strips private text from state',async()=>{
 const r=rig();await r.remote.remoteCommand('cue','Evil-Wisp');assert.equal(r.remote.remoteState().state.form,'scary');assert(!r.remote.remoteState().cues.includes('Wave-Hello'));
 await r.remote.remoteCommand('cue','Loom-Closer');assert.deepEqual(r.calls,[['action','near']]);
 for(const [command,value] of [['shell','anything'],['cue','friendly-stay'],['cue','unknown'],['blackout','off']])await assert.rejects(r.remote.remoteCommand(command,value));
 assert.equal(r.remote.remoteState().state.workspace,'yard');assert(!JSON.stringify(r.remote.remoteState()).includes('token'));
});
test('speech acknowledgement waits for actual completion, character changes cancel prior line',async()=>{
 const r=rig();let done=false;const first=r.remote.remoteCommand('perform',{text:'Boo!',mode:'exact',character:'friendly',animation:'friendly-wave'}).then(()=>done=true);
 await Promise.resolve();assert(!done);assert.deepEqual(r.calls.slice(0,2),[['moment','welcome'],['speech','Boo!','friendly',true]]);
 r.pending.shift()(null);await first;assert(done);
 const second=r.remote.remoteCommand('perform',{text:'Hello!',mode:'exact',character:'friendly',animation:'friendly-stay'});const rejection=assert.rejects(second,e=>e.cancelled===true);
 await r.remote.remoteCommand('cue','Evil-Wisp');await rejection;
});
test('silent lettering never synthesizes and Stop cancels its pending acknowledgement',async()=>{
 const r=rig();r.speech.configured=false;r.speech.context.state='suspended';
 const task=r.remote.remoteCommand('perform',{text:'Happy Halloween',mode:'lettering',character:'friendly',animation:'friendly-stay'});const stopped=assert.rejects(task,e=>e.cancelled===true);
 await new Promise(resolve=>setTimeout(resolve,0));assert(r.calls.some(c=>c[0]==='lettering'));assert(!r.calls.some(c=>c[0]==='speech'));
 await assert.rejects(r.remote.remoteCommand('perform',{text:'Do not cover the active line',mode:'lettering',character:'friendly',animation:'friendly-stay'}),/current line finish/);
 await r.remote.remoteCommand('stop',null);await stopped;assert(!r.remote.remoteState().state.speechReady);
});
test('wrong-form, long, prompt-mode and extra-field performances fail before synthesis',async()=>{
 const r=rig(),base={text:'Boo',mode:'exact',character:'friendly',animation:'friendly-stay'};
 for(const value of [{...base,text:'x'.repeat(241)},{...base,mode:'prompt'},{...base,animation:'scary-stay'},{...base,provider:'other'},{...base,character:'__proto__'}])await assert.rejects(r.remote.remoteCommand('perform',value));
 assert.equal(r.calls.length,0);r.speech.context.state='suspended';await assert.rejects(r.remote.remoteCommand('perform',base),/Enable character speech/);
});
test('Stop invalidates pending character waits and late starts',async()=>{
 const r=rig();r.setCurrent('to-cute');const wait=r.remote.remoteCommand('perform',{text:'Hello',mode:'lettering',character:'friendly',animation:'friendly-stay'});const rejected=assert.rejects(wait,e=>e.cancelled===true);await r.remote.remoteCommand('stop',null);await rejected;
 let release;r.setStart(new Promise(resolve=>release=resolve));const start=r.remote.remoteCommand('cue','Start-Show');const late=assert.rejects(start,e=>e.cancelled===true);await r.remote.remoteCommand('stop',null);release();await late;assert(!r.player.running);r.remote.dispose();await assert.rejects(r.remote.remoteCommand('cue','Start-Show'),e=>e.cancelled===true);
});

test('phone cannot spend on an unselected character voice, while silent controls remain ready', async()=>{
 const r=rig();r.speech.castReady={friendly:false,scary:false};
 assert.equal(r.remote.remoteState().state.speechReady,false);
 await assert.rejects(r.remote.remoteCommand('perform',{text:'Boo',character:'friendly',mode:'exact',animation:'friendly-stay'}),/Choose this character voice/);
 assert.equal(r.calls.length,0);
});
