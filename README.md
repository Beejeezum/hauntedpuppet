# Haunted Puppet

A painted Wisp character with native voice conversation, a laptop show dashboard, a silent projector view, and a paired phone director.

Hosted desk: https://hauntedpuppet.netlify.app. Hosted phone control uses the paired room described in [Cloud phone control](docs/CLOUD-PHONE.md). The hosted voice backend and operator authentication are described in [Hosted voice setup](docs/CLOUD-VOICE.md). Connecting Netlify does not supply an OpenAI API key; configure the server-side secrets once, redeploy, and sign in as operator.

![Wisp on the projection stage](docs/wisp-stage.png)

Wisp's approved 2D artwork stays intact. The character floats, blinks, looks toward visitors, reacts and speaks with mouth shapes drawn from transparent painting layers.

## Run on the laptop

Use Python 3.9+ and a current Chrome browser. Start with:

```sh
python3 server.py
```

Open **http://127.0.0.1:8770/**. On a Mac, `Start.command` also launches the desk. Click **Connect OpenAI securely** and enter the key in the private local dialog. On Mac, it is saved in your Keychain and loaded automatically on future launches. For a development shell, the server also accepts `OPENAI_API_KEY` from its environment; never save it in this repository.

Choose **Native live conversation**, select a voice and microphone, then **Start live conversation**. Marin and Cedar are the initial casting choices. Wisp responds with streamed audio and can be interrupted. **Stop All** releases the microphone and stops every performance; **Blackout** also clears the projected picture.

A clear goodbye finishes a short farewell and returns Wisp to idle loops. The operator chooses whether the microphone stays live for the next visitor. Quiet timeout releases it after inactivity. Local idle animation makes no voice requests.

The OpenAI project must have access to the configured Realtime model. Connection failures are shown at the desk; native conversation is not silently replaced by slower speech.

## Direct live puppeteering and voice kits

Choose **Puppeteer · my live voice** in the main Performance mode selector. Select the private operator microphone and press **Start puppeteering**. Your speech passes through a local AudioWorklet into the existing show audio and mouth-animation path. It does not record a turn, transcribe, call OpenAI, or wait for an AI response. It works without an operator cloud login or API key.

Cute Wisp selects **Little cartoon ghost** (+4.5 semitones, bright presence, light ambience). Scary Wisp selects **Ghastly spirit** (−8 semitones, a blended lower voice, soft distortion and darker ambience). Form changes smoothly update the processor. **Fine-tune the character voice** adjusts pitch, character strength and ambience; setting strength to zero gives the unshifted voice. These are original local effect presets, not trained custom voices or voice cloning. AI conversation keeps its separate native casting and acting instructions.

**Mute live mic** silences the local route while retaining the device. **Stop puppeteering**, **Stop All**, changing mode/input, page close and processor failure release microphone tracks. Silence restores idle animation without closing the direct session; speaking resumes mouth motion. The projector and paired phone remain silent. Use a close operator microphone separated from the show speaker, and rehearse the speaker level before opening the show. Actual hardware and browser buffering add latency; no physical round-trip latency is claimed by synthetic tests.

## Projector and phone

**Open projector** creates a separate silent view. Move it to the projector display, click it, and press **F** for fullscreen. Loss of the laptop controller blanks the output.

Under **Phone remote**, explicitly enable the LAN service. Put the phone on the same trusted Wi-Fi, scan the displayed address, and enter the six-digit pairing code. The phone can direct gestures, gaze, audience, idle loops, prepared moments, volume, Stop and Blackout. The laptop continues to own the microphone and sound.

![Paired phone director](docs/phone-controller.png)

The local dashboard listens only on loopback port 8770. The optional phone service uses port 8771, paired permissions and a restricted command list. It does not expose provider credentials. This first remote uses HTTP on trusted local Wi-Fi; it is not an internet-facing deployment. Disable it or revoke phones from the laptop when finished.

## Prepared performances and art

Included rehearsal and show cues work offline. Preparing new spoken lines uses OpenAI and can retain forced phoneme timing. Install the optional English aligner with `python3 -m pip install -r requirements.txt` or use `Setup Alignment.command` on Mac.

