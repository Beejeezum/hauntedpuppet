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


## Bat-lettering motion proof and current release handle

One5second proof ccbf9c7f-0108-4d4a-bd56-10882cffb7ed completed (85observed credits), original c68a47ae8d388e73b980c80bc28acc2e0d8f45ecc90a28fffb66e0c675e15685 retained. Opening sampled lettering is correctly spelled, bats change wing shapes, letters break up and the film clears. Raw5frames miss15percent reserve; no content reaches the frame edge. A derived80percent centered whole-shot staging preserves all121frames at24fps and passes20percent reserve throughout (minimum20.73percent); no crop/interpolation/reversal/retime. Its final11frames are exactRGB0. This is an exit-story proof, not the complete14second entrance/readable-hold/master.

One5second SFX request068f06e3-8e94-422a-ac58-e675152e1a2d (quoted5credits) completed. Original sound retained. Review mux uses0.6gain,50ms attack and fade4.0–4.5seconds. Decoded peak0.2704,RMS−40.74dBFS; post4.6sec exactzero. Numeric levels cannot prove no voices or speaker quality. Human visual/listening question pending on the inline review video at outputs/wisp-vision/bats-through-letters-v38-sound-review.mp4. No public cue/audio integration yet.

PR8 remote head6aba99fc2e10a350d79b40e859866bbfed9ea13b contains placement controls plus wrapped-header correction. Fresh CI39462963561 exists: showdesk/WebKit/native-avatar-offline running and fullregression queued at last poll. Wait on that same handle; do not cancel or repush merely for observation timeouts. Existing production remainsdae1261. Additional live-resize hit-target test passes locally and is retained as an unpushed follow-up, not evidence of exact-head CI.


## Actual-film forward morph v39 — review candidate

Previous goal turn classified progress: real v38bat/SFX proof, effect placement controls and reproducible wrapped-header fix/tests were produced. Current turn prepared actual v28last/v35first decoded endpoints through the real compositor at common85percent fit, then submitted one5second forward morph d5629751-d1ab-4b2b-a2a7-b3086dcfe36e (observed85credits). No reverse-video trick or automatic retry. Original ca6209524bb5cec338fe71f807700dab4a7925cd75341e351dc8a317a17599f8 retained.121frames24fps1920x1080silent, allRGB4/8/16 bounds pass20percent. Cropped temporal samples show coordinated brows/grin/claws with coherent painted fog core.

Assembled actual friendly122frames → morph121 → scary121 at fixed common85percent1280x720, preserving every source frame/order without fades, reversal, hold trimming or interpolation. Export f5c39c64a0c826d367f2a3ddf2e20f7762dc1fab8e5f7676e743f7fd955507ba at outputs/wisp-vision/wisp-film-morph-handoff-v39.mp4. Both joins close visually in static comparisons: IoU0.9888/RGBdiff3.142 andIoU0.9774/diff3.912. Cut pixel steps2.619/2.998; preceding/following medians show some outgoing-morph settling, not proof of velocity matching. All364assembledframes pass20percent reserve (min20.28percent). IsolatedChromium played all364frames to end muted with0reported dropped frames. User asked for normal-speed identity/join feedback; pending. No public integration or seamlessness approval, and no reverse asset yet.

New20cycle real showdesk soak runs in isolatedsilentChromium as session84739, repeatedcute→scary→cute with one output window, fixed media counts, then Blackout/owner-close cleanup. Poll exact existing session until terminal. Current exact-head release remains6aba99fc2e10a350d79b40e859866bbfed9ea13b/CI39462963561: showdesk,WebKit,native-avatar-offline pass; fullregression still running. No new push while live; local501af67 and newer studies are outside this release head. Production remainsdae1261.


## Output navigation disposal correction verified locally

First20cycle soak finished all20cute→scary→cute cycles with2owner videos/0owner audio elements/0projector media elements, then failed waiting for stopped=true after owner navigation. Picture had cleared, but dispose only called blackout and relied on a later animation callback in the unloading owner realm. The initial latest-progress file was overwritten by the short rerun before archiving; original terminal tool output and this failure description are retained, not reconstructed heap samples.

Output now has an explicit stop method that sets stopped, cancels the scheduled frame and clears the canvas. Escape, output pagehide and owner disposal use it. One-cycle navigation reproduction, existing whole-film output test, both built-dist Chromium/WebKit showdesk regressions with a new owner-navigation assertion, and a fresh full20cycle soak all pass. Fresh soak retains a unique work/showdesk-soak-<timestamp>.json plus latest report, including failure state if a later run fails.20cycle pass includes Blackout and owner navigation cleanup; not overnight/physical/human acceptance.

Because6aba99f lacks this verified disposal fix, it must not deploy even if its still-running regression later passes. The next exact-head CI will supersede it for this concrete new defect, not for an observation timeout. Public preview helper checksum is refreshed; source-only review films remain outside the public allowlist.


