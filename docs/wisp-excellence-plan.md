# Wisp production quality pass

Working window: 2026-10-16 11:10–14:10 UTC. Goal: make one convincing painted character performance, then expand only after it survives review. This is an improvement target, not a claim of feature-animation quality.

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
