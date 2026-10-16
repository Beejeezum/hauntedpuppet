# Live painted rig and performer tracking

The main operator and silent projector use a PixiJS textured mesh for friendly Wisp, with separately painted arms, wrist deformation, damped secondary motion and an independently rendered painted face. The original rig remains a fallback when WebGL is unavailable. Five painted directional keys support the twirl; these are key drawings, not a fully modeled 360-degree character.

“Perform with your face” in the conversation booth explicitly starts local webcam tracking. MediaPipe inference runs in a local worker. Frames are neither recorded nor sent to the voice provider. Only bounded expression coefficients reach the local projector. Stop, lost tracking and camera errors return control to autonomous acting. Speaking audio continues to drive the mouth while Wisp is speaking.

Pinned upstream software is retained under assets/vendor with licenses: PixiJS 8.22.0 (MIT), MediaPipe Tasks Vision 1.1.1 (Apache-2.0). The face model and WASM load only when requested. The camera Permissions-Policy allows same-origin capture; browser permission is still required.

Validation includes Chromium and WebKit live rig checks, continuous independent arm motion, stage bounds, silent projector, Stop camera cleanup and blackout. Face tests exercise synthetic expression inputs, stale tracking, denied/late permission, worker failure and cleanup. An additional smoke check initialized the actual worker/model/WASM, then deliberately denied camera access. Physical webcam performance and genuine provider speech were not captured as part of this release check.

## Fluid scary performance revision

Scary Wisp now uses a four-surface textured mesh built from the existing painted body, claws and tail (1,300 mesh vertices), with independently delayed wrists, shoulders, torso and head, plus eased facial drawing changes. Manual reference poses retain the original renderer. Context loss returns to the original painted path.

The friendly renderer no longer discards updates behind a 30Hz gate. Its face upload draws directly into a small facial surface instead of clearing and copying a full native character canvas. Hidden friendly rendering is skipped when the haunting form fully owns the stage. Authored action/form time follows elapsed wall time even when rendering slows; physics integration remains bounded.

Morph drawings are continuously interpolated and eased into the actual live endpoint puppets. Turn keys also interpolate; these remain painted keys with limited pose correspondence, not a 3D anatomical reconstruction. A true unrestricted 360-degree performer still requires a purpose-built 3D model or a substantially richer authored rig.

The added browser regression samples actual mesh deformation, display-paced updates, nonblank intermediate artwork, pixel continuity around morph endpoints and keys, action bounds, friendly reset and Stop/blackout. Timing measurements characterize the test machine only, not every projector/laptop. Hosted tests do not capture a real webcam or call the speech provider.

The final surface-envelope sweep samples all 13 scary routines at 21 phases with maximum gesture intensity (273 poses). The enlarged transparent render targets retain claw extensions beyond the original 1024-pixel artwork canvas, while the stage fit still bounds the projected silhouette. Friendly Wisp also has a padded surface matching its existing conservative envelope.