## Return morph v40 and one review link

Return taskcc2480f1-ee1f-4b33-b736-3e87c68d1d3e completed once (85observedcredits). OriginalSHA d958fc38d9defd583feb871b673c73600f329fec7d26bc93e84b96bee0edb084 retained;121frames24fps1920x1080silent. Cropped temporal samples show face/claws softening into cute identity with attached hands/core. All121frames meet20percentRGBreserve.

Assembled real friendly → forwardv39 → scary → returnv40 → fullfriendlyrepeat at fixedcommon85percent stage, preserving all607frames24fps without crossfades, reversal, retiming or interpolation. SHA40f4e00b9b26da6ea69206e2025bba0ae5473c84eabe7669f606a32f97bb68cf. All607frames meet20percent complete-effect reserve, min20.28percent. Returnjoins IoU0.9893/RGBdiff3.444 andIoU0.9908/diff2.616. These are endpoint diagnostics, not human motion acceptance.

Source review page http://127.0.0.1:8898/source/wisp-performance-reference/ambient-show/review.html now presents25.2917sec roundtrip plus5sec bat/SFX proof, both initially paused/muted with explicit controls. Local isolatedChromium test plays both to end,0reported dropped frames, no page errors or390px overflow. User said “yeah that works” after previous preview link; treat as preview/direction acknowledgement, not explicit acceptance of all four new joins or physical projection. No new morph cue/automatic-program/public promotion.

Remote PR8 head765502fd0851450db85001fe23a6bfadfa49db0d includes explicit output disposal and20cycle-tested source helper, plus earlier desktop/mobile fixes. CI39465015030 confirmed pending with no jobs yet; previous39462963561 still had fullregression running. Poll these same handles; do not manually redeploy or repush for waiting alone. Newreturn assets/review-page updates are local follow-ups beyond765502f and should not cancel its run. Production stilldae1261.


## Next safe checkpoint

Release head765502fd0851450db85001fe23a6bfadfa49db0d is the only current deploy candidate, CI39465015030. Wait on that exact run; after every job succeeds, merge only that matched head through existing GitCD and verify hosted build/canvas behavior. Local1aa1cd7 and later review studies are not in this release. Do not substitute localHEAD at merge.

Pending paid departure8d3a9ccc-d8e1-47ba-baa0-3572c91da7ea is one10second true turn/back/curved-depth exit from scary actualending to emptyblack. Observed170credits; no batch/retry. Fetch exact existing task, retain original, review every-frame bounds, back material/core/attached hands, actual start join and empty ending before any integration.

The source review page now has complete25second roundtrip plusbat/SFX proof and is locally browser-tested. No additional user feedback is required merely to keep working; existing visual/join/listening questions remain pending, so do not silently mark these assets human-approved. The library, film-desk phone integration and physical acceptance remain incomplete.


## Release765502f failures and targeted repairs

CI39465015030 is terminal failure, with showdesk/native-avatar-offline success and fullregression/WebKit failed. Retained failed logs work/failed-ci-39465015030.log. Fullregression caught a second source checksum manifest (runway-pilots/manifest.json) still pinning the old helper after explicit output stop was added; public-film-preview.json had already been refreshed. Updated only the affected helper checksum in that source manifest. Existing tests/wisp_film_speech.cjs now passes source hashes plus real muted fixture playback/interruption/disposal.

LinuxWebKit prepared_audience.cjs reported a cute-mouths.json access-control pageerror during its intentional seed/reload sequence. Initial core-ready is earlier than optional eye/mouth rig loading. The test now waits for that rig to settle (ready or explicit error) before intentional reload, keeping all pageerror, no-provider/no-capture and audio-safety assertions unchanged. Local pinnedWebKit prepared_audience passes including known scary saved audio rejection, Welcome stop, queued/delayed-decode rejection and friendly recovery. This supports a navigation-race hypothesis; only new LinuxCI can verify the original case. Do not call the prior CI green or deploy it.

One depth-departure task8d3a9ccc-d8e1-47ba-baa0-3572c91da7ea remains RUNNING at latest authoritative poll; preserve same handle, no retry. Source review page has25sec roundtrip and5sec bat/SFX proof; human all-join/listening feedback and physical projection remain unverified.


## Depth departure v41 — final material rejected

Task8d3a9ccc-d8e1-47ba-baa0-3572c91da7ea completed once,170observedcredits, originalSHAf846c4482da534689863ae421a6b4c04754d6e2abb3c679368f0577934fcfd90 retained.241frames24fps1920x1080silent. Allframes pass20percentRGBreserve, minimum23.70percent; true side/back turn and receding path are present. Cropped frames40–100 expose smooth cylindrical arms, solid shoulders and a prominent spine-like back ridge. Final character material rejected; retain spatial motion reference only, no public integration/SFX purchase/retry.

