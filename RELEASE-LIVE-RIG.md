# Live painted rig and performer tracking

The main operator and silent projector use a PixiJS textured mesh for friendly Wisp, with separately painted arms, wrist deformation, damped secondary motion and an independently rendered painted face. The original rig remains a fallback when WebGL is unavailable. Five painted directional keys support the twirl; these are key drawings, not a fully modeled 360-degree character.

“Perform with your face” in the conversation booth explicitly starts local webcam tracking. MediaPipe inference runs in a local worker. Frames are neither recorded nor sent to the voice provider. Only bounded expression coefficients reach the local projector. Stop, lost tracking and camera errors return control to autonomous acting. Speaking audio continues to drive the mouth while Wisp is speaking.

Pinned upstream software is retained under assets/vendor with licenses: PixiJS 8.22.0 (MIT), MediaPipe Tasks Vision 1.1.1 (Apache-2.0). The face model and WASM load only when requested. The camera Permissions-Policy allows same-origin capture; browser permission is still required.

Validation includes Chromium and WebKit live rig checks, continuous independent arm motion, stage bounds, silent projector, Stop camera cleanup and blackout. Face tests exercise synthetic expression inputs, stale tracking, denied/late permission, worker failure and cleanup. An additional smoke check initialized the actual worker/model/WASM, then deliberately denied camera access. Physical webcam performance and genuine provider speech were not captured as part of this release check.
