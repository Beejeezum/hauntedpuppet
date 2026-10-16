# Approved moving Wisp reference and complete-effect framing

The user approved the dimensional, articulated acting of wave v1 and then the softer fog-bodied material/motion of fog v2. Keep those approvals separate from framing: fog v2 clips in every decoded frame and is not a final usable shot.

User-facing references and per-frame reports are in `outputs/wisp-vision` beside the repository. `wisp-fog-buffered-v4.mp4` is the corrected reference: 121 frames/24fps/1280×720; all visible connected fog at max-RGB thresholds 8,16,32 remains inside a 15% margin. Native AVFoundation uniformly scales the complete, uncut stationary v4 take to 84%. It does not reconstruct clipped pixels. Preserve the original generated videos. The prior wide v3 take is rejected for its late approach toward camera.

## Reproduce frame inspection

From the repository root:

```
python3 source/wisp-performance-reference/check_framing.py ../wisp-vision/wisp-fog-buffered-v4.mp4 --report ../wisp-vision/wisp-fog-buffered-v4-framing.json
```

`frame_video.swift` reproduces the native uniform-scale export. Its two positional arguments are the uncut v4 video and a new output path. It intentionally uses a fixed shot transform; no per-frame camera zoom. The current native SDK emits deprecation warnings; export success and decoded-frame validation are the evidence, not a warning-free build.

## Live compositor pilot, not integrated

`SpiritAtmosphere.bounds()` now reports the exact rotated raster quad union for all living particles after simulation/drawing. The method includes transparent atlas padding conservatively and clears to null on Stop/blackout/reduced motion. Geometry is independent of image opacity thresholds.

`effect-frame.js` fits the union of body and vapor to a safe rectangle, respecting requested scale/offset without unsafe interpolation. It does not recover clipping in its input images. A future compositor must render the complete effect to an adequately sized overscan surface first, then apply one transform to both body and atmosphere before projection mapping. Do not merely shrink a cropped body canvas, ignore detached wake particles or fade a hard clipping boundary. Preserve laptop audio ownership and silent projector/phone.

The geometry pilot tests 1800 frames and235688 actual rotated particle-quad corners per browser, including rapid movement and extreme requested output offsets. Chromium and WebKit each pass15% containment, pool bounds and clear/reduced-motion reset. Existing vapor Stop/blackout/clock-reset/lag checks still pass. These checks do not establish a finished live compositor, stable shot envelope, target cadence or physical projection acceptance.

Before production integration: choose a stable authored shot envelope including vapor, test the actual overscan composition pixels through actions/morphs/interruptions, inspect full-speed recordings, measure paired operator/projector performance, run control/silence regressions, then deploy and inspect hosted output. Current 3D sculpt remains far below the approved generated moving reference; framing work does not approve its art.

## User rejection: lower-body continuity
The latest buffered v4 take passes encoded framing but the user explicitly rejected its ending because the lower body disappears. It is NOT an accepted complete animation asset. Soft fog may shed and disperse; the recognizable core lower-body silhouette must persist through ordinary idle, listening and gestures. Only an explicit vanish cue may remove the character. Approvals of v2 softness/acting remain visual direction; do not count a margin pass as anatomy/continuity approval.

## Local compositor integration checkpoint
`assets/spirit-frame.js` now renders the actual body canvas and world-space vapor together on a tiled overscan surface before a shared safe transform. It reserves at least15% each edge, preserves projection mapping and stage controls, and holds the largest symmetric source envelope through a shot to avoid zooming up and down with individual puffs. Blackout/clock rewind resets the envelope. Local integration exists in app.js; this does not imply deployment or premium character art acceptance.

Actual compositor test:600frames and40pixel-scanned frames perChromium/WebKit pass15% alpha containment, blackout/fog cleanup and disposal. Main application test covers24 rendered pixel checks across original painted,3D and painted-performance modes, four actions and a silent projector. Short nativeMacM4Pro pairedABBA test holds~120fps with and without this compositor; it is not a physical-projector measurement or an isolated evening soak.