Next art dependency is a designed painted rear/three-quarter guide: opaque anatomy is a repeated front-only generation failure across old turns and this softer-front experiment. Do not keep buying the same front-to-back prompt. Current release remainsf7d330b8b61c5bf6464149570ba421c859e7f740 in CI39465845920; allfourjobs were running at lastpoll. Do not repush unrelated source study updates while that run lives.


## Rear guide studies — still unapproved

Used built-in imagegen (no CLI/API fallback), reference frontv34, to create transparent rear guidev1, then one targeted material/color correctionv2. Originals remain in default generated_images and project copies/prompts are retained in rear-vapor-guide-study. V1blue halo/crisp contour differs from desired vapor. V2reduces blue saturation but remains too cloud-lobed/crisp and needs head/proportion comparison. Both rawPNGreserve tests fail20percent because imagegen enlarged the silhouette (v1top/bottom~6percent;v2~5percent). Do not buy Runway motion with these guides yet. No runtime/public promotion or claim of a finished turnaround.

V41ending also fails exactRGB0empty-port gate despite20threshold-empty frames; pilot.json records finalmaxRGB and0exactblacktailframes. CurrentCI39465845920 atf7d330b remains the releasehandle; native-avatar-offline pass, otherthreejobs running at lastpoll. Earlier765502f failures were repaired in f7d330b with updated source-manifest checksum and a prepared-audience fixture artwork-settling barrier. Local targeted tests pass; Linux verification pending. Do not push these unrelated source-study commits while the run lives.


## Linux recovery block needs precise diagnosis

Completed showdesk job118776902132 in CI39465845920 failed terminally at the150second test watchdog. Chromium passed. LinuxWebKit reached layer-pixels-mirrored/testing-stall, then no further progress; old block had no checkpoints between pause, suspended gate, black output, play promise and recovery. Direct completed-job logs retained work/showdesk-failure-39465845920.log (run-wide gh log retrieval was unavailable while otherjobs ran). This does not identify which await stalled or establish a production fix.

Harness now uses10second default action waits, bounded3second pause evaluation, explicit5second gate/black/recovery waits and6second resume promise, with a log after each stage. It exercises five consecutive realpause/resume cycles, keeps exactblue/black assertions and existing2secdiagnostics/5seccleanup. Both pinnedlocal Chromium156 and MacWebKit27.2 passed allfivecycles plus actual programs/layers/Blackout/owner navigation. No owner-focus forcing, error filtering, tolerance increase or application media changes. NextLinuxrun must establish the precise failure or reliable repeated success; do not claim logging fixed media.

The existing-console LinuxWebKit job in39465845920 now passed after the artwork-settling fixture correction, native-avatar-offline passed, fullregression still running atlastpoll. A new exacthead may supersede the known failedshowdesk job with these stronger diagnostics; this is a response to a terminal testfailure, not a wait-only rerun. Production remainsdae1261.


## Paired phone film controls and release checkpoint — 2026-10-20

PR8 exact head9b299448d9ca54ac21154b420ec394ed8fdf2fbc passed all four jobs in CI39467044811. Normal Git merge produced e44697a27fc2eda96c6445c4a5f7cc4606486bab; Git CD publication/hosted verification is pending. No manual deploy or production credential changes. LinuxWebKit passed all five bounded recovery cycles; diagnostic instrumentation is not claimed as an application decoder fix.

A separate follow-up connects the existing paired-phone bridge to the film desk with injected controller/preview canvas. Phone film workspace offers two actual film cues, four programs, Welcome, stable Blackout and separate Restore; unsupported live gestures/voice/gaze are hidden and rejected. Existing live workspace keeps its prior controls. Backend forwards only bounded workspace enum plus existing allowlisted state. Phone remains silent, laptop retains capture/audio ownership. Stop defeats pending decode; intentional cancellation does not leave an obsolete laptop error. Cloud preview caption now accurately says every few seconds.

Real local Postgres-compatible pairing/auth service plus actual built owner/phone pages passed isolated Chromium end-to-end: cue/program/Welcome, pending-cue Stop, Blackout/Restore, output black and relit pixels, revoke/disable, no provider/capture requests and no phone/output media. Legacy cloud phone browser test passed separately. Captured actual390px viewport at scroll0; no horizontal overflow. The preview remains large; full-page screenshot after scrolling had misleading sticky placement. No claim of physical-phone or hosted pairing acceptance. Future CI retains film-phone evidence. Added hosted release verification script checks exact Git build and published allowlist hashes before real silent playback and output lifecycle tests.

