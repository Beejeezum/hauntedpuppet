const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const source=fs.readFileSync('assets/wisp-choreography.js','utf8'),{choreographyPose,idleAttention,actionDuration,WISP_CHOREOGRAPHY_ACTIONS}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 let checks=0;
 for(const [kind,duration] of Object.entries(WISP_CHOREOGRAPHY_ACTIONS)){
  assert.equal(actionDuration(kind),duration);assert.deepEqual(choreographyPose(kind,.73),choreographyPose(kind,.73),'Poses must be deterministic');
  for(const at of [-1,NaN,Infinity,duration,duration+10])assert.equal(choreographyPose(kind,at).active,false);
  const first=choreographyPose(kind,0);for(const k of ['dx','dy','rotation','left','right','tail'])assert.equal(first[k],0);assert.equal(first.scaleX,1);assert.equal(first.scaleY,1);
  let maxY=0,maxRotation=0;
  for(let n=0;n<duration*120;n++){
   const p=choreographyPose(kind,n/120,{intensity:1.25});for(const k of ['dx','dy','rotation','scaleX','scaleY','left','right','tail'])assert(Number.isFinite(p[k]),kind+' '+k);
   assert(p.scaleX>=.3&&p.scaleY>=.5);maxY=Math.max(maxY,Math.abs(p.dy));maxRotation=Math.max(maxRotation,Math.abs(p.rotation));
   const reduced=choreographyPose(kind,n/120,{reducedMotion:true});assert(Math.abs(reduced.dx)<26);assert(Math.abs(reduced.dy)<16);assert(Math.abs(reduced.rotation)<.08);checks++;
  }
  assert(maxY>=39,kind+' needs bold vertical staging');if(kind==='twirl')assert(maxRotation>Math.PI*2);
  const final=choreographyPose(kind,duration-.000001);assert(Math.abs(final.dy)<.00001);assert(Math.abs(Math.sin(final.rotation))<.00001);
 }
 const gazes=new Set();for(let n=0;n<60*120;n++){const attention=idleAttention(n/120);gazes.add(attention.gaze);assert.deepEqual(attention,idleAttention(n/120));}assert.deepEqual([...gazes].sort(),['center','down','left','right']);
 for(const unknown of ['invented','constructor','__proto__','toString',null,{},[]]){assert.equal(actionDuration(unknown),0);assert.equal(choreographyPose(unknown,1).active,false);}
 console.log('PASS authored choreography:',Object.keys(WISP_CHOREOGRAPHY_ACTIONS).length,'routines,',checks,'deterministic samples, anticipation/rest endpoints, reduced motion and finite transforms.');
})().catch(e=>{console.error(e);process.exit(1)});