Native streaming mouth motion is an acoustic estimate driven by the audible signal. It is not phoneme recognition. Both cute and scary Wisp now use painted rigs. Form changes use six generated painted morph keyframes, played forward or backward between the exact existing endpoints. The face, hands, silhouette and tail evolve through those drawings. Cute Wisp also has a six-cel painted tail cycle during floating and active movement; it retains the original tail when optional art is unavailable and holds still under reduced motion. This is a short six-key cel sequence, not a fully hand-inbetweened 24fps animation. If its optional atlas cannot load, the staged raster transition remains available.

## Development and tests

Use Node 22+ for browser tests:

```sh
npm ci
npx playwright install chromium
python3 server.py
# In another terminal:
npm test
```

Tests cover painting integrity, mouth/expression combinations, stop and late-response cancellation, silent projector sync, native WebRTC lifecycle with a local simulated peer, phone pairing/control/revocation and automated accessibility checks. CI runs without an OpenAI key. A simulated peer checks browser media and state behavior; it does not prove provider access or physical microphone performance.

Genuine provider results, device rehearsal limits and remaining production work are recorded in the test evidence and production roadmap. Do a real speaker/microphone rehearsal in the venue before a show.

## Project map

- `server.py`, `realtime_voice.py`: local server, trusted native session creation and cleanup.
- `app.js`, `assets/painted-wisp.js`: character renderer, shared audio clock and silent projector sync.
- `assets/realtime-voice.js`, `assets/show-controls.js`: streaming conversation, encounter lifecycle and director controls.
- `phone_bridge.py`, `phone_remote/`, `assets/phone-bridge.js`: optional paired phone director.
- `assets/wisp/`: approved registered paintings, pivots, masks and integrity checks.
- `docs/`: production roadmap and evaluated open-source components.
- `tests/`, `.github/workflows/`: local and CI regressions.

Third-party licenses are retained with their components. Original character art and application code are not automatically relicensed by this public repository. See `ASSET-SOURCES.md` and `docs/OPEN-SOURCE-COMPONENTS.md` for provenance.

## Projection studio and authored moments

Open **Projection studio** to fit Wisp to a physical sheet, window, or portrait frame. Drag the four corners or use arrow keys; Shift + arrow adjusts faster. Exact planar perspective keeps lines straight. Choose brightness, soft edges and an optional oval mask, then save or export the surface. The alignment pattern is for setup only and is suppressed by Blackout. A lost operator desk blanks the projector.

**Enchanted mansion** adds the original painted window scenery. **Floating Wisp** keeps the backdrop pure black. Scenery does not replace or recolor the approved character artwork. Three authored stories combine existing recorded cues, gaze and gentle gestures; they stop on operator takeover and return to waiting.

The built-in mapper currently calibrates one planar surface. It does not solve a room from a camera, drive multiple independently mapped characters, or perform multi-projector edge blending. The [immersive production research](docs/IMMERSIVE-PRODUCTION-RESEARCH.md) describes the next systems and researched libraries, with licenses and integration limits.

## Front-door performance and costume cues

Wisp now uses short doorstep turns (usually 3–12 words), expressive cartoon ghost direction, broad bounded hovering, roaming left/right paintings, occasional double blinks and an operator-triggered small-visitor bow. The bow is whole-character acting; downward-looking eye artwork is not yet supplied. End an active voice session, refresh, and start again to load the new server instructions.

The searchable costume board contains 100 curated possibilities and original brief quips, with extra variations for common quick picks. Select a costume, preview its lines, then press **Say selected quip**. Live sessions use the current native voice without fabricating a visitor transcript; the cue waits if a visitor is speaking. Without a live session, it uses prepared speech through the connected service. Stop speech and global Blackout retain priority. Each spoken generation can use provider credits; merely searching and browsing does not. The board is on the laptop dashboard; phone costume selection is not included yet.