Asset review remains separate. New scary ambient phrase task15088de9-4db9-4eb2-b6b1-3617bf6593ed completed once; useful attached-arm acting but opaque tubular material and insufficient smoke reserve reject finished use. User rejected v38 Halloween fade/bat pacing. New single five-second pilot45aa0509-60db-441d-a560-1af292f735ba requests actual smoke advection and small fast bats emerging behind letters toward viewer; 85credits observed, no retry, pending inspection. Neither candidate promoted to public film cues.


## Hosted release verified; material gate retained

Production now reports mergeSHAe44697a27fc2eda96c6445c4a5f7cc4606486bab built2026-10-20T17:53:33.365Z. Isolated hosted Chromium verified every public showdesk allowlist hash from that exact Git commit, actual cute/scary/cute playback, visible silent output, Stop-to-black, output disposal on owner navigation,390px no horizontal overflow, no microphone/provider requests. Evidence test-results/showdesk-hosted.json. First test attempt failed because its capture trap assumed navigator.mediaDevices existed on about:blank during teardown; guard added, full hosted rerun passed. This is a test-harness repair, not an app audio fix. Native live/voice actual provider and physical projection are not established by it. Public beta has two films and planned black transitions, not a finished32-film library or native anatomical morph.

Phone follow-up PR9 https://github.com/Beejeezum/hauntedpuppet/pull/9 is draft atc3e1c76755c89eade0d3e0beae9ff84012fc8712. ExactCI39470099298 was confirmedrunning; do not cancel/restart merely because it is waiting. Localphone test plus output relight, local cloud contracts,8Python phone tests and publicbuild passed. Production does not yet include this phone follow-up.

Revised bat/smoke task45aa0509-60db-441d-a560-1af292f735ba completed once:121frames24fps1920x1080silent, SHA238614d4daab6db4c559405a25a826fadda417c8c0227da082fc9e3a3f05b638. Smaller bats and local breakup are present in contact review, but surviving lettering remains too solid/crisp;43frames fail20percent reserve, minimumright8.70percent fails15percent too. Not public, no paid retry. Built-in imagegen is making a vapor-stroke source anchor; original text material is the likely constraint, and further video spend waits on useful material reference.


Built-in imagegen material edit saved fog-lettering-study/happy-halloween-vapor-v2.png with full prompt vapor-v2-prompt.txt, preserving RGBA and original default output. It still inherited too much solid serif structure/cloud surround and raw framing misses20percent; not approved and not sent to paid video. Do not call this the finished smoke lettering. Next material attempt should change the underlying stroke structure rather than preserving the old type shape; paid retry remains gated on review.


## Fresh fog material and Linux mute diagnostic

Fresh built-in imagegen (no old source image) produced happy-halloween-vapor-v3.png, SHA b7a8aab15fc0606a207e39331bd53158b5101c2ad1488ded58a145779fa07725, RGBA1672x941 alpha0..254. Softer variable fog strokes remove the prior sharp serif skeleton; human material review requested, not approved. Raw alpha>4margins left14.41/top21.36/right13.58/bottom16.90percent fail20percent; stage with additional reserve before any motion spend. Full prompt and machine measurements saved. Updated atmosphere scene choreography to require behind-to-front small fast bats and actual advecting smoke, preserving planned/notfinished status. Planner tests pass; synthetic scope only. No additional Runway generation submitted.

PR9 CI39470099298 WebKitjob118791584172 terminal failure at tests/puppeteer_voice.cjs38:30second idle/rest timeout after Mute. Diagnostic state stillphase live,mutedfalse,micEnabledtrue and valid syntheticinput/output. This does not identify whether pointer failed or mute toggled back. Retained completedjob logs work/phone-ci-webkit-39470099298.log. Added bounded test-only pointerdown/up/click target history and immediate post-Mute state to failure diagnostics; no application behavior change or softened assertion. Local pinnedWebKit reproduction session34492 running against read-only8898 source. OtherCIjobs remain live; do not call whole run terminal or restart those blindly. Production remains tested e44697a and does not include PR9.

Local pinnedMacWebKit puppeteer diagnostic test passed all6syntheticAudioWorklet cases on read-only8898, including mute, silence recovery, cleanup and silent projector. Peak syntheticDSP frequencies571.29/275.39Hz. This does not reproduce or fix the Linux click failure. NewCI diagnostics are needed before PR9 can ship.


## Owner sound foundation — not yet mounted or published

Added owner-sound.mjs as an isolated laptop-only WebAudio effect bus. Constructor creates no audio context. Explicit enable resumes audio; bounded PCM decode, gain and scheduling; cancellation invalidates pending decode and stops future sources on the audio clock with12msactive-tail ramp; disposal closes context and buffers. No microphone/provider calls. No projector/phone import or public allowlist entry, no cue mapping yet, no generated sound approved by implication. This is a foundation for the requested sound-enabled cue films, not completed runtime integration.

