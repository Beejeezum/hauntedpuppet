# Stagehand rehearsal — design QA

final result: passed

This result applies to the working local rehearsal interface, not approval of the
unfinished attraction, voice, phone pairing, new wave joins or physical projection.

Source visual truth: `source/attraction-v2/design/phone-concept-1.png`.
Implementation: `http://127.0.0.1:8901/source/attraction-v2/console/`.
The first displayed concept was adopted as the working direction after “nice keep
going”; the human did not explicitly select a numbered option.

The user requested a production-app replacement, with laptop and popup output,
inside the existing repository. This is an incremental ES-module route using that
runtime, not a new standalone mobile-frame prototype or a different app framework.

## Evidence and normalization

- Source is 853×1844, normalized to 390×844 for comparison (minor aspect rounding).
- Final mobile rendering is 390×844 CSS/pixels at deviceScaleFactor1, Host selected,
  friendly film running. The exact animated pose differs from the concept still.
- Combined input inspected: `work/attraction-v2/design-comparison-final.png`.
- Focused controls: `work/attraction-v2/design-controls-final.png`; earlier detailed
  icon/typography comparison: `work/attraction-v2/design-controls-comparison.png`.
- Final screenshots: `work/attraction-v2/design-mobile-final.png`,
  `design-desktop-final.png` (1280×900), `design-sequence-final.png`.
- The page was also operated and visually inspected in the in-app browser, including
  actual idle, queued wave, scary form, Stop and Output settings. Automated captures
  accompany the user's standing request for regression/browser testing.
- Durable copies of final captures, combined comparisons, browser reports and the
  summarized frame-envelope audit are in `source/attraction-v2/design/rehearsal-evidence/`.

## Findings and repair history

1. [P2, fixed] The added setup row and cue captions pushed the mood/sequence controls
   off the first mobile screen. Initial combined evidence:
   `work/attraction-v2/design-comparison.png`. Moved projector/sound setup into Output,
   reduced mobile vertical gaps and pad height, and retained44px minimum footer
   targets. Final mood/sequence bottom is834.625px within the844px viewport. Stop,
   Auto handover and the sequence drawer all fit. Post-fix evidence is the final
   combined input plus `work/attraction-v2/layout.json`.
2. [P2, fixed in test infrastructure] The test server served SVGs as arbitrary binary
   data, so its first screenshots showed broken icons despite the real local server
   displaying them correctly. Added the correct SVG and font MIME types and an
   image-load assertion. All vendored icons now render in both tested engines.
3. [Intentional] The concept's oversized ghost loses smoke outside its preview. The
   real preview shows the entire projector frame, using identical fixed85%framing
   across all films to meet the user's explicit20%safe-envelope requirement. The
   smaller preview character is not a failed attempt to imitate the crop.
4. [Intentional] Connected becomes the Output button (Output · live when running), unsupported actions are disabled and
   speech becomes a labeled line notebook. These changes prevent the concept from
   promising absent phone, voice or media capabilities. They are not production
   readiness claims. Sequence is an added working requirement from the brief.

5. [P2, fixed] The stopped-state portrait was larger than the film, causing a size
   change on Start. The poster now comes directly from the packaged first frame.
   Verified in the in-app browser after reload; playback layout and footage unchanged.

No remaining actionable P0/P1/P2 interface findings for this rehearsal scope.

## Required fidelity surfaces

- Typography: locally vendored Nunito Sans400/600/700, Georgia display wordmark;
  strong primary labels, smaller explanatory captions, no clipped critical text.
  The serif wordmark does not exactly reproduce the concept's illustrated glint.
- Spacing: black preview, Now/Next,2×3pads, notebook, Auto handover in the same
  hierarchy. Mobile primary controls fit; desktop has a larger side-by-side stage.
  At320px the page scrolls vertically but has no horizontal overflow.
- Color: near-black base, cream text, amber Welcome/selection, muted violet Spook,
  red Stop. The mock's glossy gradients become flatter production colors; dimmed
  unfinished pads deliberately differ from its all-enabled mock state.
- Image quality: existing painted artwork and actual whole-body films, no vector
  substitute or detached facial pieces. Original timing/frame order. Fixed framing
  preserves smoke; all728frames have20%clearance at the audit'slowRGBthreshold.
  Source concept image and supplied Wisp art were reused; no replacement generation.
- Copy: main intention labels retained; local-rehearsal and draft-only wording makes
  current capability explicit. No claim that the browser detects nearby guests.
- Icons: pinned Phosphor bold assets, not drawn substitutes; package license retained.

## Interaction and regression evidence

`tests/attraction-v2/stagehand-browser.cjs` passes in Chromium and Mac WebKit with
actual packaged films at1×: wave→idle, cute→scary→cute, a single advancing source,
no blank presented frames/backward media time, silent popup, owner-RAF suspension,
Stop/blackout, restart, ordered saved sequence, changed-asset hash rejection and
Stop while assets load. Browser page errors:0. Audio intentionally muted throughout.

`stagehand-layout.cjs` passes first-screen controls,44px footer/Stop targets,
320px horizontal overflow check and automated WCAG A/AA scan (0violations).
This is not an exhaustive accessibility or physical phone evaluation.

24 planning/core tests pass. Existing default projector ownership/handoff regression
passes after adding an optional independent popup name for the rehearsal.

## Follow-up polish and open work

- P3: closer serif branding/glow and a full bespoke icon treatment, after the actual
  show experience is accepted; current library icons are clear and consistent.
- Human review of loop velocity and wave joins remains open. Automated frame
  continuity alone cannot certify beautiful acting or seamless motion.
- Phone pairing, native-player comparison, speaking characters, remaining media,
  real-duration soak, sound listening and yard projection tests remain outside
  this interface QA pass. Production Netlify remains the previous version.
