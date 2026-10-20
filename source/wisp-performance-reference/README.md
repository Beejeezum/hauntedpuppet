# Approved moving Wisp reference and complete-effect framing

The user approved the dimensional, articulated acting of wave v1 and then the softer fog-bodied material/motion of fog v2. Keep those approvals separate from framing: fog v2 clips in every decoded frame and is not a final usable shot.

User-facing references and per-frame reports are in `outputs/wisp-vision` beside the repository. `wisp-fog-buffered-v4.mp4` is a framing demonstration only, REJECTED as character animation because its lower body disappears at the ending: 121 frames/24fps/1280×720; all visible connected fog at max-RGB thresholds 8,16,32 remains inside a 15% margin. Native AVFoundation uniformly scales the complete, uncut stationary v4 take to 84%. It does not reconstruct clipped pixels or repair anatomy. Preserve the original generated videos. The prior wide v3 take is rejected for its late approach toward camera.

## Reproduce frame inspection

From the repository root:

```
python3 source/wisp-performance-reference/check_framing.py ../wisp-vision/wisp-fog-buffered-v4.mp4 --report ../wisp-vision/wisp-fog-buffered-v4-framing.json
```

`frame_video.swift` reproduces the native uniform-scale export. Its two positional arguments are the uncut v4 video and a new output path. It intentionally uses a fixed shot transform; no per-frame camera zoom. The current native SDK emits deprecation warnings; export success and decoded-frame validation are the evidence, not a warning-free build.

## Compositor geometry scope

`SpiritAtmosphere.bounds()` now reports the exact rotated raster quad union for all living particles after simulation/drawing. The method includes transparent atlas padding conservatively and clears to null on Stop/blackout/reduced motion. Geometry is independent of image opacity thresholds.

`effect-frame.js` fits the union of body and vapor to a safe rectangle, respecting requested scale/offset without unsafe interpolation. It does not recover clipping in its input images. The integrated compositor renders the complete effect to an adequately sized overscan surface first, then applies one transform to both body and atmosphere before projection mapping. Do not merely shrink a cropped body canvas, ignore detached wake particles or fade a hard clipping boundary. Preserve laptop audio ownership and silent projector/phone.

The geometry pilot tests 1800 frames and235688 actual rotated particle-quad corners per browser, including rapid movement and extreme requested output offsets. Chromium and WebKit each pass15% containment, pool bounds and clear/reduced-motion reset. Existing vapor Stop/blackout/clock-reset/lag checks still pass. These checks do not establish a finished live compositor, stable shot envelope, target cadence or physical projection acceptance.

Before production integration: choose a stable authored shot envelope including vapor, test the actual overscan composition pixels through actions/morphs/interruptions, inspect full-speed recordings, measure paired operator/projector performance, run control/silence regressions, then deploy and inspect hosted output. Current 3D sculpt remains far below the approved generated moving reference; framing work does not approve its art.

The integration checks described above subsequently passed and shipped in runtime commit3c87886. Full CI38958262578 completed successfully, including WebKit and the regression job. Hosted studio framing was checked in Chromium. These facts supersede the earlier integration-pending notes; physical projection and finished character quality remain unverified.

## User rejection: lower-body continuity
The latest buffered v4 take passes encoded framing but the user explicitly rejected its ending because the lower body disappears. It is NOT an accepted complete animation asset. Soft fog may shed and disperse; the recognizable core lower-body silhouette must persist through ordinary idle, listening and gestures. Only an explicit vanish cue may remove the character. Approvals of v2 softness/acting remain visual direction; do not count a margin pass as anatomy/continuity approval.

## Local compositor integration checkpoint
`assets/spirit-frame.js` now renders the actual body canvas and world-space vapor together on a tiled overscan surface before a shared safe transform. It reserves at least15% each edge, preserves projection mapping and stage controls, and holds the largest symmetric source envelope through a shot to avoid zooming up and down with individual puffs. Blackout/clock rewind resets the envelope. Local integration exists in app.js; this does not imply deployment or premium character art acceptance.

Actual compositor test:600frames and40pixel-scanned frames perChromium/WebKit pass15% alpha containment, blackout/fog cleanup and disposal. Main application test covers24 rendered pixel checks across original painted,3D and painted-performance modes, four actions and a silent projector. Short nativeMacM4Pro pairedABBA test holds~120fps with and without this compositor; it is not a physical-projector measurement or an isolated evening soak.

## Persistent-core prompt retry, rejected
The next five-second Gen4.5take used an explicit persistent-core instruction after the previous prompt was found to request lower-body dissolution. V5 retains a lower core in reviewed ending frames, but elongates the character into a thin shape and grows its framing. Its121decoded frames include116safe-area failures at all three thresholds, with minimum top1.11%/bottom5.28%padding and no outer-two-pixel contacts. It is rejected, not a production asset. This targeted retry cost60credits; further prompt-only retries are not queued. Start/end-frame tooling is being investigated separately, without assuming its intermediate frames will pass.

## Visible-region continuity diagnostic

`check_continuity.py VIDEO --report REPORT.json` measures adjacent-frame and loop-seam RGB differences only within the union of visible character pixels, so black padding cannot conceal a seam. It also records occupancy of a fixed lower region as a diagnostic. Neither metric proves anatomy, perceptual smoothness or a seamless performance; inspect full-speed/slow-motion playback and intermediate frames. Requires OpenCV and NumPy.

## Speech production route evidence (October 19)

Runway primary documentation: [Act-Two](https://help.runwayml.com/hc/en-us/articles/42311337895827-Performance-Capture-with-Act-Two) accepts driving performance plus character image/video. Video input preserves source body/camera/environment motion; gesture transfer is unavailable with video input. Output is 24 fps; documented cost is 5 credits/sec, 3-sec minimum. Longer driving performances can cause shorter character footage to boomerang, which fails our natural fog-flow direction. It is an offline authored performance route, not proof of arbitrary live responsive animation.

[Character Script to Video](https://help.runwayml.com/hc/en-us/articles/51285026291219-Character-Script-to-Video) accepts character image with typed script+voice or uploaded audio. This offers an integrated scripted speech comparison without recording a user. Evaluate one controlled short take only after the current generic speaking pilot is reviewed, with actual in-app price checked before submission. Preserve the same source and framing; no new camera/microphone access is implied. Neither tool alone satisfies the live AI conversation goal.

## Offline cadence comparison

A pinned local FFmpeg7.1 binary from imageio-ffmpeg0.6.0 was used for one v8 greeting48fps interpolation candidate. See [official minterpolate documentation](https://www.ffmpeg.org/ffmpeg-filters.html#minterpolate). Filter: `tpad=stop_mode=clone:stop_duration=0.125,minterpolate=fps=48:mi_mode=mci:mc_mode=aobmc:me_mode=bilat:vsbmc=1`, duration5.083333333sec, libx264 fast CRF17 yuv420p, no audio. Output244frames; original122frames retained unchanged. All244 pass framing; isolated silent Chromium reports243 distinct presentation timestamps,244totalframes/0dropped. Three sampled adjacent-frame triplets show no obvious double face/hands, but full-speed visual preference, remaining fog artifacts and target projector cadence remain unapproved. This is offline whole-character processing, not more responsive live acting or native48fps source animation.