Actual isolated silent Chromium decoded a generated WAV, scheduled immediate and5second-delayed sources, confirmed delayed source ended promptly after cancellation rather than surviving until its scheduled impact, rejected late decode, invalid timing/level, and closed/disallowed reenable after disposal. Synthetic acoustic content and no human listening acceptance. Test tests/owner_sound.cjs. New PR9 diagnostic CI39470663728 confirmedpending at a79854e; earlier39470099298 fullregression stillrunning with knownWebKitfailure. Preserve same handles.


## Local sound-effects controls integration — unshipped follow-up

Mounted laptop-only local effects panel in source showdesk: explicit enable, local audio import, level control, six removable manual cues, mono/stereo up to30sec,20MBcompressed ceiling. File picker is disabled during decode so concurrent imports cannot exceed six. Playing requires a visible non-stalled film; starting a replacement cancels the previous effect. Director leaving playing, Stop/Blackout, first stale-frame detection and pagehide cancel audio; pagehide disposes context. No preloaded/provider sound, speech, phone/projector sound bus or automatic cue soundtrack asserted. Public allowlist/hash imports updated locally but not pushed over the active release diagnostic run.

Tests/owner_sound.cjs passed real WebAudio decode/scheduling, delayed-source ended event before its5sec due time, stale-decode rejection, invalid gain/timing and disposal with synthetic silentPCM. Tests/showdesk_sound.cjs passed actual source desk explicit enable/import, no effect on empty stage, manual playback, cue-change cancellation, Blackout and effect removal; owner videos remain muted and no audio elements. No human acoustic or physical-projection approval. CurrentCI39470663728 at a79854e is confirmedrunning allfourjobs; this local sound follow-up is beyond its exacthead and must get its own verified release check later.


## Integrated sound isolation and second Linux recovery failure

Local integrated sound test now intercepts AudioContext creation in owner and output contexts. Explicit enabling creates exactly1ownercontext; actual projector popup remains0contexts and0audio/video elements even while a manual sound plays. Self-contained HTTP fixture replaces reliance on8898, and built-dist version passed import/play/removal/cue-change/Blackout. CI showdesk job will run both owner sound and actual desk sound tests on the next follow-up head. No new sounds generated or claimed approved.

Local built-dist Chromium full rehearsal session6506 completedPASS including5stallcycles, modes, layers, narrow screen and owner-navigation cleanup. Remote a79854e CI39470663728 showdeskjob118794209713 terminallyfailed in LinuxWebKit: pause returnedtrue at1.745sec, but5sec later actual character was playing at1.684sec and composition never suspended. It is not a resumed-decode timeout; video did not stay paused. Original test selected first nonpaused object from a history including removed media. Changed fixture to select connected character video by actual director cue, assertitwasplaying, recordcue/connection, and trace JavaScript play calls plus native play/pause/ended events. No production media change, forcefocus, repeatedpause, error filtering or relaxed pixel/time gates. Cannot claim a rootcausefix until Linux evidence. Logs work/showdesk-failure-39470663728.log.

Local pinnedMacWebKit built-dist diagnostic session33464 passed all5pause/recovery gates and Blackout/late-decode, remainingmode/mobile/cleanup pending atlastpoll. Same remoteCI stillhasWebKit andfullregression running; retain it for mute-event diagnosis, no wait-only restart. Current local follow-up changes are unpushed beyond31792ed. Production remains e44697a.


## Sound panel visual pass and retained CI wait

Inspected actual open390x844sound panel screenshot test-results/showdesk-sound-mobile.png. Styled as a matching collapsed card, full-width level/file controls, labelled play/remove rows,44pxminimum touch targets and filename wrapping. Actual local browser test passes no horizontaloverflow and Stop staysvisible. Enable button now clearly readsLaptop effects enabled after activation. Effects remain laptop-only/manual, with no approved automatic film soundtrack claim. Public hashes refreshed; follow-up remainslocal/unshipped.

ExactCI39470663728 WebKitjob118794209562 now authoritatively completed Check direct voice effects success, including previously failing syntheticmutecase. It is still in painted eyes/apparitions step. This single pass does not establish why priorc3mute failed. ShowdeskLinuxjob alreadyfailed and logs/targetedmedia diagnostics are retained. Preserve currentlivejobs untilterminal, then ship a newcandidate only after fullchecks; no live site changes.


## Stall sound test and one real acting render

Built-dist sound tests now run both actualChromium andMacWebKit, each using its own isolated HTTPfixture. Both passed: enable/import, no sound on empty stage, manual effect with exactly1ownerAudioContext/0outputcontexts/0outputmedia, pause the actualcharacter, awaitcompositionstale, confirm effect cancelled, resume picture then play anew, cue-changecancel,Blackout,removal,narrow-screen overflow. This is synthetic audio in muted/zero-level browser tests, not human acoustic acceptance. CI step extended to both engines in unpushed follow-up.

