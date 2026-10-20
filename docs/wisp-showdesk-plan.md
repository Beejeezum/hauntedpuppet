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
