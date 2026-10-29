const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {planJoin}=require('../source/wisp-performance-reference/ambient-show/transition-plan.mjs');
const {validateResidentDelivery}=require('../source/wisp-performance-reference/ambient-show/resident-contract.mjs');
const residentContract=require('../source/wisp-performance-reference/ambient-show/resident-contract.json');
/** Compile explicit approvals only. Production studies never become runtime clips. */
function compileLibrary(catalog,{root=path.resolve(__dirname,'..'),sourceUrls=false}={}){
 if(!Array.isArray(catalog.clips))throw Error('Missing cue inventory');
 const ids=new Set(),files=[],clips=[],approved=[];
 for(const clip of catalog.clips){
  if(typeof clip.id!=='string'||!/^[a-z0-9][a-z0-9-]{0,63}$/.test(clip.id)||ids.has(clip.id))throw Error('Invalid or duplicate cue ID');ids.add(clip.id);
  if(clip.status!=='approved')continue;
  validateResidentDelivery(clip,residentContract);
  const m=clip.media,evidence=value=>typeof value==='string'&&value.trim().length>0;
  if(typeof clip.title!=='string'||!clip.title.trim()||clip.title.length>120||!['empty','friendly-rest','scary-rest'].includes(clip.entryPort)||!['empty','friendly-rest','scary-rest'].includes(clip.exitPort)||clip.dialogue!==false||!['friendly','scary','transition','atmosphere'].includes(clip.form)||!evidence(m?.reviewEvidence)||!evidence(m?.audioReviewEvidence))throw Error('Incomplete character/audio approval: '+clip.id);
  if(!/^[a-f0-9]{64}$/.test(m.sha256||'')||typeof m.file!=='string'||!m.file.startsWith('source/wisp-performance-reference/')||path.extname(m.file)!=='.mp4')throw Error('Invalid approved media record: '+clip.id);
  const source=path.resolve(root,m.file),sourceRoot=path.resolve(root,'source/wisp-performance-reference')+path.sep;
  if(!source.startsWith(sourceRoot)||!fs.realpathSync(source).startsWith(fs.realpathSync(sourceRoot)+path.sep))throw Error('Media escapes the source library');
  const data=fs.readFileSync(source),sha256=crypto.createHash('sha256').update(data).digest('hex');
  if(sha256!==m.sha256)throw Error('Approved media hash changed: '+clip.id);
  if(m.loop===true&&!evidence(m.loopReviewEvidence))throw Error('Missing exact loop approval: '+clip.id);
  const destination=clip.id+'-'+sha256.slice(0,12)+'.mp4';
  files.push({source:m.file,destination,sha256,data});approved.push(clip);
  clips.push({id:clip.id,title:clip.title,form:clip.form,manualOnly:clip.manualOnly===true,bridgeEligible:clip.bridgeEligible===true||clip.form==='transition',loop:m.loop===true,src:sourceUrls?'/'+m.file:'./'+destination,sha256,entryPort:clip.entryPort,exitPort:clip.exitPort,exitPolicy:'finish'});
 }
 const routes=[];
 for(const from of approved)for(const to of approved){
  try{routes.push(planJoin(from,to,{joins:catalog.reviewedJoins||[],bridges:approved.filter(c=>(c.form==='transition'||c.bridgeEligible)&&!c.manualOnly)}));}
  catch(error){if(!error.message.startsWith('No reviewed transition:'))throw error;}
 }
 for(const clip of clips)if(clip.loop&&!routes.some(r=>r.from===clip.id&&r.to===clip.id&&['empty-stage','reviewed-cut'].includes(r.kind)))throw Error('No approved native loop boundary: '+clip.id);
 return{runtime:{schema:1,clips,routes},files};
}
module.exports={compileLibrary};
