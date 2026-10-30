import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {ShowDirector} from '../../source/attraction-v2/show-director.mjs';

const contract = JSON.parse(fs.readFileSync(new URL('../../source/wisp-performance-reference/ambient-show/resident-contract.json', import.meta.url)));
function fixture(overrides = {}) {
  const cues = contract.rules.map(rule => ({id: rule.id, status: 'simulation', entryPort: rule.entry, exitPort: rule.exit,
    seconds: rule.kind === 'idle' ? 8 : 5, intensity: rule.id === 'scary-reach' ? 2 : rule.entry.startsWith('scary') || rule.exit.startsWith('scary') ? 1 : 0,
    manualOnly: rule.id === 'scary-reach', cooldownMs: rule.id === 'scary-reach' ? 120000 : 45000,
    media: {sha256: createHash('sha256').update(rule.id).digest('hex')}}));
  const joins = cues.flatMap(from => cues.filter(to => from.exitPort === to.entryPort).map(to => ({from: from.id, to: to.id,
    fromSha256: from.media.sha256, toSha256: to.media.sha256, status: 'simulation', reviewEvidence: 'SYNTHETIC protocol fixture, no art approval'})));
  return {cues, joins, contract, simulation: true, ...overrides};
}
function harness(profile = 'gentle', opts = {}) {
  const director = new ShowDirector(fixture(opts)); let now = 0, sequence = 0;
  director.start({profile, now});
  const command = (type, extra = {}) => director.command({id: 'cmd-' + (++sequence), sequence, type, ...extra}, now);
  const step = () => { const item = director.next(now); assert(item && !item.fault, item?.fault); now += item.seconds * 1000; assert(director.complete(item.token, now)); return item.id; };
  return {director, command, step, get now() {return now;}, advance(ms) {now += ms;}};
}