One capped5second friendly notice/wave/physicalfogdeparture task23fee543-3808-4437-9260-86bb0ee06fd5 submitted in correctworkspace1709631,85observedcredits. Exact existinguploaded v28-derivedfriendlystart plus existingblackend, no reupload or batch. No new smoke-lettering motion while humanmaterial feedback pending. Review actual fullframe bounds, attachedhand/material, realdispersal, exactblacktail andstartjoin before any library promotion; no paidretry. Task pending, poll samehandle after suitableinterval. CI39470663728 remainslive forremainingWebKit/legacyregressions with knownterminalshowdeskfailure.


## Friendly wave/departure proof completed

Task23fee543-3808-4437-9260-86bb0ee06fd5 completed once85credits. OriginalSHA572e2a9a4a0bdf6db164a7c29e6f923f510de8534d5c5e3596111cf221c6db29,121frames24fps1920x1080silent; all20percentreserveRGB4/8/16pass, minimum24.81percentbottom. Detailcontacts show attachedwave, headtilt/blink, independentarm/head response and intentional vapor breakup near3.5sec. Human motion/material approval remains pending. Firstframe versus supplied v28-derivedstagedPNG IoU.99075/visibleRGBdiff2.488; static registration does not prove idle-to-wave velocity or visiblejoin acceptance.

OriginalendsmaxRGB1,0exactblacktailframes: do NOT claim originalpassedemptygate. Editorialreview appends12black-sourceframes (0.5sec), retains original121actingframes/order, H264reencode, no crop/interpolation/reversal/actingretime. Encoded first3appendedframesretainnearblacknoise; final9framesexactRGB0, meeting8frameemptyboundarycriterion. ReviewSHA198c1b719c914aa3fe8c1abf256ecd8db247cc332863d1cd2d8bfe513b8c233d,133frames, all20reservepass. Not publiccue, noautopromotion/retry.

Source review.html adds this5.5secperformance first; existing25secroundtrip remains, oldbatpictureexplicitlysuperseded/rejected and retainedonlyasSFXreference. Previoustwo-filmbrowsercheckcompletedPASS, but newthree-filmversion has a separate livecheck pending (nexttoolsessionhandle). Do notmislabeloldreportasnew3videoevidence. CInewhead5000d837999226e15fdb218fbfd3c9103186c96a run39472111843 is confirmedrunning; nativeofflinepassed, other3running. Prior39470663728 cancelled/superseded because of terminalshowdeskfailureplusnewvalidatedsoundfeature; its completedWebKitpasslogs retained. Productionremains e44697a.

Newthree-filmreview browser session31039 completedPASS: wave133frames,roundtrip607frames,bats125reportedframes,0reporteddrops each, allendedmuted/noautoplay, noerrors or390pxoverflow. Evidence work/film-review-page.json. This validatesbrowserdecode only, nothumanjoin/material/physicalapproval.


## Actual idle-to-wave join review and Linux integrated pass

Added reusable review-film-sequence.py using existing sequence assembly method: exact original24fps clips/order/count, fixed whole-frame fit, no crop/registration/interpolation/crossfade/hold trimming. Manifest stages122v28idleframes at85percent plus133wave/emptyreviewframes at100percent in common1280x720;255frames10.625sec. ReviewSHA4e2f15c44767e382bbb4091d8e0f5f166676c5c3062693757047474015b1d662. Actual ending-to-opening join IoU.98834/visibleRGBdifference3.457, notvelocity/humanproof. Allframes20reservepass, min23.33percent; exactblacktail verified>=8frames afterfinalencode.

Reviewpage now puts fullidle→wave→emptysequence first so the5.1seccut can be watched atnormal speed. Browsercheckpassed255frames0reporteddrops, plusroundtrip607andoldbatSFX125, allendedmuted/noautoplay, noerrors/390pxoverflow. Existingoldbatpictureclearlysuperseded. Newwaveandjoinstillnotpublic/approved. Reusingoldspatialstudieswaschecked: v30toy-materialrejected, v25armsstillhumanoid, v26is2.5Dcompositearrivalnotnewart; nofinishedfilmcountinflation.

Exact5000d83 CI39472111843 showdeskjob118798782036 completedSUCCESS. Completedlogwork/showdesk-pass-39472111843.log confirmsbothChromium/LinuxWebKit5recoverycycles, fullfilmrehearsals, bothintegratedsoundtests, ownerWebAudiofixture and actuallocalcloudfilmphonepairing/Stop/Restore. NativeofflinealsoSUCCESS. BroaderWebKitandregressionstillrunning. No appdecoderfixclaimfromfixtureselection; priorLinux failuretargeting remains diagnostic. Productione44697a unchanged untilallchecks on5000d83 pass. Sourcejoinfollow-upkeptlocalbeyondremotehead.


