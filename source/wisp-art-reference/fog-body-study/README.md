# Fog body layer study — not shipped

Generated unchanged from the approved friendly fog artwork using built-in imagegen, true RGBA1024×1536. Face and arms are removed so native eye/mouth/arm controls can operate independently. The current source hash, alpha edges and provenance are in validation.json. This is a candidate body layer, not a completed puppet kit.

review.cjs substitutes only this front body texture into an isolated silent browser; production assets, voice, webcam, phone and projector code are unchanged. Six actual render frames compare baseline/candidate at0/2/5seconds. Rendered candidate removes the old solid curls and cyan contour, retains the core, and fits existing face placement reasonably in these views. Existing arms still have blue outlines and visible shoulder joins. Side/back views retain old artwork and would mismatch on turning; do not use those views as evidence of this new body's quality. Motion and material acceptance need full-speed footage, not only stills.

Next work: matching independently skinned arms with registered joints, compatible eyes/mouth surface, fog side/back views and a complete continuous performance. Keep the original painted fallback until those visual and interaction gates pass. Do not promote this texture-only substitution as a production rig upgrade.


## Arm material experiment
arm-left-rejected-v1.png is preserved as a rejected result:98edge pixels exceed alpha8and a blue halo remains. arm-left-v2.png has true alpha and zero edge pixels above8; it removes the cyan line but does not meet the requested17.5%source reserve. These PNGs remain unchanged; validation files include generation provenance and hashes.

Run review.cjs --arm --video for the isolated body+one-arm study. The browser normalizes the new arm's alpha128envelope to the existing rig's coordinate system; this is deliberately coarse and not a substitute for registering shoulder/elbow/wrist/digit landmarks. Captured baseline/candidate poses have zero page errors. The11.92second silent browser recording contains setup plus8seconds of running rehearsal. Sampled motion frames show the raised arm is still thin/tubular with an obvious shoulder join; old opposite arm retains cyan material. Digit registration, volume and shoulder design need work. Not shipped or accepted. The recording is25fpscapture, not evidence of runtime cadence or physical projection.


## Stretch-width study
review.cjs --volume compares identical candidate art with the original solver versus a local width floor. The original bone transform narrows a stretched limb by1/sqrt(stretch); the study uses max(1.15,1/sqrt(stretch))for the two arm bones, leaving hand scaling intact. Both use identical textures and pose clocks. Six actual comparison frames render with zero page errors. The raised arm becomes fuller but still reads tubular; shoulder shape and landmark binding remain unfinished. This is stylized width retention, not physical mass conservation or proof of solved anatomy. No production solver was changed. Do not promote this study from a numeric width or error-free rendering alone.


## Authored joint placement
arm-left-rig.json records source-pixel shoulder/elbow/wrist/palm and four digit root/tip landmarks for the generated1205×1306painting, plus attachment/scale. review.cjs --joints --video compares identical body/arm artwork with the coarse old-rig envelope mapping versus these actual-art landmarks; the latter uses the PNG directly, without intermediate image normalization. Original PNGs and production rig remain unchanged.

Six pose captures and a short silent running rehearsal render without page errors. The sampled wave's maximum segment stretch falls from1.3697to1.3128, with the new wrist/palm landmarks. This is not a quality score: the raised arm is still tubular, the shoulder join is unfinished, and the opposite arm/turn views still use old art. Review gesture silhouettes and corrective shoulder/elbow drawings before considering adoption. Do not infer a complete rig or correct fingers from finite bone coordinates.


## Rotation blend experiment — not selected
rotation-skinning.js is an original2Djoint-centered polar rotation/stretch blend, NOT dual-quaternion skinning. Research motivation: Kavan et al., Skinning with Dual Quaternions (2007), https://users.cs.utah.edu/~ladislav/kavan07skinning/kavan07skinning.html describes limitations of linear blending and a different3Dsolution. No third-party code was copied and no claim is made that this implements that paper.

The source test passes756constant-weight elbow-ring probes at0/45/90/135/170/179degree bends, exact shared joints, identity, and influence-boundary continuity. It does not establish spatially varying triangle orientation, temporal continuity through the180degree branch, performance or production safety. review.cjs --polar --video isolates baseline/candidate with identical new art and authored landmarks. Six frames and short running rehearsal have zero page errors, but the reviewed raised-arm result has LITTLE visible improvement and retains the tubular silhouette. Do not adopt based on the test pass. This narrows the next task toward corrective pose artwork and shoulder silhouette rather than repeated solver swaps.


## Raised-arm corrective artwork
arm-left-raised-v1.png is a new unchanged1024×1536RGBApainted candidate with a plumper bent elbow and short wrist; its four rounded digits remain readable. Source alpha8bounds are[183,317,841,1230]and no edge pixels exceed8. The alpha8silhouette passes15%source reserve on each edge (not the requested20%all edges). The validation file preserves original basename/hash. arm-left-raised-rig.json contains authored joints/digit roots for this specific image.

review.cjs --corrective --video compares the preceding neutral arm with this raised-pose drawing on the same fog body and existing rig. Six rendered samples and short silent rehearsal have zero page errors. The reviewed raised pose has a visibly fuller elbow and hand than the earlier neutral-painting warp; the new hand is larger and the old opposite arm still mismatches. Shoulder finish, bilateral consistency, face identity, side/back views, evil endpoint and full animation/control acceptance remain open. This single source painting is not yet a pose-space corrective blending system and is not shipped. Do not call the whole character complete from one improved limb.


## Bilateral front-view study
review.cjs --bilateral --smaller-hands --video reuses the unchanged raised-arm painting for both sides through a native canvas texture reflection, with mirrored source landmarks and separate existing skeleton/digit/acting controls. No mirrored PNG is created. The baseline already uses the new left arm; the candidate replaces the remaining cyan right arm and adjusts hand scale from1.2to0.95for proportion. These changes are a combined front-view candidate, not an isolated measurement of hand scale alone.

Actual pose captures0/2/5seconds and a short running silent rehearsal render without page errors. Both arms match the fog body's palette and soft edges; reduced hands are better balanced in the reviewed wave, but shoulder finish and face/side/back/evil consistency remain unresolved. Raw1280×720canvas readings pass15%fog clearance for these THREEsamples (minimum sampled top17.64%). An attempted threshold scan of CSS screenshots was invalid because page-colored rounded corners were included; retained outside-repo framing.json explicitly marks it invalid and points to raw canvas evidence. Neither three samples nor25fpsrecording prove every-frame clearance, runtime cadence, premium art or physical projection. Not shipped.


## Three-quarter fog turnaround candidate
body-45.png is an unchanged1024×1536RGBAgenerated three-quarter layer using the new fog front body's material and old45degree layer solely as a volume guide. Alpha8bounds[239,39,831,1513], zero edge pixels above8; source hash/provenance in body-45.validation.json. Source padding is not15%all edges; final full-effect framing is separate. No eyes, mouth or arms are painted into this layer.

review.cjs --turn45 uses matching bilateral fog arms and smaller hands for BOTH baseline/candidate, then substitutes only the candidate45degree body layer. A local pose-weight review override requests0/11.25/22.5/33.75/45degree yaw and waits until actual viewAngle is within0.05degrees before capture. Ten actual comparison frames have zero page errors. All FIVEcandidate raw-canvas samples pass15%visible-fog clearance. Reviewed45degree candidate removes the baseline's solid cyan curls; shoulder overlaps remain visibly unfinished. These settled samples do not establish full-speed continuity or completed turn acceptance.90/135/back layers still use old art and must be replaced before adopting the whole turn path. No runtime or public build files changed.
