# Fog body layer study — not shipped

Generated unchanged from the approved friendly fog artwork using built-in imagegen, true RGBA1024×1536. Face and arms are removed so native eye/mouth/arm controls can operate independently. The current source hash, alpha edges and provenance are in validation.json. This is a candidate body layer, not a completed puppet kit.

review.cjs substitutes only this front body texture into an isolated silent browser; production assets, voice, webcam, phone and projector code are unchanged. Six actual render frames compare baseline/candidate at0/2/5seconds. Rendered candidate removes the old solid curls and cyan contour, retains the core, and fits existing face placement reasonably in these views. Existing arms still have blue outlines and visible shoulder joins. Side/back views retain old artwork and would mismatch on turning; do not use those views as evidence of this new body's quality. Motion and material acceptance need full-speed footage, not only stills.

Next work: matching independently skinned arms with registered joints, compatible eyes/mouth surface, fog side/back views and a complete continuous performance. Keep the original painted fallback until those visual and interaction gates pass. Do not promote this texture-only substitution as a production rig upgrade.


## Arm material experiment
arm-left-rejected-v1.png is preserved as a rejected result:98edge pixels exceed alpha8and a blue halo remains. arm-left-v2.png has true alpha and zero edge pixels above8; it removes the cyan line but does not meet the requested17.5%source reserve. These PNGs remain unchanged; validation files include generation provenance and hashes.

Run review.cjs --arm --video for the isolated body+one-arm study. The browser normalizes the new arm's alpha128envelope to the existing rig's coordinate system; this is deliberately coarse and not a substitute for registering shoulder/elbow/wrist/digit landmarks. Captured baseline/candidate poses have zero page errors. The11.92second silent browser recording contains setup plus8seconds of running rehearsal. Sampled motion frames show the raised arm is still thin/tubular with an obvious shoulder join; old opposite arm retains cyan material. Digit registration, volume and shoulder design need work. Not shipped or accepted. The recording is25fpscapture, not evidence of runtime cadence or physical projection.