## Integrated20cycle silent playback soak

Existing scripts/soak-showdesk.cjs run session35125 completed20/20actualcute→scary→cutecycles (60cue transitions) on current source runtime. Eachcycle retained2ownervideos,0owneraudioelements,0outputmedia; effectcount0, videosmuted. FinalBlackoutoutputpixels andownernavigation stopped/blanked output passed, no pageerrors. Heap samples are observations, not leakproof; this run neverenabledSFX and doesnotbyitself count AudioContexts. Earlier dedicatedrealWebAudio/output tests prove those separately. Evidence test-results/showdesk-soak-progress.json and unique work/showdesk-soak-*.json. No additionalcredits orproductionchanges.

Exact5000d83 CI39472111843 nowhasWebKit,showdesk,native-avatar-offline SUCCESS. Onlyregressionjob118798781975 remainsauthoritativelylive inRun npm test (started18:09:34UTC); at18:16UTC it hadnotreached25minutejoblimit. Do not restart/cancel for waiting. Allcurrentrequiredchecks stillnotcomplete, productione44697a remains. Localheadde228cc containsunpublishedsource-reviewfollow-ups beyond5000d83; no newruntimecandidate push.


## Rear three-quarter material guide v3

One built-inimagegen edit from scaryfrontv34 produced rear135degree guidewisp-rear-three-quarter-v3.png, SHA939f164c809d4ac4de6f72251d50d067d1d6e845d455790e8a3bf07932fae19d. RGB1672x941 onblack (nottransparent), originaldefaultimagepreserved, fullprompt-v3.txt saved. Viewshowsroundheadbulbundercrest, nofacevisiblethroughback, asymmetricforeshortenedattachedarms andfinevaporinstead ofv2'slumpyoutline. Clawtipsremainbright/hard; singleviewdoesnotprovevideo/turn/identityconsistency. No publicpromotionornewRunwayturnspend.

RawRGB4marginsleft37.02/top16.90/right36.18/bottom18.17percentpass15butfail20target. Requireadditionalfixedwhole-frame staging beforeusingasendpoint, notanothermaterialgenerationjustforframing. This is acandidateguide, notfinishedturnaroundoranimation. Fullgoalstillrequiresrealbacks/swoops/depthacting andactualseamreview. Currentexact5000d83 CI39472111843 finalregression remainsauthoritativelyrunning; other3passed. Productione44697a unchanged.


## Guided rear turn preflight and capped test

Generalized existing prepare-film-morph-anchors.cjs provenance text/count so a painted-reference is explicitly distinguished from decoded actualfilmframes. Stagedv3rear through actualStageCompositor at85percent1280x720, allRGB4/8/16margins>=21.81percent. StagedSHA966c4ceb86dfe48be6af55c4d1b75873fd5ee2b3ba60b3a29e66abcd770c31a8; no repaint/crop/pose registration. OriginalRGBart preserved.

Runwaymetadata-only upload first returnedchatgpt_missing_file_param (noasset); usingdocumentedfileparameter withactualprojectPNG completedoneupload. One5secondguidedturntask84153e6b-d7b8-42c4-9ac2-be3125bbab40 submitted inworkspace1709631,85observedcredits19519→19434. Firstendpointactualscaryv35endstaged, lastendpointnewdesignedrear135degreeguide. This differs materially from priorfront-only faileddepthdeparture; tests correctfaceocclusion andmaterialthroughmiddle. No furtherturnpaidretry unless actualreviewjustifiesdifferentinput. Pendingrender, notfinished/public, loop ordeparture. AllnewfilesexcludeprivateassetURLs.

CI39472111843 exact5000d83 finalregression stillconfirmedrunning; other3SUCCESS. Preserve samehandle andproductione44697a. Localartpreflightfollow-upmustnotcancelitsremainingjob.


## Fullregression terminal teardown failure; targeted repair

Exact5000d83 CI39472111843 terminalFAILURE: other3jobsSUCCESS, fullregressionjob118798781975 failed at forget_key.cjs3 after mostlegacytests passed. Completedlogwork/regression-failure-39472111843.log shows route.fetch Storage.getCookies cannotfindcontext duringbrowserclose; an in-flight status fixture was notdrained. Added awaitpage.unrouteAll({behavior:wait}) beforeassertingerrors/closingbrowser. No catch/errorfilter, credentialcleanup assertion removal or applicationkeychange.

Default8770testattempt reportedconnectionrefused; didnotrestart it or access/reload realcredentials. Startedownisolatedserver18998 with explicitnon-secret syntheticproviderplaceholder so startupskipsMacKeychain load. Allprovider/deletionroutes remainmocked. Two consecutive realWebRTC/syntheticaudio forgettests passed with drainedroutes: cleanupbeforedelete, mictracks0,peerclosed, UIforgotten,idle/rest. Shut downonlyown62313fixture after tests. This supports fixtureteardownfix; newLinuxfullCIstillrequired.

