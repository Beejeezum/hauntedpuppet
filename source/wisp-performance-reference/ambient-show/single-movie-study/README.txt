One native movie decoder — diagnostic only

Purpose: investigate the native composition failure recorded in GitHub run40769059462 (and40766398322). A complete single35-second movie passed Linux playback while the existing multi-source transport failed after interruptions. This isolated study reuses that exact848-frame master, StageCompositor, shared frame clock and silent output. It does not change FilmTransport or the app, approve assets or bypass the release gate.

The six buttons seek within original keyframed cue starts. Target timestamps are the middle of the intended frame to avoid frame-edge rounding ambiguity across engines. This sacrifices half a frame of sound/play time and is a diagnostic choice, not an approved production cue entry. Playback continues through the remaining master: logical cue-end gating, queued routes, sound timing, authored boundary transitions and a full show scheduler remain unimplemented.

Seeks hold a detached copy of the outgoing picture, mute while pending and reveal only after native seek readiness plus two presentation pulses. Stop cancels outstanding seeks, blacks and mutes immediately; stale completions cannot reveal or pause a newer cue. Missing owner/output pulses have a bounded paint deadline and release callbacks. This is not a claim of seamless perceived movement or projected visual quality.

tests/atlas_seek_study.cjs uses actual native media. Eight paused seeks compare with same-engine decoding of six single-frame MP4 goldens. Each golden is stream-copied from the original closed-GOP source, and its decoded pixels were verified equal to the original PNG golden. Native golden hashes and master hash are checked before the test. This avoids conflating Safari video colour conversion with wrong-frame errors; the pixel tolerance is2, stricter than the initial PNG comparison6. Golden decoder elements are fully released before pause/recovery stress.

Also covers a removed video effect, five real pause/stale-black/recover cycles, output-driven navigation with owner RAF suppressed, late/overlapping seek cancellation, one source load, silent projector, cleanup and a synthetic lost-clock deadline. Sound is zero-volume/hardware-muted, not acoustic listening. Local Chrome and Mac WebKit passed; Linux diagnostic results must be inspected separately. Not production acceptance, no provider/capture/physical projection.

Run with bundled Node24 and existing silent setup:
NODE_OPTIONS=--require=./work/pinned-silent-playwright.cjs node tests/atlas_seek_study.cjs
HAUNT_BROWSER=webkit selects Mac WebKit. GitHub manual native_media_only plus native_atlas_pilot runs the isolated Linux WebKit study; ordinary release checks remain unchanged and required.
