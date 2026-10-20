# Painted speech pilot — unapproved

This preserves an authored-art experiment separately from the live app. Open `wisp-speaking-morph-study.html` through the full-repository local static server. It uses no microphone, camera, audio playback or provider requests.

`PaintedMouthSurface` loads the original generated painting plus registration data and supports normalized rest/AH/OO/EE weights. All four paintings map into shared lip contours; the cavity excludes rest-color dilution. Manual AH/EE contour candidates include light teeth and tongue omitted by dark-component extraction. A 32×2 RGBA lookup packs contour coordinates from y470–534 with maximum rounding error about0.126 source pixels. This asset-specific range is checked on load.

`PaintedMouthCues` provides coarse cue mapping, smoothing, stale-to-rest and response-token cancellation. It is not phoneme-accurate. M/F currently map to rest, I to EE, U to OO. Those are approximations requiring better artwork and genuine speech review. It owns no audio context.

The original full painting is unchanged. Source: built-in imagegen output `exec-7b4eff0b-d53b-4a9a-8b7a-935ea01589a6.png`, edited from the earlier four-panel facial study using approved Wisp art. The panels are not approved final sprite frames; smoke padding is inadequate for using the complete panel without fitting. Registration and manual contours remain candidates.

Evidence in the adjacent user-facing `outputs/wisp-vision` directory includes synthetic moving-body rehearsal, browser pixel checks and short frame-timing reports. Chromium and WebKit produced distinct nonempty mouth shapes with nearly identical pixel sums; short RAF p95 was16.7ms/17ms respectively. These checks do not establish sustained target-laptop60fps, final art quality, provider speech, physical projection or operator acceptance. The source video animation is24fps.

Open work: mixed-mouth interior/teeth review, validated moving-face anchors and blink corrections, scary mouth artwork, both-form speech/morph continuity, actual voice integration and cancellation rehearsal, sustained target-hardware tests and physical projection. This pilot is excluded from the public build; it does not replace the painted fallback or any production renderer.

Performance investigation: a longer local run averaged39.37RAFHz and reached342ms stalls. Paired12-second samples isolated substantial mouth cost (mouth-on p9550–57ms). Cropping the owned WebGL output to136×136 mouth/cheek pixels instead of512×768 improved both mouth-on p95 samples to9.2–9.4ms. Isolated stalls remain, including1441ms with mouthOFF and125ms with mouthON. This does not close sustained-performance acceptance.

`tests/painted_speech_pilot.cjs` uses an isolated local server and real Chromium/WebKit shader rendering. Five shape states match a full-head render within one8-bit channel value after cropping. It also checks disposal and cancellation during load, without camera, audio or provider access.

Speech-state bridge (experimental): `painted-speech-bridge.js` consumes the existing authoritative `puppetParams` stream. Current native app speech supplies acoustic shape weights; these take precedence over its scalar jaw estimate. It does not capture audio, call providers, or supply phoneme-accurate lip sync. Stop/idle/near-hidden state retires the current response and resets the mouth. The 64-ID retired window is bounded and does not replace provider-event cancellation in the app. This adapter is not connected to the production renderer; visual integration must first pass whole-character review.
