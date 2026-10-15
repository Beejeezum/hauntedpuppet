# Production ghost: deliverable contract

The next asset is one fully rigged character, not another mouth-image batch.

## Visual references to approve

Front, three-quarter and profile references of one consistent ghost. Expression references for curiosity, amusement, suspicion, sinister intent and anger. Establish skin, eyes, hair, neck/shoulders, clothing, spectral edges and light direction. The previous portrait can be a likeness reference, but it is not a ready 3D model.

## Required technical delivery

- Source Blender project plus a self-contained GLB with embedded textures, facing +Z, neutral pose at origin.
- Head, neck and shoulders; eyeballs; upper/lower teeth and tongue. Jaw-dependent teeth must move with the jaw rather than remain floating in place.
- Facial topology and authored morphs with compatible ARKit-style names. Minimum loader requirements: jawOpen, mouthClose, mouthFunnel, mouthPucker, mouthStretch_L/R, eyeBlink_L/R, browInnerUp, browDown_L/R. Full production coverage should include the remaining cheek, lip-roll, lip-raise/depress, squint, wide-eye, gaze and tongue controls used by app.js.
- Identical topology for every face shape. No baked talking animation that overrides the live controls.
- Test simultaneous jaw open + funnel, bilabial closure, smile + speech, and blink + anger. Skin and teeth must remain stable in combinations.
- Character-specific facial influence tuning. The current application weights are calibrated only as an evaluation pass on the sample head.
- Optimize and benchmark against the actual Mac and projector; establish a reliable frame-rate target before increasing geometry or texture resolution.
- Include clear usage and modification rights for model, textures, hair and any derived source assets.

## Acceptance encounter

“Oh… you can see me? Most people walk straight past. Tell me—did you bring any candy?”

Perform curious, amused and ominous versions. Check a silent pause, M/B/P lip closure, a rounded vowel, eye contact, a blink, a natural ending, and interruption midway through a sentence. Approve the look on the actual projection surface in darkness before commissioning a larger library.
