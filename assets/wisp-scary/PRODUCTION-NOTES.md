# Scary Wisp painted asset production

The scary character is an original raster-painted alternative to the approved cute Wisp. All generated illustrations use the built-in image generation tool, with the approved cute Wisp as the identity/material reference. The runtime never draws a procedural substitute character.

Transparent source illustrations, atlas registration, mouth selection, gaze and blink are described by `asset-manifest.json`. The renderer consumes the same speech clock and mouth weights as the cute Wisp. Acoustic live estimates remain acoustic estimates; the artwork does not make them phoneme accurate.

Transformation is a theatrical crossfade with squash/stretch and motion, not a three-dimensional turn or an interpolated anatomical morph. The laptop remains the sole audio owner.

## Delivered rig

- Four alpha-painted articulated pieces: body core, left claw arm, right claw arm, curled tail.
- Twelve mouth paintings: rest grin, M/B/P, A, E, O, U, F/V, L, S, CH, TH, and fanged roar.
- Ten eye performances: neutral, curious, delighted, concerned, closed blink, half blink, left, right, genuine downward gaze, genuinely sinister cold stare.
- The eight standard eye poses and twelve mouths are uniform atlases. Pixel cell boundaries are rounded independently because image generation produced dimensions that are not exact integer multiples of the grid.
- `wisp-assembled-transparent.png` is the canonical native-size 1024 × 1536 assembly, with sinister eyes. It is exported by the renderer without repainting any component.
- Default scary idle uses sinister eyes. A surprise/scare/roar action requests the fanged mouth and sinister eyes; live/aligned speech always retains mouth ownership.
- The rig accepts the cute renderer's speech/state/acting contract and twelve authored choreography actions. Arm/tail pivots remain attached to the body root, including full spins and anisotropic squash/stretch.
- Interruptions settle in 0.26 seconds. Switching actions blends the last pose into the new choreography over 0.22 seconds. A full rotation recovers through its shortest equivalent angle.
- Uneven idle attention includes downward visitor checks. Eye changes are covered by short blinks. Reduced motion attenuates idle motion and authored choreography separately.

## Validation and practical limits

`tests/scary_wisp.cjs` checks 120 facial combinations, ten speech mappings, honest acoustic labeling, choreography containment, interrupted recovery, action replacement, and the roar reveal. `verifyEnvelope()` checks 1,944 combinations of rotation, stretch, and arm extremes with the runtime fit policy. The rig creates no audio or microphone resources.

All PNGs have native alpha. The final native assembly has maximum alpha 0 along its four outer edges; generated source component edges have alpha at most 2/255, so there is no opaque background or rectangular border.

The pieces are generated paintings registered by affine transforms, not a hand-sculpted skeletal or mesh deformation rig. Extremely wide arm rotations can reveal texture/lighting variation at shoulder overlaps; production choreography uses a conservative 0.65 arm multiplier. It is a front-facing 2D character. Twirls are an authored planar spin, not a fully rendered backside. Physical projector, visitor viewing distance, and venue brightness still require rehearsal.
