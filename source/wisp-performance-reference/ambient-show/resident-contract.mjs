/** Delivery gate only. Labels never create the missing native animation or joins. */
export function validateResidentDelivery(clip,contract){
 const rule=contract.rules.find(r=>r.id===clip.id);if(!rule)return;
 if(clip.entryPort!==rule.entry||clip.exitPort!==rule.exit)throw Error('Resident performance needs authored idle ports: '+clip.id);
 const media=clip.media;
 if(typeof media?.residentReviewEvidence!=='string'||!media.residentReviewEvidence.trim())throw Error('Missing resident performance review: '+clip.id);
 if(rule.kind==='idle'&&(media.loop!==true||!media.loopReviewEvidence))throw Error('Resident idle needs its reviewed living loop: '+clip.id);
 if(rule.kind==='action'&&media.loop===true)throw Error('Resident action must play once and return: '+clip.id);
}

/** Intended sequence of semantic states. Playback must still resolve exact-media
 * reviewed joins at safe boundaries; these IDs are not authority to cut footage.
 */
export function residentIntent({form,targetForm=form,action=null},contract){
 if(!['friendly','scary'].includes(form)||!['friendly','scary'].includes(targetForm))throw Error('Choose a character form');
 const idle=targetForm==='friendly'?'friendly-drift':'scary-drift',sequence=[];
 if(form!==targetForm)sequence.push(targetForm==='scary'?'cute-to-evil':'evil-to-cute',idle);
 if(action){const rule=contract.rules.find(r=>r.id===action);if(!rule||rule.kind!=='action'||rule.entry!==targetForm+'-rest')throw Error('Choose an action for the selected character');sequence.push(action,idle);}
 else if(!sequence.length)sequence.push(idle);
 return sequence;
}
