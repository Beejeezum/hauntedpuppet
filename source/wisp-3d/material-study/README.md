# Painted material / UV construction study

This builder writes an isolated editable Blender/GLB candidate. A derivative with the localized shoulder correction was promoted in e130bdb; see production rig.json for the selected source. The approved paintings remain preserved. The candidate is a cleaner base, NOT finished character art or a live replacement.

## Source and reproducibility

- `ivory-paint-v1.png`: unchanged built-in imagegen original `exec-3f866a6c-e921-4f54-80f9-44b1f69e738c.png`. Reference: approved `assets/wisp-v2/cute-body-core.png`, used only for warm pearl-ivory color and fine stipple.
- Prompt: seamless opaque edge-to-edge square albedo paint swatch, warm creamy ivory/off-white pearly stipple and soft layered brush grain, restrained cool pearl-blue/peach variation, near-uniform edge brightness; no ghost/body/face/outline/blue curls/large spots/dark shadows/baked directional lighting/plastic/glitter chunks/text/checkerboard. Actual1254×1254 RGB. Opposite-edge mean RGB differences3.22/3.64 of255; near-uniform, NOT exactly periodic. Texture is preserved without raster editing.
- `build_study.py` opens the existing source scene, creates a smart-projected island UV map on the body, assigns this dedicated paint texture to the existing skin material, packs it and saves a NEW scene/export in this folder. It does not run the original geometry generator or write production paths.
- `Wisp-material-study.blend` is the editable candidate; `wisp-material-study.glb` its self-contained export. `build-validation.json` records the identical before/after geometry, polygon-index and morph-coordinate fingerprint,24bones and20,953source body vertices.

## Evidence

Candidate asset test passes:32,055exported weighted vertices,46mesh/target combinations,24bones andFloat/Wave/TurnAway/MenacingPace. Khronos glTF validation:0errors,20existing Blender mesh/skeleton hierarchy warnings only. Blender's export also emitted a body mesh-validity warning and intermediate numerical warnings; these are retained as a source-topology concern, not silently dismissed by the successful runtime export.

`review.cjs` loads original/candidate in separate silent browsers and captures matched wave cute/half/evil plus side/back.10captures,0browser/shader errors. Art review uses renderer/composer pixel ratio1.25 even on software GPU, so it is NOT a playback/cadence benchmark. Actual front/side/back images show blue UV streaks removed, coherent ivory brush detail and no obvious large material patch boundary. Removing projected decoration also exposes how plain the underlying sculpt is: angular silhouette, shoulder web, protruding eye volumes, insufficient sculpted facial warmth and apparition material still fail the goal. Need intentional regional paint/flow, sculpt/retopology and joint correctives; do not ship uniform ivory as a completed premium character.

Run from the repository with the bundled Node/Blender tools as available:

- Blender background Python: `source/wisp-3d/material-study/build_study.py`
- `HAUNT_3D_ASSET=source/wisp-3d/material-study/wisp-material-study.glb node tests/wisp_3d_asset.cjs`
- Same asset override with `tests/wisp_3d_validate.cjs`.
- `HAUNT_PLAYWRIGHT` can select a compatible Playwright module for `review.cjs`; default full-source static server is8812. `HAUNT_TEST_BASE` and `HAUNT_PROOF_DIR` override those review paths.

No genuine voice, physical projector, paired hardware or full candidate regression acceptance has been performed. Do not replace main assets until those relevant gates and full visual motion/morph review pass.
