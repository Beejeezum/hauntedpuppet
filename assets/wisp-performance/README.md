# Painted performance Wisp — articulated replacement candidate

Open /assets/wisp-performance-studio.html for a silent 15-second acting reel, or /?character=performance for the normal operator, voice, webcam, phone and projection path. The character remains opt-in. Original painted and 3D renderers remain available.

The selected candidate now uses a shared painted body, five registered armless views and separate skinned arms. A silhouette-correspondence mesh connects front, three-quarter, profile, rear and back paintings; textures blend in premultiplied space on that same contour. The same shoulder/elbow/wrist/hand rig keeps moving through turns. Two-link arm solving allows bounded cartoon stretch and volume compensation; hand orientation and size are separate. Cute and evil share topology, with a continuous cheek/crest sculpt and matched arm paintings. Hands remain camera-facing during turns; this is a painted 2.5D rig, not arbitrary 3D geometry or individually animated fingers.

A shared live eye rig drives gaze, pupil, asymmetric blinks and brows across both forms. Newly painted ivory demon ridges, dark sockets, luminous irises and fangs replace the friendly components gradually. Mouth ink is registered into one changing aperture instead of crossfading two full faces. Near/far eye visibility follows view angle; the face disappears on back views. Floating-eyes mode retains the actual live eyes while the body dissolves.

Twelve critically damped local acting controls add distinct shoulder, elbow, wrist, palm, head, chest, crest and tail timing. A dedicated joint wave has anticipation, flowing breakdowns, a readable hold and follow-through. Exit turns back toward the audience before returning to idle. Existing choreography, speech, webcam and operator clocks remain the input sources. Acoustic mouth inputs are estimates. The standalone studio uses explicitly labeled synthetic mouth motion and captures no microphone.

Twenty earlier whole-pose drawings remain the loading fallback. Studio ?rig=poses forces them for comparison. The app automatically uses them if a layered component fails. The new rig reuses the existing pinned Pixi runtime; no new rendering dependency or voice service was introduced.

## Verification and limits

Focused checks cover actual GPU skin, reachable hands, shared topology, form-midpoint brightness, view-boundary continuity, nonfolding body correspondence, independent live facial channels, native floating eyes and resource disposal. Operator checks cover speech through gestures, gentle reset, Stop, blackout and silent projector. Chromium and WebKit are tested. The longer render soak measures resource identity and frame cadence; it is not physical projection or genuine provider audio.

Visual polish remains iterative: folded-hand overlaps, shoulder depth in profile/rear views, more expressive finger poses and on-site projection contrast still need review. This is a stronger candidate, not a claim of feature-animation or theme-park final approval.

## Artwork

All source PNGs use the built-in image generation tool with approved cute/demon paintings. Original references are unchanged; no raster repaint or vector substitute is used. Source alpha and contours are measured for mesh construction. Prompts and selected component metadata are in front-kit/GENERATION-PROMPTS.md and asset-manifest.json. The previous turn-gutter cleanup is recorded in GENERATION-PROMPTS.md.

The follow-up interruption pass gives view angle, root movement and head roll their own critically damped settling, preserving momentum when a cue is replaced. Arm direction is invariant to angle wrapping; tight folds smoothly extend the shorter ghost segment within the same 1.75 bound instead of snapping wrist orientation. The scary surprise has a separate two-claw anticipation/breakdown/reveal track blended by form amount; friendly audience behavior is unchanged. Registered mouth paintings now share a short normalized transition (about 40 ms to 90% at steady frame cadence), retaining one aperture. This is animation smoothing, not improved phoneme recognition. Wisps originate at the actual projected palms and body spine through turns.

The performance pass crops face uploads to 800×850 pixels (680,000 instead of 1,572,864), keeps only 657 body vertices aligned to the material/glow boundaries, and changes UV buffers only when the active view pair changes. Original PNG resolution is preserved. Registered before/after front/profile/back renders were visually reviewed; visible-pixel95th-percentile channel differences were 1–2 levels out of 255. Automatic gaze now moves the actual head after the eyes, with separate head/crest settling; webcam head input takes precedence.

Graphics recovery is exercised with the browser’s [WebGL context-loss simulation](https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_lose_context/restoreContext). The runtime waits for restoration before resuming; three real loss/restore cycles redraw the body and facial details in Chromium and WebKit. Disposal removes the recovery listeners so an old canvas cannot revive a stopped renderer.

The brow morph registers the friendly pigment and demon ridge to a shared painted centroid, principal axis and length. This removes the separated intermediate brow seen in footage; endpoint pixels are checked against the original components (zero measured error in Chromium and WebKit). Webcam gaze also drives lid follow and iris foreshortening rather than only moving the iris.

The elbow/wrist skin now applies a bounded correction for area lost when adjacent bone transforms blend. It expands around the exact shared joint by at most 1.35×; rest identity and joint locations stay unchanged. A right-angle test retains more than 95% of the original cross-section radius. Per-bone affine coefficients are computed once per frame, avoiding temporary point arrays during skinning. This is a small 2D joint correction, not full dual-quaternion skinning or artist-authored corrective drawings. Extreme folds and individual finger poses remain art/rig work.

## Continuous spirit skin

The painted performance candidate now has continuous local spine/crest deformation, changing torso width, stronger independently phased hand/wrist motion and animated body-space transmission. These run from the existing character clock between cues, without adding timers or increasing the 657-vertex body mesh. The moving alpha field is attached to the registered turn surface; it preserves more opacity around the face and more of the original painted cyan edge while letting the lower body become substantially translucent. Original PNGs are unchanged.

Translucency also requires complementary front/rear arm coverage. The shader partitions one painted arm around the body rather than drawing its translucent hand twice. A GPU test compares this split against a single arm using fixed, non-overlapping source geometry; folded-limb overlaps remain an art/rig limitation. Shoulder overlap caps fade near their attachment.

The studio returns to a living idle after the reel, with a continuous clock handoff. Explicit timeline scrubbing still holds a review pose. Reduced motion freezes skin motion and material phase; the frozen artwork reference disables the new material. Stop, Blackout, original fallbacks and laptop-only audio ownership are retained.

This remains painted 2.5D: it does not complete missing opposite-side views, individual finger articulation, true volumetric scattering or the production 3D sculpt. Follow docs/wisp-excellence-plan.md for visual acceptance rather than treating this improvement as completion.

## Independently timed painted digits

`digit-skin.js` defines four artist-placed roots/tips in each original arm's source coordinates. Bounded overlapping influences flex the existing painted digit geometry before arm skinning. Each digit and hand has distinct timing; evil adds a small faster tension component. The wrist/upper arm outside the influence remains unchanged. Binding is computed once at load; geometry count, textures and GPU surfaces are unchanged. Normal motion energy controls the effect, with zero deformation for frozen/reference and reduced-motion modes.

This is local secondary flex of one painted hand pose, not a full per-phalange hand rig, authored open-to-fist transformation, or new palm/back art. Source hand studies remain separate and are not texture-swapped into the live rig. Tests check positive local area over 1.34 million samples, bounded tip travel, exact zero-energy identity and actual locked-arm GPU vertex movement in both browser engines; recorded review evidence remains separate from physical projection.
