// Audition feedback and live casting are separate. Only an explicit operator choice
// installs a tested built-in voice; Runway preset names are not portable voice IDs.
export const CAST_KEY = 'wisp-yard-live-cast-v1';
export const liveCandidates = Object.freeze({
  'friendly-c': Object.freeze({form:'friendly', name:'Bright, bashful spirit', voice:'marin', mood:'amused', intensity:.65, speed:1,
    instructions:'Play an original tiny friendly ghost talking to one visitor in a front yard. Light, youthful, warm and a little husky. Think each thought as you say it: delighted curiosity, sheepish comic pride, then a conspiratorial smile. Vary rhythm with the meaning. Small breathy laughs only when the line invites them. Natural conversational phrasing and crisp consonants, never announcer delivery or a permanently high squeak. Dry intimate character acting, no singing, echo, music or extra words. Speak exactly the supplied line. Do not imitate a known actor or character.'}),
  'evil-c': Object.freeze({form:'scary', name:'Dark, amused spirit', voice:'cedar', mood:'sinister', intensity:.8, speed:1,
    instructions:'Play the sinister form of an original ghost, speaking to one visitor in a front yard. Dark chest resonance, textured living breath and an audible sly smile beneath the menace. Quiet invitation, a short anticipatory pause, a controlled rough creature rumble when the meaning calls for it, then amused release. Change emotional intention across the line; never flat deep narration. Clear consonants, measured but conversational pacing. No screaming, singing, echo, music, extra words or imitation of a known actor or character. Dry intimate acting. Speak exactly the supplied line.'}),
});
export function validateCast(value) {
  const choices = {};
  for (const form of ['friendly','scary']) {
    const id = value?.[form];
    if (typeof id === 'string' && Object.hasOwn(liveCandidates,id) && liveCandidates[id].form === form) choices[form] = id;
  }
  return choices;
}
export function readCast(storage) {
  try { return validateCast(JSON.parse((storage || globalThis.localStorage).getItem(CAST_KEY))); } catch { return {}; }
}
export function chooseCast(id, storage = globalThis.localStorage) {
  if (!Object.hasOwn(liveCandidates,id)) throw Error('This audition is not connected to typed speech yet.');
  const choices = {...readCast(storage), [liveCandidates[id].form]:id};
  storage.setItem(CAST_KEY, JSON.stringify(choices));
  return choices;
}
export function castLabel(form, choices = readCast()) {
  return liveCandidates[validateCast(choices)[form]]?.name || 'Choose a voice';
}
