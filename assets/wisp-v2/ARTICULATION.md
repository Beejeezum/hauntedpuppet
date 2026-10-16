# Articulated cute V2 production sources

`articulation.json` registers a new arm-free body core and two separate painted arm/hand components. The continuously attached lower torso and curl wisps remain part of the core. They are not an extra rear-tail sprite.

The body-core edit retains the 1024 × 1536 source canvas and face coordinates. As a useful landmark check, the two bright cheek-mark centroids shifted by less than 0.6 pixels compared with `cute-face-free.png`, so existing eye/face registration remains usable. Fine generated texture is not claimed to be pixel-identical.

The arm edits retained the reference's hand design, but generation changed their scale/placement. The manifest therefore supplies measured affine transforms instead of pretending they are exact registered extractions:

`target = targetPivot + scale × rotate(rotation) × (source - sourcePivot)`

Layer action rotation should occur around `targetPivot` after registration. Source/target shoulder, elbow, wrist and palm landmarks are provided. The preferred overlap order is arms, body core, eyes, mouth, which hides the arm attachment padding under the core. Drawing arms fully over the body exposes rounded cap shapes; use soft joint blending if a different draw order is needed.

A native-size neutral assembly was inspected in `outputs/wisp-v2-proof/articulated-native.png`. Its silhouette is coherent and the shoulder seams are usable as overlap joints, but extreme elbow/shoulder deformation still needs live action testing. These PNGs alone are not a skeleton, muscle solver or cloth simulation. The renderer must bend the limbs and follow the body's attachment points rather than merely rotating a whole flat arm card.

## Integrated body motion

The manifest identifies the continuous lower-body region and an upper attachment band. Keep the face/head registration stable and distribute lower-torso bend, squash and inertial lag through that volume. Move the shoulder attachment with the torso. Do not detach the lower curl into a separately orbiting tail, or use an all-over water ripple that slides the painted facial planes.

## Five-angle turn source

`cute-turn-five.png` / `cute-turn-five.json` adds actual front (0°), front-three-quarter (45°), right profile (90°), rear-three-quarter (135°) and back (180°) paintings. The side view contains one eye; the back contains no face. The silhouette heights are 637–641 source pixels.

The generator did not respect perfectly equal source gutters on its first or revised sheet. Explicit safe rectangles avoid cutting a faint hand fringe into the neighboring cell. Use the provided rectangles and anchors, not atlas-width / 5. Preserve common source-pixel scale; stretching every directional crop to the same width would make the profile unnaturally wide.

These five paintings are angular key drawings, not dense human-authored inbetweens or a full 360-degree model. Hands, wisps and facial perspective vary slightly between generated keys. Any mesh interpolation between them needs visual testing. Side and rear face artwork is baked into those cels, so live eye/mouth overlays need separate perspective registration before they can speak naturally in every orientation.

No original V1 or earlier V2 fallback PNG was overwritten. Exact generation prompts and PNG hashes are included alongside these assets.