test('unreviewed real inventory cannot start as production media', () => {
  assert.throws(() => new ShowDirector(fixture({simulation: false})), /Unapproved film/);
});
test('startup uses authored arrival; repeated pulls cannot dispatch twice', () => {
  const h = harness(), a = h.director.next(0); assert.equal(a.id, 'friendly-reform');
  assert.equal(h.director.next(10), null); assert.equal(h.director.complete('old-token', 11), false);
  assert(h.director.complete(a.token, 5000)); assert.equal(h.director.next(5000).id, 'friendly-drift');
});
test('latest operator request wins before dispatch, never cuts the active film', () => {
  const h = harness(); h.step(); h.step(); const active = h.director.next(h.now);
  h.command('claim'); h.command('moment', {cues: ['friendly-wave']}); h.command('moment', {cues: ['friendly-boo-fail']});
  assert.equal(h.director.next(h.now), null); h.advance(active.seconds * 1000); h.director.complete(active.token, h.now);
  assert.equal(h.step(), 'friendly-boo-fail'); assert.equal(h.step(), 'friendly-drift');
});
test('form switch takes a reviewed morph and returns to the other living idle', () => {
  const h = harness('mischief'); h.step(); h.step(); h.command('claim'); h.command('moment', {cues: ['scary-pace']});
  assert.deepEqual([h.step(), h.step(), h.step()], ['cute-to-evil', 'scary-pace', 'scary-drift']);
});
test('ordinary actions cannot route through departure to conceal a missing join', () => {
  const f = fixture(); f.joins = f.joins.filter(j => j.to !== 'friendly-wave' || j.from === 'friendly-reform');
  const h = harness('gentle', f); h.step(); h.step(); h.command('claim');
  assert.throws(() => h.command('moment', {cues: ['friendly-wave']}), /No reviewed route/);
  assert.equal(h.director.inspect().status, 'running'); assert.equal(h.step(), 'friendly-drift');
});
test('an explicit finale may depart, use empty-stage scenes and return through arrival', () => {
  const h = harness(); h.step(); h.step(); h.command('claim'); h.command('moment', {cues: ['fog-lettering', 'bats-through-letters']});
  assert.deepEqual(Array.from({length: 5}, () => h.step()), ['friendly-depart', 'fog-lettering', 'bats-through-letters', 'friendly-reform', 'friendly-drift']);
});
test('phone loss completes committed moment then unattended show resumes', () => {
  const h = harness('mischief', {operatorLeaseMs: 5000}); h.step(); h.step(); h.command('claim'); h.command('moment', {cues: ['scary-pace']});
  assert.equal(h.step(), 'cute-to-evil'); assert.equal(h.director.inspect().mode, 'auto');
  assert.deepEqual([h.step(), h.step()], ['scary-pace', 'scary-drift']);
});
test('phone loss drops an uncommitted moment and does not replay it on rejoin', () => {
  const h = harness('gentle', {operatorLeaseMs: 5000}); h.step(); h.step(); h.command('claim'); h.command('moment', {cues: ['friendly-wave']});
  h.advance(6000); assert.equal(h.step(), 'friendly-drift'); assert.equal(h.director.inspect().mode, 'auto');
  h.command('claim'); assert.deepEqual(h.director.inspect().next, []);
});
test('peak scares require deliberate operator command and have a cooldown', () => {
  const h = harness('mischief'); h.step(); h.step(); h.command('claim');
  assert.throws(() => h.command('moment', {cues: ['scary-reach']}), /exceeds/);
  h.command('moment', {cues: ['scary-reach'], peak: true}); h.step();
  assert.throws(() => h.command('moment', {cues: ['scary-reach'], peak: true}), /committed/);
  h.step(); h.command('claim'); assert.throws(() => h.command('moment', {cues: ['scary-reach'], peak: true}), /cooling/);
});
test('switching to gentle finishes current film then recovers through cute morph', () => {
  const h = harness('haunted'); h.step(); h.step(); const active = h.director.next(h.now);
  h.command('profile', {profile: 'gentle'}); h.advance(active.seconds * 1000); h.director.complete(active.token, h.now);
  assert.deepEqual([h.step(), h.step()], ['evil-to-cute', 'friendly-drift']);
});
test('blackout is latched, invalidates late completion and requires explicit restart', () => {
  const h = harness(); const current = h.director.next(h.now); const result = h.command('blackout');
  assert.equal(result.effect, 'stop-output-now'); assert.equal(h.director.next(h.now), null);
  assert.equal(h.director.complete(current.token, h.now), false);
  h.director.start({now: h.now}); assert.notEqual(h.director.next(h.now).token, current.token);
});
test('duplicate and old evicted commands never cause a second action', () => {
  const h = harness(); const command = {id: 'first', sequence: 1, type: 'claim'};
  assert.deepEqual(h.director.command(command, 0), h.director.command(command, 0));
  for (let sequence = 2; sequence < 300; sequence++) h.director.command({id: 'keep-' + sequence, sequence, type: 'heartbeat'}, sequence);
  assert.throws(() => h.director.command(command, 300), /Stale/);
  assert(h.director.commands.size <= 256);
});
test('playlist preserves chosen order, respects tone and does not accept peak scares', () => {
  const h = harness(); h.command('playlist', {cues: ['friendly-wave', 'friendly-boo-fail']});
  assert.throws(() => h.command('playlist', {cues: ['scary-reach']}), /Unavailable/);
  const actions = []; for (let i = 0; i < 50; i++) {const id = h.step(); if (['friendly-wave', 'friendly-boo-fail'].includes(id)) actions.push(id);}
  assert(actions.length > 3); assert(actions.every((id, i) => id === ['friendly-wave', 'friendly-boo-fail'][i % 2]));
});
test('hash change invalidates a formerly matching join', () => {
  const f = fixture(); f.cues.find(c => c.id === 'friendly-wave').media.sha256 = 'a'.repeat(64);
  const h = harness('gentle', f); h.step(); h.step(); h.command('claim');
  assert.throws(() => h.command('moment', {cues: ['friendly-wave']}), /No reviewed route/);
});
test('three simulated hours per profile vary actions, bound history and never peak-scare', () => {
  for (const profile of ['gentle', 'mischief', 'haunted']) {
    const h = harness(profile); const seen = new Set(); let actions = 0;
    while (h.now < 3 * 3600000) {
      const id = h.step(); seen.add(id); if (h.director.cues.get(id).kind === 'action') actions++;
      assert.notEqual(id, 'scary-reach'); if (profile === 'gentle') assert(!id.startsWith('scary') && id !== 'cute-to-evil');
    }
    assert(actions > 20, profile + ' should continue varying actions after first few choices');
    if (profile !== 'gentle') assert(seen.has('cute-to-evil') && seen.has('evil-to-cute'));
    assert(h.director.history.length <= 128 && h.director.recent.length <= 8);
  }
});
test('simulation model never claims physical playback or makes network calls', () => {
  const h = harness(); assert.equal(h.director.next(0).simulation, true);
  assert.throws(() => h.director.next(-1), /monotonically/);
});
test('saved program round-trips profile, pacing and ordered repeated selections', () => {
  const h = harness('mischief'); h.command('pacing', {pacing: 'relaxed'});
  h.command('playlist', {cues: ['friendly-wave', 'scary-pace', 'friendly-wave']});
  const saved = JSON.parse(JSON.stringify(h.director.exportSettings()));
  const restored = new ShowDirector(fixture()); assert.deepEqual(restored.restoreSettings(saved), saved);
  assert.equal(restored.inspect().status, 'stopped'); restored.start(); assert.equal(restored.inspect().profile, 'mischief');
  assert.throws(() => restored.restoreSettings(saved), /Stop/);
});
test('malformed saves and invalid pacing are rejected without changing settings', () => {
  const d = new ShowDirector(fixture()), original = d.exportSettings();
  assert.throws(() => d.restoreSettings({...original, playlist: ['scary-reach']}), /Invalid/);
  assert.throws(() => d.restoreSettings({...original, pacing: 'constructor'}), /Invalid/);
  assert.deepEqual(d.exportSettings(), original);
  const h = harness(); assert.throws(() => h.command('pacing', {pacing: 'unknown'}), /Unknown/);
  assert.throws(() => h.command('profile', {profile: 'constructor'}), /Unknown/);
});
test('a gentler tone skips incompatible playlist scenes rather than trapping the show', () => {
  const h = harness(); h.command('playlist', {cues: ['scary-pace', 'friendly-wave']});
  const played = Array.from({length: 20}, () => h.step());
  assert(played.includes('friendly-wave')); assert(!played.includes('scary-pace'));
  assert(h.director.history.some(e => e.type === 'playlist-skip' && e.reason === 'selected-tone'));
});
