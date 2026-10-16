# Wisp production handoff

The live app supports a real skinned GLB with a continuous cute/evil morph. The current sculpt is an iterated working asset, not final feature-film character art. Preserve the original paintings in assets/wisp-v2/cute-front.png and demon-front.png as identity references. The newer user-approved material/appearance target is source/wisp-art-reference/approved-friendly-fog.png: soft volumetric-looking ivory fog edges, with no fixed solid spirals or hard cyan contour. Its source still does not pass framing; do not treat approval of the appearance as approval of every source pixel or animation ending.

## Retain the working contract

- Keep the 24 existing bone names and their roles, including independent Eye_L/R, four Digit bones per hand, the crest and three-part tail.
- Preserve Evil, JawOpen, MouthFunnel, MouthWide, MouthSmile, TongueUp/Out, independent Blink_L/R, BrowUp_L/R and BrowDown_L/R. Upper lids have BlinkEvil_L/R compound corrections. Every shape target must match its own mesh's topology.
- Keep eyes, eyelids, eyebrows and mouth independently controllable. Closed eyelids must physically cover pupils and both catchlights in cute, half-morph and evil. The test casts rays against the deformed triangles.
- Keep fangs anchored to the upper gum through speech targets. The evil mouth has a shallow upper arc and deep lower grin, with a matching body recess.
- Painted body and iris textures are packed into the Blender source. Do not overwrite the original paintings. Use a dedicated UV unwrap for the next texture pass rather than adding more projected screen effects.
- Runtime owns gaze, live acoustic mouth estimates, damped joint motion, action interruptions, true yaw/depth, rim light and bloom. Existing operator, phone, voice and silent projector paths remain the integration boundary.
- Painted vapor starts at projected skeleton joints and inherits their velocities. Preserve that attachment when revising bone locations.

## Highest-value remaining art work

1. Replace the current projected body UVs with intentional non-overlapping UV islands and hand-directed paint. Remove blue streaking at neck/shoulder transitions while retaining ivory paint, cyan edge depth and fine brush detail.
2. Retopologize shoulders, armpits and palms for smooth deformation. A small web/triangle stretches below the raised arm in broad waving poses. Broad automated weight changes did not convincingly solve it and were rejected.
3. Refine relaxed hand silhouettes, evil curved claws and the crest/tail curl in three-quarter and back views. Keep both forms recognizably the same character.
4. Add shoulder/elbow corrective shapes only where a rendered pose demonstrates the need. Blend corrective influence continuously; do not introduce hard pose switches.

Rejected experiments: separate cheek ellipsoids looked like pillows; a broad orbital field made bags/goggles; thin translucent curl tubes looked like wire loops; aggressive UV clamping made blocky streaks; lower exposure dimmed the character without improving its paint. Do not reintroduce these without a clearly better rendered result.

## Acceptance before replacing the asset

Render matched front, ±35-degree, profile and back views. Cross Evil 0/.25/.5/.75/1 with jaw closed/half/open and independent blinks. Review silhouette and expression at street-distance thumbnail size. Record wave, dance, spin, deep exit/return and interruptions at normal speed and slow playback. Check shoulders and hands closely.

Run asset topology/weights, Khronos validation, actual eyelid occlusion, full-body deformation, temporal continuity, projected emitters, resource cleanup and main browser integration tests. Keep Stop, blackout, welcome-kids reset, painted fallback and projector silence passing. Hardware screenshots and browser recordings do not establish physical projector focus, brightness, contrast or street latency.

The generator rebuilds Wisp.blend and wisp.glb. If an artist sculpts directly in Blender, preserve that edited source separately or migrate the generator before running it again; regeneration overwrites manual sculpt changes.

## Material construction pilot checkpoint

`material-study/` contains a separate editable scene/export with island UVs and a dedicated generated ivory paint texture. Same source geometry/morph fingerprint, actualGLB topology/weights/clip checks and0-errorKhronos validation pass; five matched art poses remove the blue projected-outline streaking. This is useful base construction, not final paint. It deliberately retains the original model/paintings. The plain material exposes the angular silhouette, shoulder web and protruding eyes more clearly. Next priority is shoulder/armpit edge flow and head/eye sculpt warmth, then region-specific painted flow and apparition material. Do not resume broad weight-only tweaks, hide the web with glow, or describe the neutral paint as production approval. Blender's body-validity export warning remains a source-topology concern despite finite valid GLB output.

## Incremental shoulder correction release checkpoint

The selected shoulder-study export removes the reviewed raised-arm web/waist spike through a localized correction of the original hard arm-group classification. The289large source weight jumps fall to0edges above.25; no geometry/morph/skeleton changes were needed for this specific defect. This supersedes the unresolved web in the earlier material/DQ checkpoints, without claiming all shoulder poses or sculpt topology finished. Geometry, head/eye integration, expressive hands, regional painted flow and apparitional material remain the next art priorities. The original baseline scene remains preserved; current selected editable source and rebuild stages are recorded in assets/wisp-3d/rig.json.
