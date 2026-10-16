# Wisp production quality pass

## Working goal

Build Wisp into a finished contemporary entertainment character for a front-door projection: as appealing and coherent as the approved painted concept art, dimensional through its turns, continuously alive throughout its body, convincingly translucent and wispy, emotionally expressive, and immediate to interact with. Judge success by the visitor's experience and recorded visual results. Functional rigging and passing software tests are necessary foundations, not visual acceptance.

The earlier 16 October 11:10–14:10 UTC pass was a bounded improvement pass; its heartbeat is disabled and its visual acceptance remains incomplete. This revised brief captures the user's subsequent direction. It does not claim the existing candidate has reached animated-film or premium attraction quality.

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
