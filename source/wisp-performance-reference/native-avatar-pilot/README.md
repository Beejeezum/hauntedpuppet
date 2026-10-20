# Wisp synthetic-audio avatar pilot — offline preparation

This is an isolated experiment, not a production renderer or a live conversation implementation. It tests whether an audio-driven avatar provider can preserve the approved painted fog, articulated hands and continuous full-body motion. No visual benefit has been demonstrated yet.

Default preflight (standard Python, no SDK imports/network/credentials):

```sh
python3 source/wisp-performance-reference/native-avatar-pilot/pilot.py
python3 -m unittest discover -s source/wisp-performance-reference/native-avatar-pilot -p 'test_pilot.py' -v
```

`--run` deliberately fails before importing the SDK. The pinned SDK's connect command starts an unregistered worker loop; one-room dispatch, process termination and private access still need verification before live execution is enabled. Do not substitute dev/start/console or enter credentials into chat. No new credentials or account permissions were created.

The supplied 4.651-second driver is fictional generated character speech, mono PCM16 at 24kHz. It contains no visitor recording. Its SHA-256 is bae4bad5e0bd1250d274b968d0f88f95ca1f2949050d83863b7233d5f80c27eb.

The draft lifecycle caps provider duration at 30 seconds, local performance at 20 seconds, disables automatic creation retries, and attempts avatar cancellation, agent closure and room disconnection independently. Microphone, camera and room text input are disabled; no STT, LLM or TTS is configured. SDK recording/session hosting is disabled. Provider-side retention is not established by these settings.

Five mocked tests cover normal completion, startup failure, timeout, cleanup failure and PCM frame construction. They prove local control flow only. They do not prove remote cancellation, paid-session duration, native conversation, visual fidelity, voice quality or physical projection.

The pinned dependencies were installed into an ignored isolated Python 3.12 environment for import/signature inspection (approximately 281MB). Production dependencies remain unchanged. Requirements are for a laptop experiment, not Netlify Functions. No runtime or artist-quality approval is implied.

Primary references:

- https://docs.livekit.io/agents/models/avatar/plugins/runway/
- https://docs.dev.runwayml.com/characters/livekit/
- https://docs.livekit.io/agents/multimodality/audio/
- https://docs.livekit.io/agents/logic/sessions/

Next acceptance: verify a dedicated disposable-room one-shot worker lifecycle with fakes; then privately configure an approved bounded session. Review its full-body motion against approved v28 and record actual startup, cleanup, visual and cost evidence before considering app integration.
