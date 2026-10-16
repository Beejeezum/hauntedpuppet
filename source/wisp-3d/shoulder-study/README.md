# Anatomical shoulder support correction

This is the editable source for the incremental `painted-islands-anatomical-shoulders-v1` export. It retains the neutral ivory/island-UV base from the material study. This does not constitute final art or attraction acceptance.

## Defect and correction

The baseline source has289local shoulder/waist edges jumping by more than.5arm weight, up to.999999 across~.02worldunits. The original hard `abs(x)>.42 && z<1.98` group selection incorrectly assigns near-total arm influence to portions of neck and waist. Raised-arm renders stretch those faces into a web/spike.

The builder changes only2,062local vertices. It softens anatomical support by distance to actual rest upper/forearm bones, blends the body-side attachment, and protects the central waist. Outside the local region, original weights remain. Arm influence transfers to normalized Torso/Head support. To retain four skin influences, small influences merge into an existing anatomical parent; a9pose deformation audit bounds that approximation to.001278worldunits (limit.005). An earlier wider region failed this error limit at.05268 and was rejected; narrowing the operation to the demonstrated attachment defect passed. An initial raw top-four drop lost2.64%mass and was rejected before export.

Source-edge maximum arm-weight jump falls.999999→.229595; no remaining local edges exceed.25. The waist guard removes a residual spike caused by low-body arm assignment. A source fingerprint audit confirms geometry, topology, every morph coordinate, UV loops and rest skeleton equal the preceding material scene; weights intentionally differ. No pose capabilities, bones, morph channels or original paintings were removed.

## Verification scope

- Actual GLB: normalized weights,24bones,46mesh/target combinations,4clips,0Khronos errors;20pre-existing Blender hierarchy warnings only. Blender still emits its pre-existing body-validity/intermediate numerical warnings during export; future topology work must investigate these.
- Bind-region regression:112neck samples maxarm influence.03201;31waist samples max0. This guards the specific erroneous anatomy assignment, in addition to normalized/finite data checks.
- Actual browser deformation:117full-body poses, continuous shared cute/evil morph, independent synthetic face controls and audience-friendly reset.
-18actual eyelid ray tests across cute/half/evil, pupil and two catchlights;1,260synthetic interruption/idle/turn samples; projected bone emitters and8GPU disposal cycles passed on v2.
- Main operator/projector in Chromium/WebKit passed v2: actual back turn, offline speech-driven mouth, dance during offline speech, Stop/blackout, silent projector and painted fallback. These are synthetic/offline browser tests, not genuine provider or physical-device acceptance. V3 additionally enforces zero central-waist arm influence and repeats asset/deformation/art review.
- Matched high-resolution rendered art captures: cute/half/evil/side/back. Reviewed wave shows web/spike removed; silhouette, hands, eye integration, final regional paint and apparitional material still need refinement. Review pixel ratio1.25 on software GPU is NOT a60fps qualification.

## Rebuild

Keep original source/paintings available. Run the baseline generator first only when rebuilding geometry, then `material-study/build_study.py`, then this folder's `build_study.py`. The latter saves a new `.blend` and `.glb` here. Promote this selected GLB to `assets/wisp-3d/wisp.glb` only after tests/review. Running the baseline generator alone does not reproduce the improved production material/weights and must not be shipped as the current revision.
