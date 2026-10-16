# Painted performance Wisp — replacement candidate

Twenty newly generated painted drawings: six acting silhouettes and four turn views for each cute/evil form. Body artwork intentionally has blank faces. Live original painted eye/mouth components are composited independently so a greeting, laugh or turn does not pause speech or webcam expression input.

Open /assets/wisp-performance-studio.html for the acting reel or /?character=performance for the normal operator, voice, phone and projection path. This is opt-in; the original painted and3D renderers remain selectable. It is a first replacement candidate, not a final animation-quality approval.

poses.js defines named poses, registered landmarks and timed acting beats. The GPU runtime deforms each contributing drawing toward a common blended landmark skeleton, then blends the registered paintings. Anticipation, holds and follow-through come from authored pose beats; low-amplitude breathing/tail lag supplies secondary life. Root and interrupted pose changes settle continuously. Four hand-painted turn views replace flattened front-art turns, and face visibility follows viewing direction. This is a2D pose-space rig, not an arbitrary3D model.

The normal app supplies existing speech weights, webcam facial values, gaze, audience gates, action clock and visibility. Projector/phone stay silent. Acoustic mouth inputs remain estimates. The standalone reel uses explicitly labeled synthetic mouth rehearsal and captures no microphone.

Assets were created with the built-in image generation tool using the approved cute/demon reference paintings. First draft atlases with neighboring-cell bleed were rejected; current acting atlases were regenerated with transparent gutters. Original source paintings are unchanged. Atlas cells are sampled through alpha-bounded texture rectangles; no raster repaint or vector substitute is used. Alpha trimming ignores very faint outer mist but preserves the main painted figure.

Known next polish: more drawn in-betweens for extreme silhouette changes, per-view eye/lid placement, denser hand/elbow landmarks, higher-resolution individual pose production assets, and physical projection review. Pose blending can still reveal soft silhouette transitions; it is not claimed as final frame-by-frame feature animation. New runtime tests exercise every beat and pose, independent speech during gestures, gentle audience reset, silent projector, Stop, blackout and renderer fallback.
