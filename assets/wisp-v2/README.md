# Wisp V2 character workshop assets

This is an original painted redesign and an experimental modular eye/speech kit. It preserves V1 as the production fallback. It is not yet a fully polished replacement speaking puppet.

The new anatomy has cheek and brow planes, a visible little neck/shoulder relationship, expressive hands, and an uninterrupted lower torso dissolving into body-attached wisps. It avoids the separate rear-tail attachment and smooth robot-like oval of the earlier rig. The demon shares the same flame crest, cheek/shoulder landmarks, hands and integrated lower wisps, with stronger shoulders, predatory mouth and colder narrow eyes. There are no legs, clothes or detached smoke-ring props.

## Files and runtime contracts

- `turnaround-atlas.png` / `turnaround-manifest.json`: six actual painted views, cute and demon front / three-quarter / back. The back views contain no face. Equal 418 × 627 cells on a 1254 × 1254 atlas; all crop rectangles and alpha bounds are explicit. These are three directional drawings per form, not a complete continuous 360-degree model.
- `cute-front.png`, `demon-front.png`: 1024 × 1536 source front paintings. They are references and usable whole-character cels, not articulated skeletons.
- `cute-face-free.png`: registered 1024 × 1536 cute base with eyes, sockets, brows and mouth removed. Cheek light spots and the remaining painted body are retained.
- `cute-eye-components.png` / `eye-rig.json`: separate blank sclera/socket paintings, iris with pupil, brows, upper eyelid caps and lower eyelid cushions. Read explicit tight source rectangles; the generated atlas does not follow perfectly uniform row boundaries.
- `cute-optics.png`: an additional pupil-free blue iris texture, separate opaque black pupil, and separate corneal highlight. They use `components.*.atlas = "optics"` and `opticsAtlas` in the eye manifest. The independent pupil supports actual dilation without stretching the iris texture.
- `cute-mouth-atlas.png` / `cute-mouths.json`: twelve painted articulations and speech mapping. Each has a broad `rect` and optional tighter `featureRect` that excludes much of the blue skin plate. The tighter region still needs soft local edge blending and visual inspection.
- `GENERATION-PROMPTS.md`: complete prompt set and source workflow.
- `integrity.json`: actual PNG dimensions, alpha range, edge alpha and SHA-256 values.

## Registration and eye mechanics

Native face coordinates are recorded in `eye-rig.json`. Eye positions, scale and lid composition are starting registrations for the workshop and should be tuned against `cute-front.png`. The painted white surfaces contain no baked iris, so the runtime can move the iris/pupil independently, converge the eyes on a near visitor, preserve corneal highlight position, follow gaze with lids and blink asymmetrically.

The original combined iris/pupil/catchlight drawing remains available for simple fallback. With separate optics, keep the iris circular except for perspective foreshortening and dilate only the black pupil. Do not stretch the whole iris vertically to imitate pupil dilation.

The sclera artwork already contains its painted socket rim. Drawing an extra lid cap over that rim while fully open produces a double seam. Separate upper and lower caps initially looked like detached floating eyelids in composition; this was rejected. Current runtime experiments use an upper cap for a full blink and hold the lower artwork for future refinement. A convincing continuous lid deformation still requires further work.

## Quality review and limits

The first turnaround generation was rejected because a demon claw touched its outer edge. The delivered revision restores the full claw and provides transparent cell gutters. Every PNG has native alpha; there is no baked black or checkerboard background. Read `integrity.json` for actual edge values rather than inferring transparency from preview appearance.

The high-resolution fronts preserve the new body anatomy, but the generated mouth plates can show a blue boundary and the eye socket rims can read too raised if oversized. The workshop must remain clearly identified as a study until those composition issues are resolved. The existing production Wisp is retained.

The demon currently has directional and front reference artwork, not a complete separate-eye talking rig. The cute face kit includes painted speech shapes, but live voice integration, acoustic/phoneme timing, physical projector legibility, and every expression combination are not validated merely by supplying these images. The body/arms/lower wisps remain one painting; there is no fully authored skeletal or mesh deformation rig in this asset folder.

All artwork was generated through the built-in image generation tool from the project's own approved references. Original generated PNGs are copied unchanged; source-cell analysis and manifest registration do not repaint the artwork.

## Articulation and extra turn views

The later `articulation.json` pack adds a registered arm-free body and independent left/right arm artwork. See `ARTICULATION.md` for affine transforms, shoulder padding, integrated lower-body deformation guidance, native assembly review and practical limits. `cute-turn-five.json` adds actual profile and rear-three-quarter paintings between the earlier front/back keys. These additions preserve the original single-painting fallback.
