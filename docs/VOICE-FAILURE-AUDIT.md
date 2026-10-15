# Native voice failure audit

Independent review on October 15, 2026. This audit does not claim a successful live provider conversation or physical microphone test.

## Resolved in this revision: bounded connection and cleanup requests

The pre-fix `assets/realtime-voice.js` gave `post()` no request deadline. This affects session negotiation, configuration changes, heartbeat, and server cleanup. `api.service()` also runs before the request and must be within the operation budget.

1. **Stalled cleanup prevents reconnect.** `stop()` immediately releases microphone, peer and audio, which is correct. It then awaits `/api/realtime/end` while `ending` is true. A request that never settles prevents every later `start()` from attempting a connection. Reproduced using the actual canonical module with a synthetic unresolved cleanup promise: peer closed once, track stopped once, ending remained true, and reconnect attempts remained zero. Evidence: `../wisp-streaming-proof/cleanup-stall-repro.json`.
2. **Stalled session negotiation has no automatic recovery.** The 15-second handshake watchdog is installed only after the session response and remote SDP are received. A session POST that stalls never reaches that watchdog. A real headless-browser reproduction against canonical localhost8780 stalled the session route: after 16 seconds beyond reaching POST, connection remained connecting with one live microphone track. Stop All released it immediately. Evidence: `../wisp-streaming-proof/session-stall-repro.json`. The user sees Connecting while the acquired microphone remains open. A deadline should cover the complete operation, with the existing generation guards releasing late microphone/SDP results.

The shipped revision uses bounded abortable requests. Nine new deadline checks passed for handshake, cleanup, heartbeat, configuration, status discovery and stalled response bodies; local microphone release is immediate and Start recovers after cleanup timeout.

Original review recommendation: use bounded abortable requests. Report cleanup uncertainty honestly while allowing a fresh connection after a bounded local cleanup period. Keep local microphone release immediate. Add regressions for stalled session, stalled cleanup, stalled status discovery, and cleanup failure followed by reconnect.

## Verified regressions

- Python: `tests.realtime_server_test` and `tests.server_test`: **13 tests passed**.
- `realtime_events.cjs`: **21 event-order checks passed**, including protected reset, late items, stale completion/drain, interrupted farewell tools and bounded fallback farewell.
- `realtime_failures.cjs`: **7 simulated failure/cancellation paths passed**, with no leaked mic tracks or transport helper.
- `realtime_microphone_errors.cjs`: denied, absent, busy and late permission recovery passed.
- `realtime_browser.cjs`: real local browser WebRTC media, acoustic mouth animation, early response completion, false-goodbye text, mute, interruption, context reset, both farewell policies, reconnect and Stop All passed. The provider was simulated.

These browser suites ran against localhost8770's running app snapshot. Direct cleanup reproduction imported the canonical repository module. Localhost8780 is the current canonical preview for additional checks. No API credential was read or used.

Previously reported reset bugs are addressed in canonical source: the reset transaction now has a separate `resetting` flag, its microphone gate survives mute changes, and delayed speech/output events are ignored while resetting or settling. Existing event regressions cover those corrections.

## Hosted site failure is a deployment/backend issue

Read-only check of `https://hauntedpuppet.netlify.app` returned HTML **200** for `/` and HTML **404** for `/api/status`. Root reports the deployment at commit `6646228` had no deployed functions. The hosted static character page loading does not establish native voice availability. A missing API route/function is distinct from an invalid OpenAI key, microphone denial, model error, or WebRTC failure.

Hosted voice needs the cloud function routes deployed and a successful JSON status response before the user is invited to connect or start a live session. Verify routes and production capability detection after deployment; do not assume a successful local Python server test proves Netlify functions exist.

## Production limits

The painting and audio cleanup paths have automated evidence. Natural character acting, real-room noise/echo behavior, physical microphone selection and true end-to-end provider latency still require a live session with the user's privately connected key. Native mouth motion is acoustic approximation, not streamed provider phoneme timing.
