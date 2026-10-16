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


## Full fog turnaround study — not shipped
Added unchanged generated90/135/180degree RGBA candidates with provenance/hash/alpha validation. No edge pixels exceed alpha8, but source reserve does not meet15%all edges. The135degree source approaches the top within7pixels.

review.cjs --full-turn --video completed18settled comparison frames and an11.2second native rehearsal before the evil section. All nine candidate raw-canvas angle samples pass15%clearance. Reviewed67.5and180degree frames retain the soft fog palette, but flattened side facial depth, shoulder seams and patchy joins remain. The135degree drawing needs stronger rear orientation. The25.6second recording includes setup, settled turn captures and11.2seconds of native performance. A timestamp contact review confirms the turn reaches a rear view and returns, with a persistent lower body in sampled frames; continuous full-speed acceptance remains pending. Sampled framing does not establish every-frame safety. No production or hosted change.


## Eye surface occlusion experiment
`eye-turn-surface.mjs` models two painted eye patches on a rounded face with outward normals offset35degrees. The far eye foreshortens and becomes hidden before profile rather than lingering as a second frontal eye. The near eye remains visible in profile. This is an art-directed projection approximation, not reconstructed3Dgeometry.

`review.cjs --full-turn --face-depth` holds the new fog turnaround and bilateral rig identical on both sides of the comparison, changing only eye projection/occlusion. A guarded source substitution keeps production files unchanged. The numerical test covers continuous0..180degree samples and front/profile/rear visibility. Initial67.5degree visual review removes the overlapping far eye; shoulder and arm defects remain and source-art facial integration still needs refinement. Not shipped.

Controlled eye comparison completed18actual renders with zero page errors; all nine candidate raw-canvas samples pass15%clearance. No voice, webcam, physical projection or production acceptance is implied.


## Shoulder partition blend — rejected as a complete fix
`review.cjs --full-turn --shoulder-blend --video` holds the fog artwork, bilateral limbs and experimental eye projection identical. Candidate broadens the root alpha ramp0..0.18to0..0.45and shifts the fore/back split0.08..0.70to0.30..0.80. This changes actual pixels but reviewed front views remain nearly identical perceptually, including the bright shoulder patch.18frames complete without page errors and nine candidate sampled framing checks pass. Do not adopt it as a seam repair: source shoulder lighting/shape remains the next art task. Recording retained outside repository; no provider or production changes.


## Shoulder surface attachment — diagnostic candidate, not adopted
`shoulder-surface.mjs` releases a root region smoothly from the deformed torso into arm skinning within0.85upper-arm lengths. This is original code motivated by the Live2D Glue technique (official documentation linked in the excellence plan), not copied Cubism implementation or a Cubism integration. Numerical tests check root attachment and smooth outer-boundary release through0..180degrees. The initial exact floating-point equality assertion was corrected to a1e-10coordinate tolerance.

`review.cjs --full-turn --shoulder-weld --video` compares identical fog art and eye projection with only this geometry constraint changed.18actual captures and a short native rehearsal complete without page errors; all nine candidate sampled margins pass15%. Front/profile review still shows pale shoulder patches and overlapping collar-like folds. This does NOT solve shoulder appearance and is NOT adopted. Investigate actual triangle orientation/overlap and source shoulder topology before expanding parameter sweeps. No runtime changes.

`arm-shoulder-rejected-v2.png` preserves one unchanged built-in edit intended to soften the shoulder lighting. It changed hand scale/placement and strengthened the halo; original landmarks no longer register. Rejected, never used by the harness or live app. Provenance/hash and alpha bounds are in its validation file. Do not regenerate the same instruction blindly.


## Actual mesh orientation audit
`mesh-audit.mjs` measures signed triangle areas on the runtime arm vertices against registered rest geometry. Source-alpha probes at the three vertices, three edge midpoints and centroid distinguish sampled painted triangles from empty geometry retained for the unmatched old evil layer. This sampling can miss thin painted fragments; it is not a complete pixel coverage test or proof that every counted inversion is visible after compositing. Counts are geometry diagnostics, not an art score.

`review.cjs --full-turn --face-depth --mesh-audit` records nine actual turn angles. The first unfiltered run had18A/Bcaptures; the refined alpha-aware mode runs candidate only because face changes do not alter arm geometry. Front pose has58left/18right total inverted triangles;11left/0right have sampled source ink. Across the nine angles, left painted inversion counts are11,12,14,13,14,13,13,14,17; right counts0,8,8,8,8,13,14,8,8. The local candidate therefore has an actual deformation defect in addition to attachment/light mismatch. These measurements concern the new fog study, not a newly deployed runtime.

`smooth-arm-binding.mjs` tests continuous distance-based bone influence and linear skinning without the old spatially varying area compensation. This is a combined alternative binding pipeline, not an isolated attribution to either change. Nine render captures retain sampled framing but painted inversions worsen at multiple angles (profile14→17left and8→13right). Front appearance remains visibly unfinished. Rejected; no runtime code changed. The mesh audit test detects translation-invariant orientation, collapsed triangles, and empty-versus-painted classification.


