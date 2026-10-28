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
export function planJoin(from, to, {joins = [], bridges = []} = {}) {
  if (!ready(from) || !ready(to)) throw Error('Unreviewed or missing silent film');
  // Empty-frame review is tied to the exact media hash through its approved record.
  if (from.exitPort === 'empty' && to.entryPort === 'empty' &&
      emptySeconds(from.media, 'emptyEndFrames') >= .5 &&
      emptySeconds(to.media, 'emptyStartFrames') >= .5 && silentTail(from.media)) {
    return {kind: 'empty-stage', from: from.id, to: to.id, minimumBlackMs: 500};
  }
  if (reviewed(from, to, joins)) return {kind: 'reviewed-cut', from: from.id, to: to.id};
  const bridge = bridges.find(b => ready(b) && reviewed(from, b, joins) && reviewed(b, to, joins));
  if (bridge) return {kind: 'authored-bridge', from: from.id, bridge: bridge.id, to: to.id};
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
    joins: catalog.reviewedJoins, bridges: catalog.clips.filter(c => c.form === 'transition' && !c.manualOnly)
  }));
  return {id: show.id, clips: clips.map(c => c.id), transitions};
}
