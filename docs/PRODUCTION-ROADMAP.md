# Production roadmap

Wisp is a painted 2D character performed by a laptop, projected on a separate display, and directed from the laptop or a paired phone. Native voice should feel like a conversation, and the local animation should remain alive during silence.

## Current delivery targets

- Native WebRTC speech with a consistent Wisp persona, interruption and natural unprocessed casting.
- Farewell returns to configurable silent idle loops; previous encounter memory is cleared.
- Laptop dashboard owns microphone and sound. Projector owns only pictures. Phone owns show commands.
- LAN phone pairing, touch controls, feedback, revocation and emergency stop.
- Repeatable local/CI tests and asset integrity checks.

## Next production passes

1. Human voice casting and room rehearsal: compare Marin and Cedar on the same brief performance; tune microphone placement and speaker echo in the actual venue.
2. Authored animation: add hand-painted in-between cells and a deformation rig that preserves Wisp's silhouette; longer turns, thought beats, warm smiles and complete farewell cycles.
3. Evil Wisp and transformation: matching art direction, identity-preserving transition cells, reversible timing, and an operator-enforced young-visitor limit.
4. Show authoring: reusable cue playlists, ambient soundtrack ducking, cached spoken performances and performance presets.
5. Hardware: physical emergency control, projector brightness/calibration, room-noise rehearsal and long-session reliability.
6. Secure remote audio if requested: HTTPS and explicit microphone ownership; the first phone remote is a controller, not a second competing microphone.

## Quality gates

No clipping or drifting face layers. No speech after Stop. No overlapping audible paths. Idle loops never nag. Farewell waits for the final audible word. New groups do not inherit old conversation memory. Network failure produces a useful operator message while local animation remains available.

A passing browser test does not establish theme-park production quality. Human performance direction, authored movement and physical-room rehearsal remain required.