The rotation-preserving alternative was then evaluated with the same alpha-aware geometry audit (`--full-turn --face-depth --mesh-audit --polar`). Nine actual captures retain nearly the same painted inversion counts: front11left/0right; profile15left/8right; back17left/8right. Front screenshot remains unfinished. The earlier constant-weight numerical ring pass did not cover these spatially varying mesh weights, and must not be used to claim this defect solved. Neither alternative is adopted.

Next construction task: an authored arm mesh with explicit joint transition zones and corrective elbow/shoulder shapes, evaluated on these SAME actual-geometry tests plus front/wave/turn footage. The current Cartesian grid plus closest-segment binding has failed visual/deformation acceptance for this new art. Test pose-space correctives or a guided mesh before generating more matching assets. Preserve original fallback and provider paths.


## Authored joint regions and signed-area corrective
`joint-zone-binding.mjs` constructs elbow/wrist transition planes from the registered painting's incoming/outgoing tangent bisectors. This replaces nearest-segment assignment with explicit joint regions, retaining linear skinning without area compensation. Nine actual turn captures show WORSE painted inversions at most angles (front12left; profile22left/24right). Rejected. This was a joint-region binding experiment on existing topology, not a completed authored mesh or corrective pose set.

`area-corrective.mjs` is a local position-based deformation corrective. It projects sampled painted triangles toward positive signed area, with an8%rest-area minimum. Constraints use seven source-alpha probes matching the audit (vertices, edge midpoints, centroid), so thin fragments can still be missed. It does not guarantee global nonintersection, volume, anatomy, coherent joints or premium art. No third-party implementation was copied.

An initial16iteration/four-alpha-probe run reduced inversions but retained failures; its evidence is in outputs/wisp-live-rig-proof/fog-area-corrective-16-study. The combined64iteration/seven-probe candidate removes sampled painted inversions at eight of nine turn angles, both arms. At180degrees, eight left-arm failures remain. Front screenshot visibly reduces the previous bright folded patch, while profile still has an unfinished collar/overlap. Nine sampled final frames retain15%clearance; zero page errors. A short native rehearsal recording is retained in fog-area-corrective-study, not yet accepted as a full performance.

Measured last256per-arm corrective calls in this browser run: mean0.122ms,p950.200ms,max0.200ms. These coarse browser-clock values measure this CPU function only, not sustained frame cadence, full scene performance or physical projection. The unit test covers isolated inverted/flat triangles, centroid retention and unchanged valid geometry; it does NOT prove the coupled mesh solves (the actual back-view failure contradicts such a claim). Candidate remains local, unadopted. Next verify/repair rear-view topology and native moving elbow silhouettes without stretching or pinching the painting.


## Adaptive corrective and moving rehearsal
The local corrective now alternates constraint traversal, stops early when within0.5%of its area target, and caps work at256sweeps. The allocation-heavy per-triangle projection was replaced with scalar gradient arithmetic. Bounded timing/diagnostic histories retain256calls; aggregate totals expose unresolved geometry instead of silently calling a capped solve successful. Tests include an intentionally impossible opposing-constraint pair: it respects its work cap and reports unresolved geometry.

All NINEsettled turn samples now have zero sampled painted-triangle inversions on both arms, including180degrees. The earlier64iteration evidence is preserved in fog-area-corrective-64-study. New evidence is in fog-area-corrective-study. This is not a global nonintersection or minimum-volume proof. Alpha coverage remains sampled, and the source mesh topology has not been rebuilt. Front/profile/rear render review still shows unfinished material joins and some thin arm silhouettes.

`--full-turn --face-depth --mesh-audit --area-corrective --motion-only --video` runs the actual cute rehearsal without repeating settled captures. The isolated silent browser records1500per-arm corrective calls, zero unresolved calls, maximum192sweeps; last256calls CPU mean0.173ms,p950.300ms,max0.400ms. RAF interval samples748:p5016.7ms,p9517.1ms,max33.4ms. This is one headless browser run with recording; not a sustained laptop+projector performance guarantee. The14.12second/353frame25fpsrecording includes load/setup and an11.2second requested native rehearsal ending before the evil section. Snapshot review at3/5seconds confirms raised gesture and persistent body; thin arm and collar appearance still fail finished character acceptance. No microphone/provider/physical test. Neither evil nor reverse morph is accepted by this test.

The moving test measures signed-area constraints on every corrective call, not full-frame smoke margins or all pixels of every triangle. Keep these scopes distinct. This source-only candidate has NOT replaced the live rig. Next work must improve raised-arm volume/silhouette and remaining joints while retaining this deformation evidence, then complete matching evil art/morph and operator integration.
