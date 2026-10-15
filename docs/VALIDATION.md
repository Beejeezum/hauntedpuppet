# Validation status

## Verified locally

- Python unit and HTTP contract tests: character constraints, native session creation/cancellation/cleanup, phone pairing, ownership, command restrictions and revocation.
- Browser-to-browser WebRTC rehearsal: actual received audio, changing acoustic mouth shapes, interruption, mute, audience memory reset, farewell and restart. The provider is simulated locally in this regression.
- Registered painting integrity: 23 original transparent layers; fixed assembly and mouth/expression coverage.
- Mobile layout and automated accessibility checks, supplemented by independent source and screenshot usability review.

## Requires a live connection or physical rehearsal

- Actual OpenAI Realtime account access and end-to-end latency need a privately connected key.
- Physical microphone/speaker echo, outdoor noise and subjective casting need a human venue rehearsal.
- Phone browser automation emulates touch layout; a physical phone on the local Wi-Fi still needs confirmation.
- Theme-park production polish needs authored animation, direction and venue testing beyond automated passing checks.

Long-session soak and GitHub Actions results are recorded separately as they complete. CI never requires a live provider credential.
