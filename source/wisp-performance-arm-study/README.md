# Painted segmented-arm source studies

Experimental source artwork, not loaded by the production renderer. Original generated files retained unchanged. These paintings require measured joint registration, a matching standalone hand, generous hidden overlaps and visual validation through reaching before adoption. Requested canvas sizes and anchors were not followed by generation; use validation.json actual dimensions, not prompt coordinates. Neither asset is a proven replacement rig.

## Upper arm v1
Generated with built-in imagegen using original arm-right.png and cute-front.png as references. Original: exec-8035833b-91ac-4919-a45a-ca569622af57.png.
Brief: one painted shoulder-to-elbow component, no forearm/hand; requested 512×1024, rounded overlapping caps, pearl ivory stippling with cyan rim and dimensional cool shading, upper-left illumination, transparent padding. Preserve approved painted identity; avoid flat vector, plastic and mechanical appearance.

## Forearm v1
Generated with built-in imagegen using original arm-right.png, cute-front.png and upper-arm-v1.png. Original: exec-4d8f6b02-a053-439a-87f1-bc3790ffc78b.png.
Brief: one painted elbow-to-wrist component, no hand or upper arm; requested 512×768 with elbow (256,180), wrist (256,590), gentle curve and rounded enclosed overlap caps. Match warm pearl ivory stippling, soft cyan rim, upper-left illumination and transparent padding. No text, props, floor shadows or separate smoke.

## Acceptance limits
These are source studies, not animated production assets. Opacity, overlapping joints, matching hand anatomy, independent digits, evil material/shape correspondence and continuity still need validation. Current production arm remains in place.

## Standalone open hand v1
Generated with built-in imagegen using cute-front.png, original arm-right.png and upper-arm-v1.png. Original exec-5a69954e-f2c5-46b8-970d-ae19927830bc.png. Brief: palm facing viewer, relaxed welcoming reach extending right, one thumb above and three rounded fingers fanning right/down, short broad rounded wrist stub extending left for concealed overlap; preserve pearl ivory stippling/cyan rim/upper-left light and approved four-digit anatomy. Square canvas, central70percent with transparent padding; no extra arm/face/text or props.

review.html is a local-only continuous arm assembly study. It draws original images with affine bone transforms and nondestructive source-alpha feathering at proximal overlaps. It does not yet have digit articulation, evil correspondence or depth-aware turning. Measured anchors are provisional. No claim this is accepted production character animation.

## Continuous-skin comparison
continuous-review.html / continuous-skin.js renders the same source paintings on 5,330 GPU mesh vertices mapped to one C1 Hermite arm path with shared elbow tangent. The original paintings are untouched; source-space bindings and overlap masks are runtime-only. Three native browser fixtures captured with no page errors/finite coordinates. Compared against affine assembly, bend continuity improves but the separately painted cap shading still produces a visible elbow ridge and wrist seam. This study is NOT accepted for integration. The next comparison uses one continuous neutral arm painting to remove discontinuous material at source rather than adding more crossfade layers. No new production dependencies.
