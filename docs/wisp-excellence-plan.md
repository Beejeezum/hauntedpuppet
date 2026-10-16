# Haunted Puppet attraction excellence

## Working goal

Build Haunted Puppet into a polished contemporary interactive front-door attraction: a beautiful, fully expressive painted Wisp that feels alive, responds naturally to guests, transforms convincingly between friendly and frightening, and gives an operator effortless control over a reliable projection show.

This is the active tracked goal, explicitly authorized by the user after the bounded quality pass. Desktop controller software, animation authoring tools and graphics packages are in scope when they demonstrate a material improvement. The platform is a means to the experience; the current browser renderer is not a fixed requirement. Preserve working features and approved art while replacements are evaluated independently.

Success requires character, acting, voice, interaction, operator experience, presentation and reliability together. Software checks cannot approve visual quality. The existing candidate has not reached the requested quality bar; an incremental deployment does not complete this goal.

## Execution and acceptance across the attraction

| Track | Deliverable | Acceptance evidence | Current gap |
| --- | --- | --- | --- |
| Character identity | Approved cute/evil hero designs, silhouette, anatomy and complete turnaround | Reference comparison at front, three-quarter, side and rear | Rear shoulder construction and incomplete opposite-side views |
| Rig and acting | Articulated hands/arms, independently timed face, continuous full-body life, authored anticipation and follow-through | Full-speed and slow-motion 15-second reel plus interrupted performances | Single drawn hand pose with local digit flex; layered joins and incompatible intermediate morph contours |
| Material and atmosphere | Painted depth, spatial transparency and spirit-origin effects with coherent attachment | Close-up and guest-distance review against black, turning and bending | Living skin shipped; needs stronger art-integrated all-angle review |
| Voice and persona | Distinctive expressive friendly/scary voices; concise doorstep-aware dialogue | Genuine conversations covering costumes, groups, silence, interruptions and goodbye | No new genuine-provider acceptance in latest pass; compare voices by listening |
| Guest interaction | Notice, greet, listen, react, recover and return naturally to living idle | Rehearsed guest scenarios and state-transition regression | Technical paths exist; full visitor rehearsal outstanding |
| Operator experience | Clear laptop performance controls and silent paired phone, immediate Stop/Blackout | Timed operator rehearsal with recoverable mistakes and no guest-facing UI | Assess current controls against actual show tasks before adding more menus |
| Projection and sound | Correct placement, mapping, brightness, readable silhouettes, intelligible voices | Actual house/laptop/projector/speaker rehearsal and footage | Physical projection evidence unavailable; browser renders are separate |
| Reliability | Sustained target cadence, bounded resources, reconnect and failure recovery | Target-hardware measurements, evening-length soak, failure drills | Latest full CI green; older 20-minute soak does not establish evening-long reliability |

Work in reviewable slices. First repair the character construction and morph defects that remain visible in footage. Pilot alternative tooling with the same Wisp artwork and performance before committing to migration. Then integrate the winning character path, refine live interaction/operator workflow and run end-to-end rehearsals. Do not expand the animation menu before the core performance is convincing.

## Non-negotiable visual acceptance

- **Whole-body life:** head, shoulders, arms, wrists, hands, torso, sides, crest and tail have coherent overlapping motion. The silhouette and volumes change continuously within clear intentional poses; moving the entire image does not satisfy this gate.
- **Apparitional material:** meaningful spatially varying body transparency, readable face, painterly surface detail and body-attached wisps. Effects must turn and deform with the spirit. No rectangular haze layer or generic image wobble may substitute for body animation.
- **Dimensional construction:** convincing side/rear views, consistent proportions and texture, correct arm/torso overlap and no visible cutout joins or collapsing joints. The five-view candidate remains incomplete for arbitrary full turns.
- **Expression and personality:** independent eye/lid/brow/cheek/mouth acting, expressive hands and distinct friendly/scary behavior. Listening, speaking, noticing, playing and departing should read without interface labels.
- **One continuous transformation:** cute and evil are the same character changing shape. Intermediate eyes, mouth, fingers, skin and silhouette must remain coherent; doubled contours and fading between incompatible drawings fail this gate.
- **Fluid playback:** target sustained 60 fps on the intended laptop with operator and projector together; report frame intervals and stalls. Quality should hold through interaction, interruptions and idle. A video encoder's requested frame rate is not proof.
- **Finished audience experience:** strong readability at street/doorway distance, quick voice interaction, a living return to idle after goodbye, expressive operator control and immediate Stop/Blackout. Physical projection and genuine voice tests remain separate acceptance steps.