Guidedturntask84153e6b completedonce85credits:121frames24fps1920x1080silent, SHA17bfe3f95d8f1123f68fa4908845cf2ce867dba90d69f1d798a9e0e052e058d2. All20reservepass(min21.48top); actualchanging side/rear views and correctfaceocclusion improved. Croppedmiddleframes54to75 stillhaveopaquehead/neck/shoulder/arm surfaces, so NOTfinishedmaterial. Retainmotionreferenceonly; no paidretry. Actual242framescary→turnreview b99025b6cf3e794626f35ef382823c81a25a4af19a5f116e10c325c3ec469d2b, joinIoU.98991/RGBdiff3.468doesnotprovevelocity/materialacceptance. Newsourceassetsremainexcludedfrompubliclibrary.


## Hosted preview exact-build sound proof; side-material still checkpoint

Extended test-hosted-showdesk.cjs with optionalNetlify-previewbase, exactGit/hashgate, actualexplicitSFXenable/localWAVdecode, 1ownerAudioContext/0outputcontexts andBlackoutvoicecancel. Reportseparatespreviewfromproduction. Testedrealhttps://deploy-preview-9--hauntedpuppet.netlify.app exactb5c5dbf6530f926c99de61017c73fb2721cbb9a3 built18:27:59.533UTC; all10publicallowlisthashes match. Actualcute/scary/cute, silentoutput, soundenable/import/manualplay, Blackout, ownernavigationdispose, mobileoverflow andnocapture/providerrequests PASS. Evidence test-results/showdesk-hosted-preview.json. Audiofixturezero-level; nothumanacoustic orphysicalphone/projectionacceptance. Doesnotclaimhostedphoneauthpairing. Productione44697a unchanged.

Extractedactualguidedturnframe60 at2.5sec, thenonebuilt-inimagegen materialedit (notnewRunwaymotion). side-frame60-vapor-edit-v1.png SHA210fb9bcc51f0677db03b1c4ee8597b8d20f733c3b77ab35de578d1fd0a6d3ab, RGB1672x941, allrawRGB4margins>=22.10percent. Variableporousfogreplacesopaqueskull/neck/armfill; profilesocket/fingersposebroadlyretained. MaskIoU.9086afteruniformresizingisnotexactregistration ortemporalproof. Fullpromptandoriginaldecodedframepreserved. Humanmaterialquestionpending; nofull-videoeditsubmittedorapprovalinferred. Ifusingavideoeditlater, preserveactualtimestamp2.5andreviewallframes/endpointsagain. NoadditionalRunwaycredits.

CI39474937902 exactb5c5dbf isconfirmedlive allfourjobs. Prior39472111843wasactualterminalkey-testteardownfailure; p.unrouteAll(wait)targetedfixpassedtwolocalruns. Keepcurrenthandle, do notpushunrelatedstill/testfollowupsforwaitingalone.


## Actual steady-state Mute control mutation fix

CompletedLinuxWebKitjob118808340278 inCI39474937902 failed again inpuppeteer_voice.cjs. Retainedlogwork/webkit-failure-39474937902.log shows pointerdown/up BOTHtargetpuppetMute, but NOclickevent; immediatepostclickstate stilllive/mutedfalse/micenabledtrue. SteadyupdatePuppeteerUI rewrotebuttontext andaria-pressedevery50ms. NewstrictMutationObservertest reproduced6unchanged-controlmutations in180ms onoldcode, failingbeforetheclick (Chrome).

Productionfix assets/show-controls.js nowsetsMute disabled/text/ariaonlywhenvaluesactuallychange, preservingthebutton'scontentsbetweenpointerpress/release. No forcedclick, syntheticdispatch, retries, errorfilter or gateweakening. BothpinnedChromeandMacWebKit full6-caseAudioWorkletpuppeteer tests PASS with0steadyMute mutations andactualpointer mute/unmute, silence/recovery, formpresets, outputsilence, cleanup/errorcases. Publicbuildprivacy/importcheckPASS. This provesunnecessaryDOMmutationremoved and localbehavior; causalLinuxclickresolution stillrequiresfreshCI.

Newfixisunpushedbeyondcurrentb5c5dbf. CI39474937902alreadyhasterminalWebKitfailure, showdesk/nativeSUCCESS, fullregressionstilllive. Retainthatremainingjobfornewforget_keydrainverificationbefore superseding ifpossible. Hostedpreviewevidenceatb5doesNOTincludeMuteproductionfix. Productione44697a unchanged. NoactiveRunwayjobs; sideframeporousfoghumanfeedbackpendingbeforefullvideoedit.