This is a practical shortlist, not a measured top-100 ranking. [NRF's October 2026 report](https://cdn.nrf.com/blog/top-halloween-costume-trends-for-2026) supports prioritizing Spider-Man, superheroes and KPop Demon Hunters; the rest balances classics, family favorites and an unknown-costume fallback. The catalog and all quips are in [assets/costume-cues.json](assets/costume-cues.json). Wisp does not have a camera or identify costumes automatically.

The puppeteer controls emphasize attention, bashfulness, delight and surprise, with recorded speeches tucked away. Disney publicly describes studying puppeteers' pantomime and gesture in [Imagineering's character work](https://sites.disney.com/waltdisneyimagineering/autonomous-characters/); the exact internal attraction button layouts are not claimed here. The character prompt uses labeled performance, turn-length and exit instructions following [OpenAI's voice prompting guidance](https://developers.openai.com/api/docs/guides/voice-prompting). Prompted voice acting still needs a real-room listening test; it is not a new custom voice.

## Puppet performance console

The left console keeps Wisp visible while you operate. On narrow screens the same canvas becomes a compact bottom monitor when you scroll; it does not start another renderer or audio route. Big moves include dance, twirl, bounce, peekaboo, candy victory, a deep orbit, Rush forward and Vanish & return. They are interruptible authored beats with anticipation, squash/stretch and recovery. A twirl is a planar 2D spin, not a fabricated view of the character's back.

**Cute/Scary:** choose Big kids to enable scary Wisp. Little ones and Family remain cute. Voice acting instructions follow the form on an existing live connection without changing voice ID or reconnecting. **Welcome kiddos** immediately restores cute Wisp, gentle audience and a clean visitor context. **Stop All** cancels speech and choreography; **Blackout** also blanks scenery and calibration.

**Arm reveal → Reveal! BOO:** explicit Big-kids-only operator cue. Arming expires after ten seconds and plays nothing by itself. The routine gives a friendly setup, a suspicious pause, a scary pop and goofy recovery. With native voice connected it waits for actual spoken audio to finish before the reveal; otherwise it runs silently. A visitor interruption, Welcome, Stop or cancellation prevents later queued reveal beats. The growly BOO is voice acting requested from the model, not a guaranteed or pre-recorded sound effect.

Paired phones now have the same bounded movement/form/reveal controls and a priority Welcome kiddos command. A priority reset cancels queued scare commands. The laptop remains the only audio and microphone owner. The operator chooses the audience; there is no camera or automatic age detection.

The scary rig includes four independently articulated painted body pieces, twelve mouths including a fanged roar, and ten eye states including downward gaze and sinister eyes. Scary speech owns its mouth just as cute speech does. Actual generated-speech phoneme timing remains distinct from approximate live acoustic mouth animation. The cute rig still uses a downward bow rather than a new downward-eye painting. See [puppeteer experience notes](docs/PUPPETEER-EXPERIENCE.md) and [scary asset handoff](assets/wisp-scary/PRODUCTION-NOTES.md).

## Foreground and distant flight

The existing entrance, fly-by and orbit routines now include pronounced apparent depth. **Rush forward** and **Vanish & return** shrink the whole painted character to a distant speck, hold that pose, then rush back toward a near-stage-height foreground silhouette before settling. Both cute and scary rigs share the same perspective-scale choreography. The three routines last 5, 5.4 and 6.4 seconds respectively; motion strength uses exponential depth scaling so ordinary settings still reach a very small distant pose. Reduced-motion preferences retain a restrained lean and scale change.

The animation keeps the existing registered face/mouth stack attached as it scales. Stage fitting bounds the foreground pose and Stop cancels the move with a short settling handoff. Voice continues through these silent moves, and paired phone buttons expose the same actions. This apparent-distance effect uses the2D artwork and existing projector mapping.


### Character and eye workshop

Open `/assets/character-workshop.html` from **Apparition tricks** to review the new organic Wisp design, actual front/three-quarter/back paintings, and a modular painted-eye study. The original speaking rig remains the production character while replacement art is refined. The workshop is silent and opens no microphone. Its turns are three authored key views, not a finished full cel sequence.

The console now has **Only the eyes**, a six-second dissolve/watch/reform action. **Body wisps** under Performance movement controls the bounded painted wake; zero disables it. Wisps spawn from the lower character envelope, inherit motion, slow and settle, and clear on Blackout. The extra detached tail cel is disabled by default. Independent local facial acting preserves frozen art references.

See `docs/EYE-ACTING-RESEARCH.md` for eye anatomy/gaze tooling and `docs/CHARACTER-PRODUCTION-V2.md` for the authored animation pipeline and license comparisons. New generated artwork and prompts are versioned under `assets/wisp-v2/` and `assets/spirit-effects/`.
