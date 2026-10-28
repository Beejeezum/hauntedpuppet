const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const root=path.join(__dirname,'../source/wisp-performance-reference/ambient-show');
 const {planJoin,planShow}=await import(require('node:url').pathToFileURL(path.join(root,'transition-plan.mjs')));
 const catalog=JSON.parse(fs.readFileSync(path.join(root,'catalog.json'),'utf8'));
 assert.equal(catalog.clips.length,16);assert.equal(new Set(catalog.clips.map(c=>c.id)).size,16);
 assert.equal(catalog.deferredClips.length,16);assert(catalog.deferredClips.every(c=>!catalog.clips.some(a=>a.id===c.id)));
 for(const show of catalog.shows)assert(show.clipIds.every(id=>catalog.clips.some(c=>c.id===id&&!c.manualOnly)),'Active show references only active non-manual cues');
 assert(catalog.clips.every(c=>c.dialogue===false&&(c.status==='planned'?c.media===null:c.status==='approved'&&c.media?.file&&/^[a-f0-9]{64}$/.test(c.media.sha256))));
 if(catalog.shows[0].clipIds.some(id=>catalog.clips.find(c=>c.id===id)?.status!=='approved'))assert.throws(()=>planShow(catalog,catalog.shows[0].id),/Unavailable/);
 for(const study of catalog.productionStudies.filter(s=>s.evidence)){
  const mediaPath=path.resolve(root,study.media),evidence=JSON.parse(fs.readFileSync(path.resolve(root,study.evidence),'utf8'));
  assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(mediaPath)).digest('hex'),study.sha256,'Candidate bytes must match the tracked record');
  assert.equal(evidence.sha256,study.sha256);assert.equal(study.status,'human-review-pending');
  assert.equal(evidence.humanReview,'pending');assert(evidence.emptyStartFrames/evidence.fps>=.5&&evidence.emptyEndFrames/evidence.fps>=.5);
  assert(evidence.audioTailSilenceSeconds>=.5);assert.equal(evidence.audio.lastHalfSecondPeak,0);
  assert(catalog.clips.some(c=>c.id===study.plannedClipIds[0]),'Candidate evidence must reference an active inventory slot');
 }

 const film=(id,entry='rest',exit='rest')=>({id,status:'approved',dialogue:false,entryPort:entry,exitPort:exit,media:{file:id+'.mp4',sha256:id.repeat(64).slice(0,64),reviewEvidence:'synthetic test only'}});
 const a=film('a'),b=film('b'),c=film('c');
 const join=(x,y)=>({status:'approved',from:x.id,to:y.id,fromSha256:x.media.sha256,toSha256:y.media.sha256,reviewEvidence:'synthetic join review'});
 assert.throws(()=>planJoin(a,b),/No reviewed/,'Same port label must not permit an unreviewed cut');
 assert.equal(planJoin(a,b,{joins:[join(a,b)]}).kind,'reviewed-cut');
 const changed={...b,media:{...b.media,sha256:'d'.repeat(64)}};
 assert.throws(()=>planJoin(a,changed,{joins:[join(a,b)]}),/No reviewed/,'Regenerated media must invalidate old join review');
 assert.equal(planJoin(a,b,{joins:[join(a,c),join(c,b)],bridges:[c]}).bridge,'c');
 const out=film('a','rest','empty'),inside=film('b','empty','rest');
 assert.throws(()=>planJoin(out,inside),/No reviewed/);
 Object.assign(out.media,{fps:24,frameCount:240,emptyEndFrames:8,audioTailSilenceSeconds:.5});
 Object.assign(inside.media,{fps:24,frameCount:240,emptyStartFrames:8});
 assert.throws(()=>planJoin(out,inside),/No reviewed/,'Eight frames at 24fps do not provide half a second');
 out.media.emptyEndFrames=12;inside.media.emptyStartFrames=12;
 for(const [key,value] of [['fps',30],['fps',NaN],['frameCount',4],['emptyEndFrames',12.5],['audioTailSilenceSeconds',0],['audioTailSilenceSeconds',Infinity],['audioTailSilenceSeconds',20]]){
  const invalid={...out,media:{...out.media,[key]:value}};
  assert.throws(()=>planJoin(invalid,inside),/No reviewed/,'Reject insufficient or invalid endpoint evidence: '+key);
 }
 assert.throws(()=>planJoin(out,{...inside,media:{...inside.media,fps:30}}),/No reviewed/,'Incoming buffer is also measured in seconds');
 assert.throws(()=>planJoin(out,{...inside,media:{...inside.media,emptyStartFrames:undefined}}),/No reviewed/,'Missing incoming black evidence is not accepted');
 assert.equal(planJoin(out,inside).kind,'empty-stage');
 const tiny={clips:[a,b],reviewedJoins:[join(a,b)],shows:[{id:'loop',clipIds:['a','b']}]};
 assert.throws(()=>planShow(tiny,'loop'),/No reviewed/,'Loop closing boundary is mandatory');
 tiny.reviewedJoins.push(join(b,a));assert.equal(planShow(tiny,'loop').transitions.length,2);
 c.form='transition';c.manualOnly=true;
 const bridged={clips:[a,b,c],reviewedJoins:[join(a,c),join(c,b),join(b,a)],shows:[{id:'loop',clipIds:['a','b']}]};
 assert.throws(()=>planShow(bridged,'loop'),/No reviewed/,'A manual-only scare must not enter an automatic show as a hidden bridge');
 c.manualOnly=false;assert.equal(planShow(bridged,'loop').transitions[0].bridge,'c');
 b.manualOnly=true;assert.throws(()=>planShow(tiny,'loop'),/Unavailable/,'Manual scares cannot enter ambient playlist');
 b.manualOnly=false;b.dialogue=true;assert.throws(()=>planJoin(a,b),/Unreviewed/,'Ambient films cannot include speech');
 const friendly=Object.assign(film('a','friendly-rest','friendly-rest'),{form:'friendly'}),depart=Object.assign(film('b','friendly-rest','empty'),{form:'friendly',bridgeEligible:true}),arrival=Object.assign(film('c','empty','scary-rest'),{form:'transition'}),haunt=Object.assign(film('d','scary-rest','scary-rest'),{form:'scary'});
 for(const c of [depart,arrival])Object.assign(c.media,{fps:24,frameCount:240,emptyEndFrames:12,emptyStartFrames:12,audioTailSilenceSeconds:.5});
 const chained=planJoin(friendly,haunt,{joins:[join(friendly,depart),join(arrival,haunt)],bridges:[depart,arrival]});assert.deepEqual(chained.sequence,['b','c'],'Reviewed departure, black port and arrival may form a two-film bridge');
 arrival.manualOnly=true;assert.throws(()=>planJoin(friendly,haunt,{joins:[join(friendly,depart),join(arrival,haunt)],bridges:[depart,arrival]}),/No reviewed/);arrival.manualOnly=false;
 const friendlyEnd=Object.assign(film('d','friendly-rest','friendly-rest'),{form:'friendly'}),outMorph=Object.assign(film('e','friendly-rest','scary-rest'),{form:'transition'}),back=Object.assign(film('f','scary-rest','friendly-rest'),{form:'transition'});
 assert.throws(()=>planJoin(friendly,friendlyEnd,{joins:[join(friendly,outMorph),join(outMorph,back),join(back,friendlyEnd)],bridges:[outMorph,back]}),/No reviewed/,'Friendly-to-friendly routing cannot introduce a hidden scary excursion');
 console.log('PASS: 16 active silent cue slots; exact-media join reviews, authored bridges, verified empty-stage boundaries, closing seam, no automatic scare or dialogue. Planner scenarios use synthetic approvals; candidate hashes/evidence checked against real tracked files. No new human approval or media decode claimed here.');
})().catch(e=>{console.error(e);process.exitCode=1;});
