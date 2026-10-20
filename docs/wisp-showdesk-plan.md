# Animation-first Wisp show desk

## Current goal
Finalize real painted nonverbal films and overhaul the app into a show-control desk with large labelled cue buttons. Modes: cute, scary, alternating, mostly scary with brief friendly interludes, and manual cueing. Dwell and form-change pacing are operator settings. Live puppeteering, voice and webcam remain a separate workspace with existing working paths preserved. Every cue needs a deliberate transition; never immediately replace a visible unrelated first frame.

The projector receives a composed stage, not just a video element. Layer stack: character film, optional atmospheric video/image effects, designed fog lettering/bats, foreground effects. Operator controls order, visibility, opacity and blend mode. Only laptop-owned sound effects are audible; phone/projector remain silent. Blackout clears everything, regardless of layers or queued cues. External media imports stay local unless explicitly uploaded.

## Implemented foundations — not deployed
- `assets/stage-compositor.js`: ordered canvas layers, independent opacity/visibility/blend controls, contained aspect fitting, latched whole-stage Blackout and disposal. Projector will mirror final canvas; it must never create separate effect/video audio players.
- `source/wisp-performance-reference/ambient-show/cue-director.mjs`: prepare destination before exit, latest queued request wins, swap only behind a planned blackout, fade entrance, immediate Stop and stale decode rejection. This fade-through-black is an editorial transition, not a shape morph.
- Thirty-two production cards now include nonverbal ghost stories, Happy Halloween fog lettering and bats breaking up the letters. They remain planned cards, not finished films.
- Synthetic director cancellation tests and actual Chromium pixel tests pass. No full film-join, live UI, native voice or physical projection acceptance is implied.

## Next implementation sequence
1. Build the new desk as an isolated real-media development page. Operator preview and output use the same composed canvas. Add cue labels/current/queued state, modes/dwell, layer controls and local effect imports. Keep one authoritative owner and retain existing puppeteering until the new workspace switch is tested.
2. Validate existing real films and choose a minimum ready library. Treat reviewed matching joins/authored bridges as preferred paths. Planned fade-through-black can connect incompatible cues without double bodies. For clips without a seamless loop, author an exit before the ending instead of freezing or silently hard-looping. Preload failure keeps a reviewed living loop or authored empty stage; it must not replace the picture with a stale frame.
3. Finalize missing scary living motion, entrances/departures and both morph directions with controlled Runway experiments in the ORIGINAL Wisp session. Direction approval is not blanket seam acceptance. Keep complete-effect framing reserve, original media, cost/provenance and failure evidence.
4. Produce exact designed lettering separately from generated fog; use tracked stroke/hand or bat wake masks. Lock film timing before buying/generating corresponding short SFX. No ambient dialogue, lyrics, spoken boo or random narration. Sound cues need level/tail/cancellation and explicit operator enable.
5. Integrate and test projector, phone commands, operator takeover, queued cue interruption, friendly reset, Blackout, recovery and cleanup. Only after verified browser/real-media behavior and visual review should the new desk become the main site entry. Preserve a direct route to puppeteering and working native voice.
6. Deploy through existing Git CD after exact regression checks, test hosted build, then actual paired-phone/house projection and evening rehearsal. Goal incomplete until real art, interaction and physical acceptance pass.

## Important limitation
Current live site remains dae1261. No new desk, layer UI, films or sound effects from this goal are live yet. The main app cannot be called overhauled from these foundations alone.
