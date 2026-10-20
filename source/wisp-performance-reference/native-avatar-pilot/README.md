# Wisp synthetic-audio avatar pilot — offline preparation

This is an isolated experiment, not a production renderer or a live conversation implementation. It tests whether an audio-driven avatar provider can preserve the approved painted fog, articulated hands and continuous full-body motion. No visual benefit has been demonstrated yet.

Default preflight (standard Python, no SDK imports/network/credentials):

```sh
python3 source/wisp-performance-reference/native-avatar-pilot/pilot.py
python3 -m unittest discover -s source/wisp-performance-reference/native-avatar-pilot -p 'test_*.py' -v
```

The supervised launcher is prepared but has NOT been used against a provider. Local diagnosis reproduced six denied kill signals after the process group had already disappeared. The supervisor now verifies absence using a bounded process-group listing; surviving members, unknown state or an inspection failure remain cleanup errors. No permission override or repeated signaling is used to hide denial. It rejects missing private configuration, then starts only the SDK's unregistered `connect --room` command in its own process group. It accepts no arbitrary SDK arguments. A shared exclusive claim file admits at most one avatar job across subprocesses. The supervisor terminates the entire local process group on completion or at a 35-second wall deadline, escalating after at most two seconds. Do not substitute dev/start/console or enter credentials into chat. No new credentials or account permissions were created. Live SDK dispatch, provider cancellation and billing remain unverified.

The supplied 4.651-second driver is fictional generated character speech, mono PCM16 at 24kHz. It contains no visitor recording. Its SHA-256 is bae4bad5e0bd1250d274b968d0f88f95ca1f2949050d83863b7233d5f80c27eb.

The draft lifecycle caps provider duration at 30 seconds, local performance at 20 seconds, disables automatic creation retries, and attempts avatar cancellation, agent closure and room disconnection independently. Microphone, camera and room text input are disabled; no STT, LLM or TTS is configured. SDK recording/session hosting is disabled. Provider-side retention is not established by these settings.

Seventeen checks cover mocked audio/lifecycle behavior, room/shared-claim admission and real local process-group termination. These include normal/failing exit, a process ignoring SIGTERM, a descendant surviving its root, completion stopping the worker, and denial with verified-absent versus surviving/unknown groups. The corrected suite passed twice. These are local process checks, not proof of SDK dispatch, remote cancellation, paid-session duration, native conversation, visual fidelity, voice quality or physical projection.

The pinned dependencies were installed into an ignored isolated Python 3.12 environment for import/signature inspection (approximately 281MB). Production dependencies remain unchanged. Requirements are for a laptop experiment, not Netlify Functions. No runtime or artist-quality approval is implied.

Primary references:

- https://docs.livekit.io/agents/models/avatar/plugins/runway/
- https://docs.dev.runwayml.com/characters/livekit/
- https://docs.livekit.io/agents/multimodality/audio/
- https://docs.livekit.io/agents/logic/sessions/

Private configuration names are RUNWAYML_API_SECRET, LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, WISP_RUNWAY_AVATAR_ID and WISP_PILOT_ROOM_NAME (must start with wisp-pilot-). Values belong only in private server configuration. Use the isolated Python 3.12 environment, not the production app runtime.

Next acceptance: privately establish approved access and verify the actual SDK single-session lifecycle. A real run can incur provider and infrastructure charges even if it fails. Review its full-body motion against approved v28 and record actual startup, cleanup, visual and cost evidence before considering app integration.


## Private setup, when projects are ready

The user can run `python3 source/wisp-performance-reference/native-avatar-pilot/private_setup.py` in their own terminal. All five inputs are hidden and saved together in the separate service `com.beejeezum.hauntedpuppet.native-avatar-pilot`, using the existing native Keychain wrapper. This never reads or overwrites the OpenAI entry. No credential file or shell argument is written. The helper does not start a provider session. It requires macOS and can prompt for Keychain access; the agent has not run it or accessed any actual credential.

After private setup, the isolated Python3.12 interpreter can run `pilot.py --run --keychain`. That explicitly loads the separate entry, creates a fresh disposable room name and launches the bounded pilot. Default offline preflight never reads Keychain, and `--keychain` alone is rejected. Alternatively keep using explicit server environment configuration. Never paste values into chat or commit them. Five additional tests use only a fake store and synthetic values; they cover store isolation, fresh room names, invalid/mixed-provider rejection and error redaction. Actual Keychain persistence and provider access remain untested.


## Silent local receiver

Add `--viewer` to the explicitly started isolated pilot, for example `pilot.py --run --keychain --viewer`. The launcher prints a loopback-only URL, never a token. Open it and press Connect silent preview within60seconds; no worker starts until the viewer confirms room connection. Stop before readiness prevents worker startup. During the pilot, Stop, Escape, owner closure or a frame stall signal the local worker supervisor as well as clearing/disconnecting the picture. The local viewer window is capped at35seconds. Remote cancellation and billing still require a real provider test; a local shutdown signal is not proof that the provider accepted cancellation.

The viewer binds only127.0.0.1 on a temporary port, accepts one connection issuance, rejects foreign Host/Origin and query data, sends no-store and device-denial headers, and exposes only its exact static allowlist. It does not publish tracks, enumerate devices, create local input tracks or attach audio. Its45-second room-specific token grants subscription but disables media/data publishing and metadata updates. Real secrets stay in the worker/server; only the narrowly scoped receiver token reaches the local browser, through a POST response, never in the URL. Stop prevents further connection issuance. Server/API lifecycle remains unverified against real infrastructure.

The browser SDK is livekit-client2.23.0, extracted from the official npm registry only after verifying its SHA512 integrity. The exact UMD hash, package metadata and Apache2.0 license are retained under viewer/vendor. No production package/lock or renderer changes. Primary documentation: https://docs.livekit.io/reference/client-sdk-js/ and https://docs.livekit.io/frontends/reference/tokens-grants/ .

Validation:30isolated Python checks, including actual Python SDK token grants with synthetic signing material; three browser cases cover actual pinned SDK offline loading and fake-SDK/canvas-stream Stop and stall behavior, with zero camera/microphone attempts or provider connections. These do not establish actual LiveKit dispatch, remote frames, voice sync, visual quality or physical projection. Browser fixture test: tests/native_avatar_viewer.cjs. Default preflight remains offline and never opens Keychain.


Actual SDK process-transfer correction: the original factory-local entrypoint failed ForkingPickler with “Cannot get local object.” It is now a module-level function. Tests register it with the installed SDK, serialize/restore it, and pass it into real spawn and forkserver child processes without executing a room job. These checks pass; they do not prove room connection, avatar startup or provider cancellation.
