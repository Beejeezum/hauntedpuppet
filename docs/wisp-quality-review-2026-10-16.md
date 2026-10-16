# Painted Wisp production review — 16 October 2026

The replacement now uses a shared painted body, articulated arms and a live face throughout its performance. The user still finds the construction blocky; this is a working candidate, not an accepted final character. It remains the selectable **painted performance** character; the original painted and 3D options are retained.

- [Operator console with this character selected](https://hauntedpuppet.netlify.app/?character=performance)
- [Silent 15-second rehearsal and review slider](https://hauntedpuppet.netlify.app/assets/wisp-performance-studio.html)

## What shipped

Final small joint correction: bounded restoration of blend-area loss around elbow/wrist anchors, without adding polygons. Rest pixels and exact skeleton joints stay registered. Analytical right-angle cross-sections retain >95% of their radius; both browser engines pass all 273 rendered pose/morph samples and 601 interruption frames pass in Chromium. Paired 84.848-second playback measured 46.84/46.87 fps, median 16.9/16.8 ms and p95 33.5 ms under current machine load, with silent output, stable bounds and Blackout. This is not a controlled speedup benchmark or a sustained-60-fps claim. Larger art limitations remain.


One body connects five painted viewing angles through a contour mesh. The same shoulder, elbow, wrist and palm rig keeps moving during turns. Cute and evil share the body topology, with changing cheek/crest shape, matched arm paintings and larger claws. This is painted 2.5D performance, rather than an arbitrary 3D model.

The greeting has anticipation, flowing arm breakdowns, a clear hold and follow-through. The scary surprise has a separate two-claw reveal. Root movement, viewing angle and head roll retain momentum when a cue is interrupted. Departure turns back toward the audience before returning to idle. Wisps follow the actual projected palms and body spine.

Eyes, asymmetric blinks, brows and mouth retain independent inputs. Automatic attention moves the eyes before the head; webcam gaze also drives lid follow and iris perspective. Friendly brows and demon ridges share a centroid, axis and length during the morph. Mouth paintings share one aperture with a short transition between speech shapes. Floating-eyes mode retains the live eyes while the body disappears.

Projector startup now shows the active operator connection and a clear disconnected/blanked state. A rejected fullscreen request retains the setup instructions.

The renderer recovers after a restored graphics context. This was a real failure found during testing: the browser recovered while the character stayed unavailable. Recovery now redraws the painted body and face without reloading the operator page.

## Verification

Production code: `172b9b7db679da8ecd1c9de3fb9731232bd76b5e`; character checkpoint: `6f9afe7d9426b75095d9032dc705ab91b26a701b`. The hosted build reports this commit; downloaded body and demon-face PNG hashes match the repository originals.

| Check | Evidence |
| --- | --- |
| Actual painted skin | 273 rendered samples across all 13 routines, finite geometry, attached shoulders, bounded reach/stretch, both forms and fallback on a missing component |
| Turn continuity | Nonfolding correspondence through 91 sampled angles; continuous position and velocity at view boundaries |
| Interrupted acting | 601 frames at 60 Hz; the original 79 px stop-turn snap was removed; largest tested step is about 27 px during bold movement |
| Painted form brightness | Actual GPU midpoint checks; maximum measured error below 1.52 levels out of 255 |
| Brow preservation | Zero measured endpoint pixel error against original components in Chromium and WebKit; shared intermediate anchors |
| Face and input priority | Speech through gestures, independent blink/gaze channels, webcam lid follow, eye-before-head attention, reduced motion and friendly reset |
| Graphics recovery | Three actual loss/restore cycles in Chromium and WebKit, painted body/facial redraw and disposal without reviving an old renderer |
| Operator/projector | Hosted controls, Stop, native floating eyes, silent projector, friendly reset and all-black Blackout passed |
| Short paired soak | 84.334 seconds on this machine: about 66.87 render frames/s on each surface; 95th-percentile frame intervals 17.9/17.7 ms; five native surfaces and Blackout preserved |
| Longer studio soak | 180.16 seconds, stable body/texture/root references; 22 root children including retained fallback meshes |
| Full regression suite | Character checkpoint `6f9afe7` passed both jobs. Projector-feedback checkpoint `172b9b7` also passed both jobs; subsequent joint correction: **pending** |
| Twenty-minute paired retention soak | Previous character checkpoint: 1,200.049 seconds; no retained listener/node growth, net heap changes −45,512/+61,184 bytes, 18 live textures and 28 buffers per surface; silence and Blackout pass. Overlapping tests affected cadence: about 51.5 fps per surface, p95 33.4 ms. This is not the dense-mesh checkpoint. |

The face upload was reduced from 1,572,864 to 680,000 pixels. The shipped body retains 657 vertices and view UV buffers change only when the active pair changes. Original PNG resolution is preserved.

After the user reported blockiness, a denser body/arm experiment was tested and **rejected for release**. A 4,171-vertex body with 64×72 arm grids passed deformation and interruption checks, but paired playback measured only about 26.6 fps here. A smaller 1,305-vertex body/48×56 arm variant measured about 25.5 fps in a short run; the original control measured about 36.1 fps under the then-current machine load. These are sequential observations, not a controlled hardware benchmark, but provide no justification for shipping the extra geometry. Experimental commit ba31bc1 is preserved on experiment/wisp-dense-deformation and reverted on main by b27db64. Production remains unchanged by this experiment.

Static endpoint pixel comparisons had been insufficient evidence for moving-curve quality. The next production pass must combine artist-directed silhouettes, joint correctives and hand/view artwork with sustained frame cadence. Increasing mesh density alone did not establish a better character.

These are isolated browser render tests. Physical projection footage and a new genuine-provider conversation were not available for this pass. Voice regressions use simulated providers or included audio; acoustic mouth shapes remain estimates. Browser render cadence is not a guarantee for another laptop or projector.

Recorded opaque canvas footage was decoded and inspected at greeting, speech, turn, intermediate morph and scary hold. Its encoder produced about 28.5 frames/s despite a 60 frames/s request. It is visual review evidence, not the source of the live-render performance numbers. The earlier transparent capture had encoding fringe and was rejected.

## Remaining production art

The earlier 3D asset is also a prototype: smooth shading is already enabled, but it uses a voxel-remeshed, decimated sculpt and projected painting. A production rebuild needs artist-directed proportions, deformation topology, volume-preserving correctives and a complete texture unwrap. Adding polygons alone cannot supply those.


1. **Hands:** authored open, curl, point, cupped and closed poses, matching digit identities across cute/evil; per-finger controls and view-specific palm/back-of-hand artwork. Current fingers move with the painted hand, and claw extensions emerge through the texture morph.
2. **Complete turnaround:** opposite-side views for a full 360-degree turn. The current performance reaches the back and reverses. Hands remain camera-facing for readability.
3. **Shoulder depth:** refine profile/rear overlap paintings and folded-hand intersections. These remain the clearest cutout cues.
4. **On-site review:** check projected contrast, guest distance, framing and motion scale on the actual house surface, then review recorded physical footage.

The earlier short isolated paired test met the cadence target; the long concurrent test had slower intervals. The dense-mesh experiment was rejected, as recorded above. The strongest remaining visual gains are in the hand and side-view artwork. New art should retain the registered canvas and measured shoulder, wrist and face anchors; registration must be revised when proportions change.

## Authoring research and handoff

[OpenToonz Plastic](https://opentoonz.readthedocs.io/en/latest/create_animations_using_plastic_tool.html) is relevant for the next artist-side pilot: it connects drawings to deformable meshes and skeleton controls, including rigidity, angle bounds and stacking order. Its multiple-skeleton workflow can accommodate changing drawing silhouettes. This is an authoring option to evaluate; an OpenToonz scene importer was not added to the app.

[Inochi Creator](https://github.com/Inochi2D/inochi-creator) is another parameter-rigging authoring option. [Inochi2D's documentation](https://docs.inochi2d.com/en/latest/) describes real-time texture deformation driven by rigger-authored parameters. Browser/runtime compatibility would need a separate pilot before changing this project's renderer. No additional runtime dependency was installed in this pass.

The current source handoff is `assets/wisp-performance/`: `front-rig.js` and `limb-solver.js` own articulation; `body-views.js` owns view correspondence; `front-acting.js` owns authored joint tracks; `morph-face.js` and `brow-morph.js` own feature registration. Source PNGs, component bounds and generation prompts are in `front-kit/`; `asset-manifest.json` records inputs and limits. The runtime reuses pinned Pixi 8.22.0.

Continue from the existing native voice/webcam inputs and operator commands. Keep the laptop as the only audio/microphone owner, and preserve Stop, friendly reset, silent phone/projector and the loading fallback. Credentials and key-owning servers were untouched.
