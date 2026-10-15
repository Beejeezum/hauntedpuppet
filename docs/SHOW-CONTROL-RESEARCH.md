# Optional show control: Companion, OSC and MIDI

Research checked 2026-10-15 against primary repositories. These are optional integration candidates; **none is bundled, running, or hardware-tested in Haunted Puppet**. Keep the current paired phone controller as the built-in path. Add external show control through the same typed command dispatcher and acknowledgements, rather than another renderer or audio owner.

## Recommended order

1. **Companion with HTTP** for an operator button deck controlling Wisp, projection presets, prepared performances, and eventually room lighting. It works with the existing command vocabulary and explicit acknowledgements.
2. **OSC adapter** when a projection or audio tool already speaks OSC. Use a narrow path mapping, not arbitrary remote method calls.
3. **MIDI adapter** for a physical pad, foot pedal, or fader. MIDI controls performance choices; native voice audio and the microphone remain on the laptop.

## Candidates and licenses

| Resource | What it contributes | License / packaging consequence | Current limitation for this project |
|---|---|---|---|
| [Bitfocus Companion](https://github.com/bitfocus/companion) | A separate operator control surface and device integration ecosystem | Its [license file](https://github.com/bitfocus/companion/blob/master/LICENSE.md) starts with MIT and includes notices for bundled components. Use its official installation independently; do not copy its entire distribution into this app without its notices. | Not installed or configured here. It does not improve Wisp's character art or voice by itself. |
| [Companion Generic HTTP](https://github.com/bitfocus/companion-module-generic-http) | JSON POST actions, custom headers, response/status variables, image feedback | Repository identifies MIT. | Existing phone API needs a paired, expiring token and a unique command ID per press. A canned button with a fixed ID intentionally fails on its second press. |
| [Companion Generic OSC](https://github.com/bitfocus/companion-module-generic-osc) | OSC sends plus incoming message feedback and variables | [MIT](https://github.com/bitfocus/companion-module-generic-osc/blob/master/LICENSE). | Haunted Puppet currently has no OSC listener. UDP delivery is not a guarantee that a command took effect. |
| [python-osc](https://github.com/attwad/python-osc) | Pure Python OSC client/server and dispatcher for a small optional bridge | [Unlicense / public-domain dedication](https://github.com/attwad/python-osc/blob/main/LICENSE.txt). Preserve the license file if packaged. | Adds an optional dependency and network listener. Needs packet bounds, source restrictions, mapped commands and graceful shutdown. |
| [Mido](https://github.com/mido/mido) | Convenient Python MIDI messages and interchangeable port backends | Code is [MIT](https://github.com/mido/mido/blob/main/LICENSE); its README/documentation carries separate notices. | Real ports require a backend. We have not tested a MIDI device on this laptop. |
| [python-rtmidi](https://github.com/SpotlightKid/python-rtmidi) | CoreMIDI / ALSA / Windows MIDI I/O behind Mido | [MIT wrapper and modified MIT RtMidi](https://github.com/SpotlightKid/python-rtmidi/blob/master/LICENSE.md). Ship both notices when bundled. | Native extension packaging and device permissions vary by platform; keep out of the default lightweight installation. |
| [Companion Generic MIDI](https://github.com/bitfocus/companion-module-generic-midi) | MIDI buttons, faders, incoming feedback and network MIDI | Repository identifies MIT; inspect the versioned package notices before redistribution. | Its help lists MIDI Time Code as receive-only and several features still under “To Do.” Do not assume full MIDI Show Control support. |

The HTTP module's [official help](https://github.com/bitfocus/companion-module-generic-http/blob/master/companion/HELP.md) documents bodies, JSON headers, and response variables. The OSC module's [help](https://github.com/bitfocus/companion-module-generic-osc/blob/master/companion/HELP.md) lists message types and feedback. The MIDI module's [help](https://github.com/bitfocus/companion-module-generic-midi/blob/main/companion/HELP.md) documents supported messages and current limitations.

## Integration contract to build

An optional laptop adapter should own a dedicated paired show-controller session, generate a fresh UUID for each input, and submit the existing `{id, command, value}` envelope. It must read the resulting sequence acknowledgement before showing “applied.” No OpenAI credential, conversation transcript, microphone stream, or laptop bridge secret belongs in a Companion preset or MIDI/OSC message.

Proposed OSC mappings — **not live endpoints**:

| OSC path | Arguments | Existing command |
|---|---|---|
| `/wisp/gesture` | one allowlisted string | `gesture`: wave/laugh/shy/surprise |
| `/wisp/gaze` | left/center/right | `gaze` |
| `/wisp/audience` | little/family/big | `audience` |
| `/wisp/idle` | integer 0 or 1 | `loop`: off/on |
| `/wisp/cue` | known prepared cue ID | `cue` |
| `/wisp/volume` | float 0–1 | `volume` |
| `/wisp/blackout` | integer 0 or 1 | `blackout`: off/on |
| `/wisp/stop` | no arguments | `stop`: null |

Use integer flags instead of OSC booleans for interoperability: Generic OSC's help says its boolean action may not work with every receiver. Limit the listener to loopback by default; LAN input needs explicit operator enablement and an allowed sender. Reply with state/sequence feedback; never infer successful application solely from sending UDP.

For MIDI, map a selected channel and four note-on pads to the gestures, a chosen CC to `volume = value / 127`, and a dedicated note to Stop. Ignore note-off and note-on velocity zero. Debounce repeated hardware events, coalesce fader bursts, preserve emergency priority, and never let a pad undo blackout without an explicit restore action.

## Acceptance before enabling during a show

- Two controllers cannot create two audio owners or fight for the native microphone.
- Repeated IDs, rapid fader movement, disconnected devices, late packets, and reconnects do not replay old performances.
- Stop and Blackout remain immediate under a gesture flood; restoration is explicit.
- The control surface shows stale/disconnected state honestly and acknowledges applied cues.
- Controller loss returns to the configured safe state without revealing calibration overlays to the audience.
- Hardware testing covers the real projector, audio output, physical controller, and venue Wi-Fi. Browser emulation cannot certify that setup.

The biggest production gain is coordinating a reviewed performance cue with projector placement, sound, lighting, and the same character persona. Adding libraries alone does not create that polish.
