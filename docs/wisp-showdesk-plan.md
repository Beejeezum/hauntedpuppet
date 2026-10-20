# Animation-first Wisp show desk

## Current goal
Finalize real painted nonverbal films and overhaul the app into a show-control desk with large labelled cue buttons. Modes: cute, scary, alternating, mostly scary with brief friendly interludes, and manual cueing. Dwell and form-change pacing are operator settings. Live puppeteering, voice and webcam remain a separate workspace with existing working paths preserved. Every cue needs a deliberate transition; never immediately replace a visible unrelated first frame.

The projector receives a composed stage, not just a video element. Layer stack: character film, optional atmospheric video/image effects, designed fog lettering/bats, foreground effects. Operator controls order, visibility, opacity and blend mode. Only laptop-owned sound effects are audible; phone/projector remain silent. Blackout clears everything, regardless of layers or queued cues. External media imports stay local unless explicitly uploaded.

## Implemented local rehearsal — not deployed
- `assets/stage-compositor.js`: ordered canvas layers, independent opacity/visibility/blend controls, contained aspect fitting, latched whole-stage Blackout and disposal. Projector will mirror final canvas; it must never create separate effect/video audio players.
- `source/wisp-performance-reference/ambient-show/cue-director.mjs`: prepare destination before exit, latest queued request wins, swap only behind a planned blackout, minimum500ms planned empty-stage hold, fade entrance, immediate Stop and stale decode rejection. This fade-through-black is an editorial transition, not a shape morph.
- `showdesk.html` / `showdesk.mjs` / `film-transport.mjs`: actual v28/v35 media playback, large cue buttons, cute/scary/alternate/mostly-scary selections, dwell and fade pacing; local PNG/JPEG/WebP/MP4/WebM layer import, controls and final-canvas projector mirror. All videos muted. Candidate scary footage exits through black before its unapproved loop endpoint; repeated scary entries are a development limitation, not a finished show.
- Thirty-two production cards now include nonverbal ghost stories, Happy Halloween fog lettering and bats breaking up the letters. They remain planned cards, not finished films.
- Synthetic director cancellation tests and actual Chromium pixel tests pass. `tests/showdesk_rehearsal.cjs` also passes with actual v28/v35 films, a synthetic local effect mirrored to silent output, Blackout/stale decode, automatic/manual takeover and narrow-screen controls. Desktop screenshot inspected and cue/preview spacing revised. No human seam/native voice/physical projection acceptance implied.

## Next implementation sequence
1. The isolated real-media development desk is built at http://127.0.0.1:8898/source/wisp-performance-reference/ambient-show/showdesk.html (read-only static server session35062). Continue from this implementation; do not restart a key-owning server. Operator preview and output use the same composed canvas. Add cue labels/current/queued state, modes/dwell, layer controls and local effect imports. Keep one authoritative owner and retain existing puppeteering until the new workspace switch is tested.
2. Validate existing real films and choose a minimum ready library. Treat reviewed matching joins/authored bridges as preferred paths. Planned fade-through-black can connect incompatible cues without double bodies. For clips without a seamless loop, author an exit before the ending instead of freezing or silently hard-looping. Preload failure keeps a reviewed living loop or authored empty stage; it must not replace the picture with a stale frame.
3. Finalize missing scary living motion, entrances/departures and both morph directions with controlled Runway experiments in the ORIGINAL Wisp session. Direction approval is not blanket seam acceptance. Keep complete-effect framing reserve, original media, cost/provenance and failure evidence.
4. Produce exact designed lettering separately from generated fog; use tracked stroke/hand or bat wake masks. Lock film timing before buying/generating corresponding short SFX. No ambient dialogue, lyrics, spoken boo or random narration. Sound cues need level/tail/cancellation and explicit operator enable.
5. Integrate and test projector, phone commands, operator takeover, queued cue interruption, friendly reset, Blackout, recovery and cleanup. Only after verified browser/real-media behavior and visual review should the new desk become the main site entry. Preserve a direct route to puppeteering and working native voice.
6. Deploy through existing Git CD after exact regression checks, test hosted build, then actual paired-phone/house projection and evening rehearsal. Goal incomplete until real art, interaction and physical acceptance pass.

## Important limitation
Current live site remains dae1261. No new desk, layer UI, films or sound effects from this goal are live yet. The main app cannot be called overhauled from these foundations alone.


## Recording and recovery checkpoint

The actual composed canvas was recorded through cute → scary → cute in isolated Chromium. The first recording revealed no reliable empty hold; the director now adds at least500ms black between incompatible films. Fourteen sampled full-resolution canvas reads during v3 empty-stage phases were exactly RGB0. The lossy recording has faint residual pixels in one hold (RGB4/8 export thresholds fail there; RGB16 has both hold spans). Do not silently relax or call the export pixel-perfect. This is a browser recording, not a physical projection or accepted form morph.

Evidence: `work/showdesk-cue-transitions-v3.json`, `work/showdesk-cue-transitions-v3-review.json`; display clip in sibling `outputs/wisp-vision/wisp-showdesk-cue-transitions-v3.mp4`. No new generation credits or soundtrack. Actual browser test now covers true 10-second alternating form dwell, scary pre-end exit without hard-looping, character pause suspending the entire composition (including effect layers), decode recovery, manual takeover and Blackout. A media-ended fallback is prevented from overwriting a transition already underway.

Next: finish the real film library and authored entrances/morphs instead of hiding its incompleteness behind repeated black transitions; add proper SFX and text/bat assets; integrate phone/safety and the separate puppeteering route; then exact release/hosted checks. No new desk is published yet.


## Scary return-bridge experiment v36 — rejected

One four-second whole-character bridge was generated from the exact distinct v35 last/first frames (60credits, one submission, no automatic retry). It moves its arms, but turns painted vapor into solid ribbon/fish-curl shapes and fails complete-effect reserve. The first join silhouetteIoU is0.988; the return is0.804 with visibleRGBdifference49.5. End-frame conditioning alone did not preserve the required return pose/material. The candidate is not in the desk or public build. Reports and unmodified original are retained under scary-return-bridge-study. Do not trade fidelity for a cheaper render or claim endpoint image inputs guarantee a seamless animated loop.

The rapid cue-change browser case now also passes with actual films: a destination changed during exit settles on the final requested cue with no leftover queued command. The first rerun failed saving screenshots due ENOSPC; its successful post-cleanup rerun is separate evidence. Only the agent-created reproducible native-avatar dependency environment was removed (~281MB); source/requirements/credential services stayed intact. Native SDK inspection later requires recreating that isolated environment. Disk space subsequently recovered externally; no user files were deleted.
