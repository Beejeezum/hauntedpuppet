const assert=require('node:assert/strict');
(async()=>{
 const {validatePlaylist,PlaylistRunner}=await import('../source/wisp-performance-reference/ambient-show/saved-playlists.mjs');
 const available=['cute','scary'],p={name:'Doorstep',steps:[{cue:'cute',seconds:10},{cue:'scary',seconds:5},{cue:'scary',seconds:8}]};
 assert.throws(()=>validatePlaylist({...p,steps:[{cue:'unmade',seconds:10}]},available));
 for(const seconds of [0,301,NaN,8.5])assert.throws(()=>validatePlaylist({...p,steps:[{cue:'cute',seconds}]},available));
 const r=new PlaylistRunner();assert.equal(r.start(p,available),'cute');assert.equal(r.due(999999),false,'Preparation must not consume hold time');
 r.observe('scary',0);assert.equal(r.inspect().since,null);r.observe('cute',100);assert.equal(r.due(10099),false);assert.equal(r.due(10100),true);
 assert.equal(r.advance(),'scary');r.observe('scary',11000);assert.equal(r.due(16000),true);assert.equal(r.advance(),'scary');assert.equal(r.inspect().since,null,'Consecutive same-form steps get independent holds');
 r.observe('scary',17000);assert.equal(r.due(25000),true);assert.equal(r.advance(),'cute');r.stop();assert.equal(r.current(),null);assert.equal(r.due(999999),false);
 p.steps[0].seconds=200;assert.equal(validatePlaylist({name:'  Show  ',steps:[{cue:'cute',seconds:5}]},available).name,'Show');
 console.log('PASS playlist validation, unavailable asset rejection, preparation timing, repeated forms, wraparound and stop.');
})().catch(e=>{console.error(e);process.exitCode=1;});
