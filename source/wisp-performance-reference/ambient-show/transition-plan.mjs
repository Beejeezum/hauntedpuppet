/** Offline editorial gate. Matching labels alone never authorize a visible cut. */
function ready(clip) {
  const m = clip?.media;
  return clip?.status === 'approved' && clip.dialogue === false &&
    m?.file && /^[a-f0-9]{64}$/.test(m.sha256 || '') && m.reviewEvidence;
}
function reviewed(from, to, joins) {
  return from.exitPort === to.entryPort && joins.some(j =>
    j.status === 'approved' && j.from === from.id && j.to === to.id &&
    j.fromSha256 === from.media.sha256 && j.toSha256 === to.media.sha256 &&
    j.reviewEvidence);
}
function emptySeconds(media, field) {
  const {fps, frameCount} = media, frames = media[field];
  if (!Number.isFinite(fps) || fps <= 0 || fps > 240 ||
      !Number.isInteger(frameCount) || frameCount < 1 ||
      !Number.isInteger(frames) || frames < 0 || frames > frameCount) return 0;
  return frames / fps;
}
function silentTail(media) {
  const seconds = media.audioTailSilenceSeconds;
  return Number.isFinite(seconds) && seconds >= .5 && seconds <= media.frameCount / media.fps;
}
function directJoin(from,to,joins){
 if(from.exitPort==='empty'&&to.entryPort==='empty'&&emptySeconds(from.media,'emptyEndFrames')>=.5&&emptySeconds(to.media,'emptyStartFrames')>=.5&&silentTail(from.media))return{kind:'empty-stage',from:from.id,to:to.id,minimumBlackMs:500};
 if(reviewed(from,to,joins))return{kind:'reviewed-cut',from:from.id,to:to.id};
 return null;
}
const portForm=port=>port?.startsWith('friendly-')?'friendly':port?.startsWith('scary-')?'scary':null;
function characterForms(clip){return new Set([clip.form==='friendly'||clip.form==='scary'?clip.form:null,portForm(clip.entryPort),portForm(clip.exitPort)].filter(Boolean));}
export function planJoin(from,to,{joins=[],bridges=[]}={}){
 if(!ready(from)||!ready(to))throw Error('Unreviewed or missing silent film');
 const direct=directJoin(from,to,joins);if(direct)return direct;
 // A same-form request may disappear/reappear, but may not smuggle the other
 // character into its bridge. An explicit cross-form request permits both.
 const allowed=new Set([portForm(from.exitPort),...characterForms(to)].filter(Boolean));
 const candidates=bridges.filter(b=>ready(b)&&!b.manualOnly&&[...characterForms(b)].every(form=>allowed.has(form)));
 const queue=[{clip:from,path:[]}],visited=new Set([from.id]);
 for(let i=0;i<queue.length;i++){
  const current=queue[i];
  if(current.path.length&&directJoin(current.clip,to,joins))return{kind:'authored-bridge',from:from.id,to:to.id,bridge:current.path[0],sequence:current.path};
  for(const bridge of candidates){if(visited.has(bridge.id)||bridge.id===to.id||!directJoin(current.clip,bridge,joins))continue;visited.add(bridge.id);queue.push({clip:bridge,path:[...current.path,bridge.id]});}
 }
 throw Error(`No reviewed transition: ${from.id} → ${to.id}`);
}
export function planShow(catalog, showId) {
  const show = catalog.shows.find(s => s.id === showId);
  if (!show || !show.clipIds.length) throw Error('Unknown or empty show');
  const clips = show.clipIds.map(id => {
    const clip = catalog.clips.find(c => c.id === id);
    if (!ready(clip) || clip.manualOnly) throw Error(`Unavailable ambient film: ${id}`);
    return clip;
  });
  const transitions = clips.map((clip, i) => planJoin(clip, clips[(i + 1) % clips.length], {
    joins: catalog.reviewedJoins, bridges: catalog.clips.filter(c => (c.form === 'transition'||c.bridgeEligible) && !c.manualOnly)
  }));
  return {id: show.id, clips: clips.map(c => c.id), transitions};
}
