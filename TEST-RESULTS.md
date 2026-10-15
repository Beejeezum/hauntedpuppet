# Painted Wisp 0.7.1 — validation scope

## Passed locally

- All 23 registered PNGs match the supplied source bytes and 1024×1536 dimensions. Six revised feather exports are included.
- Native default composition matches the supplied assembled painting with mean premultiplied RGB error approximately **0.0007 / 255**. No body/face redraw, duplicate eye layers or added procedural character.
- All **88 mouth/expression combinations** retain one upper-face and one mouth layer.
- All **5,632 maximum movement-envelope cases** fit inside the source stage, including outward wave, tail, glow and speech nod.
- Actual audio-clock cues choose distinct painted mouths, return to rest in pauses/completion and use a unique performance instance for replay.
- Half/full blink stages restore mood; gaze uses the supplied left/right paintings. Greeting wave opens outward and cancels cleanly.
- Stop All clears mouth, queued work, pending browser requests and microphone. Late responses cannot resume speech.
- Projector uses the controller's timestamped audio-relative cues and creates no AudioContext. Closing/reopening output does not replay audio. Losing the controller blanks it and returns mouth to rest.
- Blackout is pure black. Missing asset reports a useful file list and never displays partial floating facial layers.
- Synthetic microphone input passes MediaRecorder → transcription payload → suggested reply → approval → speech, plus automatic host and operator relay. Cloud conversation endpoints were mocked for this test.
- HTTP security and conversation backend validation tests pass.

## Independent coordinated verification

The art task replayed real generated **6.8-second speech with 53 forced phoneme cues**, observed distinct painted mouth shapes, measured nonzero final audible-path RMS (~0.122), exactly one audible destination and zero projector audio contexts. Maximum sampled local projector clock offset was **6.8 ms**. This is a browser test measurement, not a physical projector/speaker latency guarantee.

Thirty replay/interruption/endurance cycles passed with projector reopen and stale-controller blanking. A subsequent **real unmocked speech request** from the app generated/aligned a 5.8-second Wisp greeting and produced nine distinct painted mouth states. The generated audio and rendered screen were recorded for review.

## Not passed / still needs user setup

The existing speech bridge is configured and the aligner works. **Conversation is now directly connected in the current session.** A fresh server still needs the user to supply a key. Real cloud transcription, reply and speech calls passed after the JSON-format repair; a synthetic microphone carried recorded test speech. Physical microphone, room noise, speaker echo and target ViewSonic setup still require rehearsal.

The Mac bundle is assembled and statically checked; unsigned distribution/first-run installation on another Mac is not validated. Continuous mesh deformation, large head turns, evil Wisp and a painted transformation are not implemented because the required art/rig is absent. The corresponding controls are disabled rather than using the superseded blockout.

## 0.7.1 real voice-chat repair

Reproduced actual failure: transcription200; reply400 requiring the word JSON in input. Fixed backend input and added a live-client compatibility reminder, preserving the connected key without restarting. Real full browser flow then returned all three endpoints200, forced alignment75cues/8.1sec, eight painted mouth states, zero granular layers, peak output RMS0.07055 and no page errors. Stop released the mic. The earlier mock test now asserts this format contract instead of hiding it.
