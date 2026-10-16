# Painted Wisp hand acting pilot

Status: artist-directed source study, NOT loaded by the live app. Generated using the built-in imagegen tool on 16 October 2026; original art preserved. The next hand design must add actual digit acting without changing Wisp's established identity.

## Current study

`right-cupped-v1.png` changes the original spread hand into a soft cupped gesture, one thumb plus three fingers. Source authority: `assets/wisp-performance/front-kit/arm-right.png`. Intended canvas registration: 1230×1278, shoulder [330,400], elbow [540,770], wrist [790,870], palm [940,870]. The generated pose preserves the four-digit design, painted ivory/cyan material and clear alpha, and reads naturally on the actual current rig.

It is not a drop-in approved animation asset. Measurement found upper-arm alpha intersection-over-union 0.755 and mean premultiplied RGB error 33.97/255 in the upper-left test region. The shoulder/arm silhouette changed despite the prompt. Directly swapping complete arm textures would alter anatomy outside the hand; texture-fading open and curled fingers would also produce doubled silhouettes. Preserve this as an art reference for a separately registered hand, or require corrected arm registration and a real contour transition before integration.

## Generation prompt

Use case: identity-preserve. Asset type: production painted animation component, friendly Wisp right arm, gently curled relaxed hand pose. Edit the supplied image. Preserve its exact portrait canvas proportions, arm placement, shoulder at upper left, bent forearm, wrist position, luminous ivory painted ghost material, cyan translucent edge, light direction and detailed painterly texture. Change ONLY the hand at lower right from four widely spread digits into the SAME FOUR digits loosely curled inward together in a relaxed soft cupped gesture. One thumb plus three fingers, no extra digits. Preserve palm center, palm size and wrist attachment. Friendly, supple, appealing dimensional anatomy, fingers separated/readable with soft rounded tips; never claws. Entire original arm remains in frame with original transparent padding, shoulder and elbow shape and position unchanged. Actual transparent background. No text, no labels, no decorative objects or separate duplicated hands. Intended to replace the hand pose in this exact arm's animation rig; registration matters.

## Actual-rig review

Local isolated Chromium routed only this arm image to the candidate, then rendered the real layered runtime at idle, wave and surprise. Six baseline/candidate frames were captured in the sibling `outputs/wisp-live-rig-proof` directory under `cupped-hand-*`. Bounds and finite mesh coordinates passed, both runtime instances disposed and no page errors occurred. This is a browser render test, not physical projection, motion acceptance or a genuine voice test. The wave comparison demonstrates a readable cupped gesture while the other hand waves. It does not validate a transition between hand poses.

## Required next gate

Review an authored half-curl breakdown for consistent digit identity and wrist/palm placement. Build a registered hand control with contour correspondence or genuine finger joints; do not simply crossfade incompatible open and curled silhouette textures. Inspect all intermediate frames, folded arms, depth turns and cute/evil combinations before enabling it in the show. Palm/back drawings remain necessary for true hand rotation.

## Authored half-curl breakdown

`right-half-curl-v1.png` is a second built-in imagegen edit, using both the authoritative spread arm and cupped study as references. Its brief requested one halfway pose on the same 1230×1278 canvas, exact shoulder [330,400], elbow [540,770], wrist [790,870] and palm [940,870], changing only one thumb plus three fingers into a loose half-curl. Material, illumination and transparent background were constrained to the source. No text or duplicate hands.

Visual review: four readable rounded digits, a softer partially closed gesture and consistent ivory/cyan painting. The generated upper-arm contour again moves; this is an authored pose study, not an approved registered runtime replacement. The next implementation must map all three poses through shared anatomical control points and validate actual intermediate silhouettes.
