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
- Inochi Creator is a candidate for author-controlled texture deformation and face parameters. Validate actual Wisp shoulder/hand bending and parameter integration before choosing it; the current app has no Inochi scene importer. See [official documentation](https://docs.inochi2d.com/en/latest/).
- TouchDesigner is a candidate for projection composition, reactive effects and external show control. It is not a replacement for character art/rigging. Prototype one output/control bridge before introducing it into the show. Its [license rules](https://derivative.ca/UserGuide/Licensing) distinguish personal/noncommercial use from compensated work. No purchase or migration has been made.
- Retain the existing browser as the control/voice system during pilots. Define a bounded character-state bridge rather than duplicating credentials, microphone ownership or conversation logic in a graphics tool. External output must preserve Stop/Blackout and remain silent unless deliberately assigned laptop audio ownership.

A pilot passes only if it renders the same approved Wisp with visibly better joints/morph/acting, meets measured target cadence with the operator running, supports required controls and has a documented asset/export/license path. A software feature list or demo of a different character does not pass.