A release can be a documented incremental improvement while the goal remains unfinished. Do not declare the character production-complete until visual review against approved art, full-speed/slow-motion recordings, live interaction and on-site projection satisfy these gates.

## Acceptance sequence

One repeatable 15-second sequence: notice a guest, greet, listen, speak a short line, wave, turn, transform to evil and recover to friendly. Speech rehearsal is explicitly synthetic unless a genuine provider test is performed.

## Quality gates

- Identity: consistent silhouette, proportions, hand design and facial placement across both forms and turn views.
- Art: approved paintings remain the standard; no procedural character substitutes. Newly generated drawings require visual review, not just successful file loading.
- Curvature: inspect strong bends at full projected size; reject angular elbows, collapsing joint volume and abrupt silhouette changes. Require paired playback measurements before increasing mesh density.
- Articulation: head, torso, tail and hands have distinct timing. Arms must bend coherently; no rigid whole-body rocking as the main performance.
- Transitions: inspect intermediate frames, not just endpoints. Reject double limbs, detached hands, face sliding, texture smears and sudden silhouette changes. Prefer authored breakdown drawings for incompatible silhouettes.
- Acting: anticipation, readable holds, arcs and follow-through. Listening looks different from speaking; idle leaves room for intentional stillness.
- Face: independent eyes, brows and mouth; face disappears correctly on rear views; speech survives gestures.
- Interaction: interrupt gestures and speech, Stop, farewell-to-idle and friendly audience reset without stale state or jumps.
- Reliability: Chromium/WebKit, resource cleanup, silent phone/projector, painted fallback, build/import validation. Record evidence and distinguish mocked provider tests from genuine audio and physical projection.

## Work order

1. Capture baseline sequence and identify worst intermediate frames; measure existing transition continuity.
2. Improve pose registration and articulated secondary motion with deterministic, frame-rate-independent controls. Add focused interruption/deformation checks.
3. Produce and review the smallest useful set of painted transition assets. Reject inconsistent drawings; never count asset quantity as quality.
4. Refine sequencing, facial registration and transformation; review full-speed and slowed render recordings.
5. Run relevant regression tests, deploy validated changes using existing Git workflow and verify hosted assets and runtime.

## Release decision

Keep this a selectable candidate until the visual gates pass. Preserve the previous renderers. If artwork limits prevent a convincing transition, record the exact defect and next required drawing rather than concealing it with glow or claiming completion.

## Evidence and handoff

Store browser render evidence under outputs/wisp-live-rig-proof. Track implementation, test results, rejected approaches and next actions in work/wisp-excellence-status.md. Physical projection footage is unavailable unless the user supplies it.

## Desktop tooling pilot policy

