const assert=require('node:assert/strict');
(async()=>{
 const {ResidentActionPlayer}=await import('../source/wisp-performance-reference/ambient-show/resident-action-player.mjs');
 const video={currentTime:0,pause(){}};
 const idle={id:'test-idle',url:'/fixture.mp4',frames:122,fps:24,status:'approved',entryPort:'friendly-rest',exitPort:'friendly-rest',sha256:'a'.repeat(64),residentReviewEvidence:'SYNTHETIC test only',loopReviewEvidence:'SYNTHETIC test only'};
 const action={...idle,id:'test-action',sha256:'b'.repeat(64)};
 const join=(a,b)=>({from:a.id,to:b.id,fromSha256:a.sha256,toSha256:b.sha256,status:'approved',reviewEvidence:'SYNTHETIC exact-media fixture'});
 const joins=[join(idle,idle),join(idle,action),join(action,idle)];
 assert.throws(()=>new ResidentActionPlayer(video,{idle,actions:[action]}),/exact-media/);
 assert.throws(()=>new ResidentActionPlayer(video,{idle,actions:[action],joins:joins.slice(0,2)}),/exact-media/,'Return join is mandatory');
 assert.throws(()=>new ResidentActionPlayer(video,{idle,actions:[{...action,sha256:'c'.repeat(64)}],joins}),/exact-media/,'Changed media invalidates old cuts');
 assert.throws(()=>new ResidentActionPlayer(video,{idle,actions:[{...action,status:'revision-required'}],joins,allowStudy:true}),/Unapproved/,'Study mode never accepts explicit rejected acting');
 const player=new ResidentActionPlayer(video,{idle,actions:[action],joins});player.dispose();assert(player.inspect().disposed);
 console.log('PASS resident admission needs reviewed idle loop and both hash-linked action cuts; changed/rejected media cannot bypass the gate. Synthetic approval records only.');
})().catch(error=>{console.error(error);process.exitCode=1;});
