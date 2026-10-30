SCARY WISP — MOVING NEUTRAL SPEECH BASE, SOURCE ONLY

This reuses neutral-mouth-audio-pilot-v2.mp4, the earlier whole-character audition that failed speech articulation. Its rejection remains intact. A moving closed mouth is useful as a rigging base; it is not evidence of successful speech. No additional generation/API credits were used. It is not a new performance slot in the finite16-cue bank.

scary-neutral-body-base-v1.mp4 removes the baked audition dialogue using video-stream copy. All193native decoded RGB pictures are identical, as is compressed video essence; original1088x704size/24fps/order remain. Use this native master for face authoring. It is not an approved loop. Its own minimum17percent reserve passes15percent but misses the20percent target, so live projection still needs deliberate staging.

scary-neutral-body-review-v1.mp4 is a separate1920x1080black-padded viewing proxy: source occupies416,188,1088,704 with no geometric scaling. It is re-encoded and not pixel-identical. All193decoded frames pass20percent complete-effect reserve, minimum28.5percent. No baked speech or new mouth animation is present. Do not substitute its compressed pixels for exact master registration references.

scripts/track-scary-neutral-face.py pins the original movie and observes first-picture lip/eye candidates through independent direct forward/reverse pyramidal Lucas-Kanade tracking. It does not accumulate a frame-to-frame drift estimate or invent missing points. The13-point v1 retained an extraneous cheek-wrinkle endpoint and rejects10frames. The corrected12-point v2 ends the actual reference crease at565,345:193of193 pass unchanged.75pixel backward/25photometric gates; maximum observed backward residual.394pixel. A blank/absent face is rejected. Two-eye rigidity is not being used as a replacement for native lip observations.

These are consistency-tested candidate coordinates, not artist-validated anatomy. Twelve spread-out face crops and six previous failure frames were visually inspected in work/scary-neutral-reuse/. The track data alone does not deliver a speaking renderer, oral material, independent jaw, OO correction, eye rig, picture-match adapter or live controller integration. The separate connected-jaw prototype below adds one tested mechanism. The rejected mouth-on-attack-film classes remain rejected and unchanged.

Next: connect a bounded lower-face deformation to this actual neutral paint. Lips, cheeks and jaw must share its moving native surface; no foreign regenerated cheek patch. Validate painted teeth as hidden upper/lower surfaces, actual OO/EE correction, rest closure, blinks, turns and source-picture identity. Then voice and loop/ambient joins require separate human/technical review. Keep public runtime unchanged until those gates pass.

Reproduce tracking: python3 scripts/track-scary-neutral-face.py
Reproduce old failure: add --include-cheek-tail
Prepare native master once: python3 scripts/prepare-scary-neutral-body.py (refuses overwrite)
Native full playback/cleanup: node tests/scary_neutral_base.cjs; set HAUNT_BROWSER=webkit for MacWebKit. Existing local pinned Playwright/FFmpeg/OpenCV dependencies required. No key-owning process is restarted.

Method reference: https://docs.opencv.org/4.x/dc/d6b/group__video__track.html
Installed OpenCV4.13.0; no upstream source code copied or vendored. The optical-flow tutorial also describes backward checks: https://github.com/opencv/opencv/blob/5.x/doc/tutorials/others/optical_flow.markdown . These sources explain the method, not Wisp anatomy or production quality.

CONNECTED MOVING JAW — PRIVATE ATTACHMENT PROOF

neutral-moving-jaw.mjs deforms the current neutral painting along its tracked lip-contact seam. The same original picture supplies both lips, cheek lift and jaw surface; no replacement cheek/face image is grafted onto the body. Existing painted AH oral detail is separately projected behind the opening with upper/lower sampling. It is a2Dmaterial projection, not a3Ddental rig. Native attack-film fang sampling is retained only as an explicit rejected-material diagnostic; the caller must select an oral map.

Chrome and MacWebKit test965frame/opening geometries (193x5), minimum triangle-area ratio.5125. Twenty-four pixel cases cover eight native pictures at0/.5/1opening: exact rest, no iris9x9changes or out-of-face changes. Actual GL object retirement and null bindings are checked. The full amplitude-driven export also compares all193pre-encode PNGs: zero changed pixels outside the face rectangle or sampled irises. Encoding a review MP4 changes pixels globally; do not describe that file as original-pixel-identical.

The private8second voiced proof uses the existing approved apology recording as an attachment guide; this is not the final demon voice. Jaw opening follows coarse amplitude, not phonemes. No OO/EE, arbitrary live frame matching, side-view/yaw occlusion, seamless loop, real provider latency, live phone integration or human/physical acceptance is delivered. Default/public app paths remain unchanged.

Reproduce inputs: python3 scripts/prepare-neutral-jaw-proof.py
Check mechanism: HAUNT_JAW_ORAL=corrective node tests/moving_neutral_jaw.cjs
Set HAUNT_BROWSER=webkit for MacWebKit. Add HAUNT_NEUTRAL_JAW_EXPORT=1 HAUNT_NEUTRAL_JAW_VOICE=1 in Chromium to create the voiced attachment video in work/. Native diagnostic uses no HAUNT_JAW_ORAL flag. Existing pinned runtime/tools are required. No credentials, microphone/camera or new generation credits are used.

PICTURE IDENTITY — REJECTED FOR LIVE USE
neutral-canonical-registration-review-v1.json records a failed strict 193-picture browser audit. No public/runtime mouth binding. Final 3x3 weighted-brightness matching accepts117/193 native pictures in Chrome (76 rejected) and110/193 in WebKit (83 rejected); ambiguity is not waived. tests/neutral_canonical_picture_registration.cjs keeps the unmet all193 assertion and currently exits with failure. Reproduce references with python3 scripts/package-neutral-canonical-head-samples.py and audit using pinned Node24. Native movie unchanged. CPU staging honors this source full-range metadata, not other films video-range override. No new generation credits. Needs stronger independent spatial registration before live integration.

LANDMARK-BOUNDED POSE ADAPTER — separate from rejected exact identity
neutral-pose-registration-review-v1.json records native193-picture Chrome/WebKit pose tests. Correlation .998 and identity-margin .00015 remain; ambiguous pictures are accepted only when every nearby reference has all14observed lip/eye points within0.5pixel. Chrome maximum spread0.30984, WebKit0.47853. Selected-pose error against observed source guides is0Chrome/0.30984WebKit. These are not artist-ground-truth guarantees or exact frame identity. registered-neutral-jaw.mjs matches the unmodified current native picture before applying its own connected painted jaw; unknown pictures stay unchanged/closed. Source-only, no public app binding. Whole193seek pixel/retirement tests and supplementary source-only audit are reproducible through tests/neutral_pose_registration.cjs and tests/registered_neutral_jaw.cjs. The latter also checks source body and iris pixels on selected near-ambiguous poses. No live voice, OO/EE, continuous-loop, human art or physical approval. This is not a replacement for those remaining requirements.
An independent limited-range bt601 FFmpeg reference, motivated by actual Chrome VideoFrame metadata, still failed exact identity. Retain rejected v1/v2 references and the failing exact audit; no source movie color change or threshold waiver. W3C WebCodecs VideoColorSpace and official FFmpeg scale docs explain the metadata/reference options, not these experimental outcomes.
