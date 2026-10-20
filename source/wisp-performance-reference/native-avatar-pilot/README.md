# Wisp synthetic-audio avatar pilot — offline preparation

This is an isolated experiment, not a production renderer or a live conversation implementation. It tests whether an audio-driven avatar provider can preserve the approved painted fog, articulated hands and continuous full-body motion. No visual benefit has been demonstrated yet.

Default preflight (standard Python, no SDK imports/network/credentials):

```sh
python3 source/wisp-performance-reference/native-avatar-pilot/pilot.py
python3 -m unittest discover -s source/wisp-performance-reference/native-avatar-pilot -p 'test_*.py' -v
```

The supervised launcher is drafted but `--run` is disabled. Repeated local testing exposed intermittent PermissionError during process-group termination. This is unresolved; cleanup errors are returned explicitly, and all waits remain bounded. It has NOT been used against a provider. It rejects missing private configuration, then starts only the SDK's unregistered `connect --room` command in its own process group. It accepts no arbitrary SDK arguments. A shared exclusive claim file admits at most one avatar job across subprocesses. The supervisor terminates the entire local process group on completion or at a 35-second wall deadline, escalating after at most two seconds. Do not substitute dev/start/console or enter credentials into chat. No new credentials or account permissions were created. Live SDK dispatch, provider cancellation and billing remain unverified.

The supplied 4.651-second driver is fictional generated character speech, mono PCM16 at 24kHz. It contains no visitor recording. Its SHA-256 is bae4bad5e0bd1250d274b968d0f88f95ca1f2949050d83863b7233d5f80c27eb.

The draft lifecycle caps provider duration at 30 seconds, local performance at 20 seconds, disables automatic creation retries, and attempts avatar cancellation, agent closure and room disconnection independently. Microphone, camera and room text input are disabled; no STT, LLM or TTS is configured. SDK recording/session hosting is disabled. Provider-side retention is not established by these settings.

Fifteen checks exercise mocked audio/lifecycle behavior, room and shared-claim admission, and real local process-group termination. The local subprocess checks include normal/failing exit, a process that ignores SIGTERM, a descendant surviving its root and a completion signal stopping the worker before deadline. The first complete run passed; repetition exposed the process-group permission failure described above. Do not infer reliable group cleanup from one passing run. They make no network requests. They do not prove remote cancellation, paid-session duration, native conversation, visual fidelity, voice quality or physical projection.

The pinned dependencies were installed into an ignored isolated Python 3.12 environment for import/signature inspection (approximately 281MB). Production dependencies remain unchanged. Requirements are for a laptop experiment, not Netlify Functions. No runtime or artist-quality approval is implied.

Primary references:

- https://docs.livekit.io/agents/models/avatar/plugins/runway/
- https://docs.dev.runwayml.com/characters/livekit/
- https://docs.livekit.io/agents/multimodality/audio/
- https://docs.livekit.io/agents/logic/sessions/

Private configuration names are RUNWAYML_API_SECRET, LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, WISP_RUNWAY_AVATAR_ID and WISP_PILOT_ROOM_NAME (must start with wisp-pilot-). Values belong only in private server configuration. Use the isolated Python 3.12 environment, not the production app runtime.

Next acceptance: privately establish approved access and verify the actual SDK single-session lifecycle. A real run can incur provider and infrastructure charges even if it fails. Review its full-body motion against approved v28 and record actual startup, cleanup, visual and cost evidence before considering app integration.