- Blender is an authoring candidate for complete dimensional construction, intentional topology, corrective shapes and painted materials. Grease Pencil armatures can deform drawn strokes, but they do not automatically rig the existing raster paintings or export a finished interactive character. See the [official armature documentation](https://docs.blender.org/manual/en/5.0/grease_pencil/modifiers/deform/armature.html).
- Inochi Creator was evaluated for author-controlled texture deformation. The official v0.8.6 portable macOS release crashed during startup on this Mac before loading any Wisp project (EXC_BAD_ACCESS in runtime initialization). The test copy was disabled after the user reported repeated dialogs; do not relaunch it. No scene importer or runtime migration was made. The [official Session repository](https://github.com/Inochi2D/inochi-session) also labels its current development branch as not ready for production. This pilot did not pass; the documented workflow alone is not proof of suitability.
- TouchDesigner is a candidate for projection composition, reactive effects and external show control. It is not a replacement for character art/rigging. Prototype one output/control bridge before introducing it into the show. Its [license rules](https://derivative.ca/UserGuide/Licensing) distinguish personal/noncommercial use from compensated work. No purchase or migration has been made.
- Retain the existing browser as the control/voice system during pilots. Define a bounded character-state bridge rather than duplicating credentials, microphone ownership or conversation logic in a graphics tool. External output must preserve Stop/Blackout and remain silent unless deliberately assigned laptop audio ownership.

A pilot passes only if it renders the same approved Wisp with visibly better joints/morph/acting, meets measured target cadence with the operator running, supports required controls and has a documented asset/export/license path. A software feature list or demo of a different character does not pass.

## User-supplied technology screening: three-mediapipe-rig
Reviewed https://github.com/bandinopla/three-mediapipe-rig at3ab212719826cb762d08b27cd987dba41d96701c (package0.1.41). Source/package declareMIT; peers Three^0.183.1, MediaPipe tasks-vision^0.10.32 andfflate^0.8.2. Published0.1.41 was subsequently installed only in thread work/three-mediapipe-pilot with its exact declared peer versions and install scripts disabled. Production package/lock/vendor files are unchanged. Node ESM and Chromium browser import pass; no inference/camera/retargeting acceptance yet.

Relevant: live body/hand/face retargeting, custom bone maps, frame-rate-dependent smoothing; PoseCap records webcam/video body performances asGLB clips. Existing Wisp already uses local worker MediaPipe face tracking, so prioritize additive upper-body/finger channels and reusable captured acting. A complete Three skeleton is required for direct binding; painted Pixi rigs require an explicit Wisp control adapter. Four-digit ghost hands and legless body need intentional mapping, not default humanoid assignment.

Keep capture→normalized performer state→Wisp rig/animation director separate from voice and show transport. Test one recorded upper-body performance first, with neutral calibration, confidence loss→idle, frame-rate stability, Stop/Blackout and disposal, and compare against current face-worker path. Inspect lifecycle/main-thread inference before adoption; raw source creates debug DOM/RAF loops. MeshCap projects captured human face imagery onto canonical topology; that output is not an automatic fit for approved painted Wisp identity. This is a promising motion input/authoring candidate, not an asset-quality or seamless-morph solution. Sources: README.md, POSECAP.md, MESHCAP.md, package.json andsrc/tracking/TrackerManager.ts at the repository above.

### Motion-library import pilot evidence
The unbundled local Chromium import completed in193ms in one run, loading250localresources/~5.96MB; no external requests, camera/microphone calls or browser exceptions. This is module-load evidence only. Bundle/tree-shake before deployment; avoid importing the full Three Addons graph unbundled. Declared peer versions do not match production Three0.186.1/MediaPipe1.1.1, so do not directly install it into the show.

Actual Wisp GLB has24bones, including UpperArm/Forearm/Hand and four single-joint Digit0–3 bones per hand; the library expects five human fingers with three phalanges. It also expects MediaPipe-named facial targets while Wisp uses names such asJawOpen/Blink_L/BrowUp_L across separate meshes. A semantic adapter must aggregate finger curls and map facial values instead of repeatedly binding several human joints onto one ghost bone. Candidate mapping: human thumb/index/middle→ghost0/1/2; combine ring/pinky deliberately forghost3; ignore legs, retain tail/crest/float as character-authored motion. Must test missing landmarks, calibration, handedness and tracking loss→idle before any live-camera adoption.

## Approved moving reference and vapor correction (2026-10-16)

The user approved the full-body acting quality of the five-second Runway sample at `../wisp-vision/wisp-wave-runway-v1.mp4` as the motion benchmark. It is generated video, not a controllable rig or live-app acceptance. Preserve its dimensional body bends, articulated gestures, facial acting and follow-through while correcting changing fingers and out-of-frame motion.

The user explicitly rejected the persistent curled lower-body tips: they read like fish fins or a decorative solid tail. The lower body must instead disperse into spatially varying translucent FOG/SMOKE: soft expanding volume, shearing wisps and detached dissipating fragments, with no fixed spiral silhouette. Transient turbulent eddies are acceptable; persistent sculpted curls are not. Keep the face and hands readable while the lower torso loses coherent surface into vapor. Review this in motion, including the final settled pose, against black and the intended projection surface.

### Full effect framing gate
Reserve at least15% of final width/height on EACH edge for the complete visible character AND emitted fog throughout every animation, morph and interruption. A root/mesh box alone does not satisfy this requirement. Include hand extrema, crest vapor and detached dissipating fragments; use a stable shot envelope to avoid per-frame scale pumping. Smoke must fade naturally before reaching the safe boundary. Previously clipped pixels cannot be restored by padding a finished clip.

`source/wisp-performance-reference/check_framing.py` decodes every frame of black-background reference videos and reports15% margins at max-RGB thresholds8/16/32, rejecting isolated fragments smaller than8pixels as codec noise. This detector is evidence about encoded visibility only, not physical projection or smoke that was cut off upstream. Approvedfogv2 fails121/121frames at threshold8: approve its art/motion, reject its framing.

## User rejection: lower-body continuity
The latest buffered v4 take passes encoded framing but the user explicitly rejected its ending because the lower body disappears. It is NOT an accepted complete animation asset. Soft fog may shed and disperse; the recognizable core lower-body silhouette must persist through ordinary idle, listening and gestures. Only an explicit vanish cue may remove the character. Approvals of v2 softness/acting remain visual direction; do not count a margin pass as anatomy/continuity approval.

## Credit discipline
Runway remains authorized when useful for targeted motion/asset creation and downstream graphics workflows. Reuse approved outputs and local tests first. Give each paid generation a specific unanswered visual question and stop redundant exploratory reruns. Four initial takes used240existingcredits. No additional Runway generations were made during the local framing integration.

## Evidence-led character path decision
The user-approved fog material and articulated motion remain the standard; the current native3D sculpt/material does not meet it. The rounded-sculpt and surface-transmission studies were visually rejected, despite technical render success. Do not spend more iterations lowering opacity or adding rim effects to that asset and count them as art progress.

Prioritize a bounded image-driven character pilot against the same requirements: the2-credit prerecorded speech test preserves the approved fog identity after correcting the service's aspect stretch, animates the mouth/face, and retains its lower body in the reviewed ending. All97frames pass the final15%buffer after local whole-shot fitting. This is not live-chat or full-body/voice/morph acceptance. A private realtime character is prepared; its microphone test awaits explicit user permission because the service records calls. Preserve the current voice/controller/projector/fallback paths until a replacement passes actual visual, interruption, cost, latency and integration gates.

The new scary-fog reference is a candidate endpoint, not approved final art. It matches the friendly material direction but needs character/pose registration, lower-body continuity and a controlled cute→evil→cute performance. Runtime shape transformation, native operator reactions, independent face/body control and persistent core anatomy remain mandatory; a pair of attractive videos does not complete those requirements.


### Shoulder construction evidence and next constraint
The local full-turn fog study retains soft material across five source views, but arm/torso joins remain visibly separate. Broadening shoulder alpha and fore/back partition ramps produced only small visual changes and is rejected as the seam solution. Correcting source lighting is necessary; it does not alone constrain geometry.

Live2D Cubism's official Glue documentation describes binding overlapping ArtMesh vertices with per-vertex influence, including torso/shoulder examples: https://docs.live2d.com/en/cubism-editor-manual/glue/ (reviewed2026-10-16). This supports testing a shared shoulder surface constraint rather than relying on transparency alone. It is a technique reference, not evidence that Cubism is installed, integrated or licensed for this project. A native pilot should attach a small root region to the deformed torso, release smoothly into arm skinning, and preserve arm volume and fore/back ordering. Compare front/wave/profile/rear and interrupted motion with identical artwork. Reject if it creates collapsing elbow geometry or a disappearing upper arm. Keep the current runtime untouched until actual render evidence demonstrates a benefit.


### Current fog arm geometry gate (2026-10-16)
Actual runtime mesh audit now detects flipped triangles in sampled painted regions, separate from empty geometry retained for old evil textures. At front,11left-arm triangles with sampled source ink invert; profile14left/8right. Continuous-distance linear binding makes several angles worse; the existing polar experiment leaves counts nearly unchanged. Neither is adopted. Constant-weight ring tests and margin passes are insufficient evidence for spatially varying skinning.

Next deliverable is a mesh authored for the new arm painting, with explicit joint transition zones and corrective elbow/shoulder shapes. Evaluate actual painted triangles, connected shoulder silhouette, digit readability and native wave/turn recordings before integrating more asset views. Source-alpha classification samples seven points per triangle and can miss thin fragments; retain visual review. Do not spend another asset generation or broad formula sweep to avoid this construction step.


### Full-character context checkpoint
The limited source0..45evil turn now runs with native face/arms/body acting. Numerical triangle corrections do not prove a connected shoulder silhouette: actual45review retains a broken near shoulder and pasted mouth. Prioritize an attachment check against actual torso paint/core and face surface projection before generating further turn views. An optional15degree eye-surface normal improves far-eye readability versus35in controlled full-character renders; it is unapproved and notselectedbytheapp. Rear turn art and turned cute/evil form morph remain explicitly unsupported. Full native/browser evidence remains separate from on-site/operator/genuinevoice acceptance.


### Startup and preview regression clarification
Compositor-ready is not character-ready. The app projection test now waits for artwork readiness and first visible paint before performing cues; an explicit held-projector-PNGfixture proves the earlier ready/blank gap. CIWebKituses this controlled startup case without relaxing pixel-margin or visibility assertions. The voice preview sign-out mock now changes the simulated status server to cloud/unauthenticated as well as sending the status event; a server that kept reporting connected local status was an inconsistent sign-out fixture. Localchecks pass; futureCIandgenuineprovider/physical acceptance remain separate.
