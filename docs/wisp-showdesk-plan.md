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


## Opt-in hosted release candidate

`public-showdesk.json` explicitly pins seven source/media files and their published checksums. The public build copies only this desk bundle; source-only paths are rewritten once and verified, rejected v36 is excluded, and the entire source tree stays off the CDN. The main console gains an Animation show desk workspace link; Live puppet & voice and its APIs/phone/projector controls remain intact. Phone control is not connected to the new film desk yet and is labelled accordingly.

Local built-dist Chromium rehearsal passed with actual films and layers. Existing puppet-console mobile overflow/default-mode/axe checks passed on the source static host (no provider or microphone test). The local WebKit executable is missing; do not call that a WebKit pass. A separate showdesk CI job installs Chromium/WebKit and tests the built bundle on both. Test server cleanup was corrected for browser-launch failure. Main release requires all exact-head CI jobs before merging and hosted verification afterward.


## Linux WebKit diagnostic checkpoint

CI39456394216 at4a24d326: showdesk job118744283430 passed Chromium, then failed Linux WebKit waiting for the synthetic blue layer to reach the stage at test line18. The native-avatar-offline job passed; no deployment permitted from this head. Saved completed-job logs in work/showdesk-ci-39456394216.log while other jobs were still running.

Installed official pinned Playwright WebKit26.5 build2336 locally (77.4MB). The exact built-dist rehearsal passed on Mac WebKit. Do not infer Linux success from that pass or loosen the pixel condition without observing its value. The next test revision records visibility, full desk state, exact pixel and actual media timing when the Linux wait fails. This supersedes a known failed check, not a timeout-only restart. Sound-study remains source-only and is excluded by public allowlist.


## Detached decoder correction under validation

Diagnostic run39457223883 failed in Linux WebKit with document visibility=`visible`, video readyState4/paused=false/currentTime0, and compositor suspended=true. Thus the black effect pixel was the stall safety gate, not a colour tolerance problem. Both output and owner keep the strict pixel checks.

The correction keeps muted character and imported effect video elements attached to small source-preview tiles in the sticky laptop header. They never appear as media elements in the projector window; it still mirrors only the composed canvas. Removing effects/disposal clears sources and detaches their preview nodes. Apple documents visibility-dependent video behavior at https://developer.apple.com/documentation/webkit/delivering-video-content-for-safari . Local built-dist Chromium and Mac WebKit both pass including a real moving video-effect import, clock progress, removal cleanup, layers, watchdog recovery, cue changes and auto timing. This is a tested local correction, not yet a Linux pass; the new exact CI revision must verify the original failure before release.


## Pinned runtime and bounded Linux diagnostics

Job118751575270 for f47ba9d was canceled at its job limit after Chromium passed; Linux WebKit never returned a final result. Its completed logs are saved in work/showdesk-ci-39458417395.log. Do not call attachment a proven Linux fix.

The old local wrapper resolved bundled Playwright1.62.1 while the repository and CI pin1.64.1. That local comparison was insufficient. Installed the repository-pinned official Chrome156/rev1248 and WebKit27.2/rev2370; the new ignored work/pinned-silent-playwright.cjs points to the repo package. Local built-dist Chromium49490 and WebKit50889 pass with that package, but Linux backend behavior remains unverified.

The rehearsal harness now has a150second failure watchdog, bounded2second diagnostic evaluation and5second browser teardown, closes its own fixture HTTP connections, and logs progress checkpoints/browser version. It still fails nonzero on a timeout; no hidden success or weakened media/pixel assertion. This is intended to expose a stuck driver/cleanup path instead of consuming the entire job window.

Layer-placement support (size plus normalized x/y offsets) is added for the typography scene. Existing defaults are unchanged. Actual compositor tests validate placement, reject invalid values atomically, preserve Blackout and show the static fog lettering has at least20% RGB reserve at70% scale. Derived black-stage and staged-lettering frames are retained, original generated PNG unchanged. This does not establish animated clearance, and the typography remains outside the public cue manifest. No new Runway generation was submitted for it.


## Layer placement and atmosphere choreography follow-up

Imported visual layers now expose Size, Horizontal and Vertical sliders plus Center & fit. Character film placement stays fixed to preserve reviewed framing. These controls change the same composed canvas sent to the silent projector. The rehearsal adds actual pixel checks for moved/resized output and restored placement. This follow-up is separate from the already-running9412627 release candidate and is not yet deployed.

The atmosphere-scenes.json production sheet specifies12second fog greeting and14second bat disruption stories, readable text holds, localized wakes, restrained nonverbal sound timings and complete empty-stage exits. It is not rendered footage. Existing typography stays source-only.

One5second scary living-cycle proof is running as Runway task ac2837b7-d535-4844-a908-3eae1ed764e8. It uses softer v34 artwork staged at85percent, identical first/end target and a closed articulated gesture. Observed credit debit85. No automatic retry; all-frame bounds, material, continuing end motion and repeated seam review are required before integration.


## Wrapped-header regression fixed locally

Run39460647720 completed with three successful jobs (showdesk, existing-console WebKit, native-avatar-offline) and a failed full regression. Actual failure: tests/puppet_monitor.cjs could not click Dance because the wrapped workspace header intercepted pointer events. Saved completed regression logs to work/regression-ci-39460647720.log. The unchanged local test reproduced that same failure.

Desk layout now measures its actual header height with ResizeObserver, disconnecting on pagehide. Root scroll padding and the desktop sticky puppet console use that measurement instead of the stale88pixel assumption. The original test passed after this correction; an additional actual hit-target assertion plus viewport checkpoints also passed at1512x1000,1280x720,390x844 and320x740, including monitor reuse/accessibility/Blackout. No force-click or weakened assertion. New exact-head full CI is still required; failed941 release must not merge.

The effect-placement follow-up also passed real built-dist Chromium156 and WebKit27.2 with resized/moved effect pixels on the silent output. Public build/privacy checks and geometry/typography reserve checks pass locally. V37 remains rejected for continuous-loop near-hold and is excluded from public cue manifest. Bat-lettering proof ccbf9c7f-0108-4d4a-bd56-10882cffb7ed is generating once, observed debit85; no new sound until picture is reviewed.
