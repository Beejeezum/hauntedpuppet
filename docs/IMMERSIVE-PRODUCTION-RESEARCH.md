# From talking sprite to interactive attraction

Research and implementation review, October 15, 2026. Repository metadata was checked against GitHub's primary API; see `github-research-metadata.json`. A last push is a maintenance signal, not proof of production readiness. The current project keeps the approved painted Wisp character.

## What actually failed

The first Netlify deploy published static files from the repository root. The dashboard loaded, but `/api/status` returned HTML404 and no functions existed. Browser microphone permission cannot fix a missing backend. The new public build publishes only browser files; functions are bundled separately. The laptop's Mac Keychain and a cloud function's environment are different credential stores.

Native speech should follow [OpenAI's unified WebRTC connection](https://developers.openai.com/api/docs/guides/voice-webrtc#connecting-using-the-unified-interface): a trusted server authenticates the SDP/session exchange, and audio travels over WebRTC. A phone remote should direct the laptop performance, without becoming a second microphone or speaker. Never make a phone navigate to a laptop loopback URL: `127.0.0.1` on the phone means the phone itself.

## Implemented in this revision

- A dedicated public build allowlist, separating Python services and backend functions from CDN files.
- A projection studio with exact planar perspective mapping, keyboard/draggable corners, brightness, soft edges, oval masking, three placement presets, alignment pattern, saved local setup, and validated import/export.
- GPU perspective mapping for configured surfaces; the untouched black/default frame takes the fast canvas path. These are single planar surfaces, not camera-solved geometry or multi-projector edge blending.
- An original painted mansion background plate. Floating Wisp stays on pure black by default. The mansion is opt-in, fades with Wisp, and uses slow, small brightness changes rather than flashing beats.
- A clearer desk hierarchy with persistent Wisp preview on desktop, live conversation beside it, direct show moments, section shortcuts, and compact setup/rehearsal disclosures.
- Phone connection recovery, status clarity, storage fallback, volume feedback, and failed-command feedback improvements. A separate restricted cloud room adapter and transactional database now support the hosted desk; see CLOUD-PHONE.md.

## Libraries worth adopting deliberately

| Project | Role in Haunted Puppet | Evidence / license | Decision |
|---|---|---|---|
| [p5.mapper](https://github.com/jdeboi/p5.mapper) | Multi-surface quads, triangles, Bezier masks and LED lines | MIT; v3 README requires p5.js2 | Best reference for the next mapping editor. Do not introduce p5 just to fit one Wisp quad; current exact mapper is smaller. Prototype multi-surface requirements first. |
| [PixiJS](https://github.com/pixijs/pixijs) | Batched painted layers, filters, masks, textures | MIT; maintained 2D GPU renderer | Good when atmosphere, several characters and large textures make Canvas expensive. Keep the approved registered layers and measure rendering benefit before migrating. |
| [Theatre.js](https://github.com/theatre-js/theatre) | Visual keyframe authoring and rehearsable animation timelines | Core Apache2; Studio editor AGPL3 ([README licensing](https://github.com/theatre-js/theatre#license)); last public repository push2024 in snapshot | Strong fit for art-directed entrances and story beats. Pin a version, verify editor/runtime compatibility and maintenance before basing show operation on it. |
| [Butterchurn](https://github.com/jberg/butterchurn) | Full-screen WebGL2 audio-reactive scenery | MIT engine; README exposes audio-node connection/preset blending | Optional adult/party intermission layer. Curate presets separately; extreme flashing and abstract music visuals would distract from Wisp. Never replace character art. |
| [MapMap](https://github.com/mapmapteam/mapmap) | External dedicated mapping for complex physical sets | GPL3 desktop application | Use as a separate mapping destination. Validate capture/output routing on the actual laptop before recommending it for show night. Not a browser dependency. |
| [OBS Studio](https://github.com/obsproject/obs-studio) | Browser-source compositing, rehearsal recording and clean projector output | GPL2-or-later desktop application | Useful external production workstation. Run a silent browser source, route audio only once, test projector monitor and source timing. Not implemented here. |
| [NodeCG](https://github.com/nodecg/nodecg) | Coordinated operator panels and browser graphics | MIT; Node/browser broadcast platform | Consider for multiple staffed booths and several output surfaces. Adds another long-running server; unnecessary for one laptop/one phone today. |
| [Bitfocus Companion](https://github.com/bitfocus/companion) | Physical Stream Deck controls and coordinated venue equipment | Root license requires full review; details in SHOW-CONTROL-RESEARCH.md | Best operator hardware extension. Build an explicit paired adapter, never open the provider API to arbitrary remote commands. |
| [Three.js](https://github.com/mrdoob/three.js) | Real 3D environments or curved mesh surfaces | MIT engine; individual example assets have separate licenses | Add only for real spatial scenery/mesh mapping. The 2D character does not require a 3D rewrite. |
| [glfx.js](https://github.com/evanw/glfx.js) | Image effects and perspective transformation reference | MIT; last push2023 in snapshot | Useful reference, but bringing an older effect stack in for one transform is unnecessary. No code copied. |

No listed library is presented as integrated merely because it was researched. The original mapper and scenery code have no copied third-party implementation. New actual dependencies must be pinned, attributed and tested separately.

## Voice, lips and native venue output

[Pipecat](https://github.com/pipecat-ai/pipecat) is a BSD2 Python voice/multimodal pipeline framework with provider adapters and structured conversation flows. [LiveKit Agents](https://github.com/livekit/agents) offers server-side voice agents, WebRTC rooms, provider plugins and turn detection. Both are useful if Wisp needs several AI voices, camera input or several simultaneous booths. Both introduce a long-running worker/transport service that ordinary Netlify Functions do not replace. They are not bundled here. The current direct OpenAI WebRTC path is appropriate for one laptop encounter; moving to a framework should solve a measured limitation, not add another untested server.

[Rhubarb Lip Sync](https://github.com/DanielSWolf/rhubarb-lip-sync) is a permissively licensed offline tool for producing timed 2D mouth shapes from recorded audio. It is a useful independent comparison for prepared cues, not a native live-audio timestamp feed. Map its shape labels deliberately onto Wisp's existing mouth art and check the result with the actual recording. Avoid claiming perfect lip timing from amplitude-only live mouths.

[Syphon](https://github.com/Syphon/Syphon-Framework) shares video frames between Mac applications under a Simplified BSD license. It can be a strong later bridge to dedicated mapping software without recording/re-encoding the screen. A normal browser tab cannot become a native Syphon server by importing a JavaScript package; a tested native host/bridge is required. Today the silent fullscreen browser projector is the shipped output path.

## The creative system

Build an encounter, not a continuous chatbot. Wisp waits with several subtle local routines. A visitor enters: he turns toward a marked spot and acknowledges them. He listens visibly, answers briefly, reacts with a glance or embarrassed pose, and occasionally performs a rehearsed surprise. On goodbye, he finishes a single farewell, clears the visitor's context, and resumes local idle. Operator Stop/Blackout takes priority over every AI request or animation.

The strongest next scenes:

1. **Living mansion window.** The physical window becomes a portal. Wisp peeks from one side, hears a visitor, and floats forward. Dim painted scenery gives the face depth without competing with it. The mapper and background plate support the first version now.
2. **Portrait that notices you.** An oval mask fits a real frame. An operator or later consented presence sensor sets left/center/right gaze marks. Wisp reacts before speech starts, then addresses the visitor. Sensor inference must not be confused with reliable age detection; gentle audience selection remains an operator choice.
3. **Candy inspection station.** A visitor presents candy, Wisp asks a short comic question, an authored inspection routine follows, and the phone operator can quietly choose a punchline. Visual object recognition is a separate future feature with an explicit camera permission and failure fallback.
4. **Hide-and-seek across surfaces.** Wisp vanishes from a window and peeks into a neighboring frame. This needs one authoritative scene clock, two independently calibrated surfaces, and an art-directed entrance path. Avoid playing duplicate Wisp audio in each output.
5. **The room conspires with him.** A cue gently dims practical lights or starts a mechanical prop while Wisp acts proud. Use a bounded cue adapter and manual emergency stop; AI can request known cues, not choose arbitrary device instructions.

## Rails for real production

Separate five concerns: persona/dialogue, speech transport, animation state, scene composition, and show control. Every encounter has an ID; every async request has an abort signal/deadline; every voice generation has ownership. Reject late events from previous encounters. Mouths close on actual output drain/interruption, not when response text completes. Ambient animation stays local and does not spend model tokens.

Native voice should sound like a performed character through wording, pacing, warmth, short replies and deliberate reactions. Pitch modulation and duplicated spectral voices are not the default route to personality. [OpenAI custom voices](https://developers.openai.com/api/docs/guides/custom-voices) require eligible-account access and a voice actor's audio sample plus consent recording. A custom recorded or licensed voice requires a separate provider/voice-rights workflow; naturalness must be judged in the real room, not only through synthetic test audio.

Native mouth motion currently estimates acoustic energy and spectrum. It is not phoneme-accurate viseme timing. Prepared cues can use aligned visemes. For highly polished live close-ups, evaluate a streaming phoneme provider, live speech-to-viseme analysis, or an authored mouth rig with better transitional paintings and independent lip/cheek motion.

The major art ceiling is the set of supplied paintings: big rotations, squash/stretch, breathing deformation, eyelid nuance, and cute-to-evil transformation require new matching art or a proper 2D deformation rig. Software cannot create those visual frames by switching a checkbox. Preserve the beautiful base character while expanding the art package.

## Acceptance gates

**Software:** hosted JSON health status; authenticated SDP exchange; genuine provider audio; measurable first-audio delay; denied/busy microphone; network loss; reconnect; mid-speech interruption; quoted-goodbye versus real exit; context reset; silent projector; phone control acknowledgement; all-black emergency output; saved calibration; corrupt setup rejection; reduced-motion behavior; sustained render test.

**Venue:** physical projector brightness/black level, scrim or window reflectance, perspective alignment at viewing positions, sound direction, microphone distance, ambient crowd noise and feedback, child comfort, operator visibility, Wi-Fi reliability, and one full dress rehearsal with an actual visitor. Automated browser tests establish software behavior, not attraction-quality claims.

**Next implementation order:** finish authenticated hosted voice and measure real latency; refine operator desk; tune physical setup; author three exceptional routines; expand painted acting frames; then add multiple mapped surfaces and hardware cues. This order makes each addition visible and testable.
