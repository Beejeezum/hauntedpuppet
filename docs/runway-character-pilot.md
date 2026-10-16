# Runway realtime visual-layer pilot — not adopted

Reviewed primary documentation on 2026-10-16. This is a candidate to compare against the approved fog Wisp reference, not evidence of a working Wisp integration.

Runway describes image-defined, non-human conversational characters. Its LiveKit integration accepts the agent's generated audio and produces avatar video; the agent retains speech/language responsibilities. This suggests a possible visual layer for Wisp while retaining the existing persona/voice system. It does not prove full-body fog motion, persistent lower anatomy or seamless cute/evil transformation.

Sources: [Characters](https://docs.dev.runwayml.com/characters/), [LiveKit integration](https://docs.dev.runwayml.com/characters/livekit/).

The documented integration requires a Runway developer API key, LiveKit infrastructure and a custom avatar ID. It is not a drop-in connection to the app's current OpenAI WebRTC call. API secrets remain server-side. Session credentials are single-use; failed consumption needs a new session. Sessions have a five-minute maximum. The application needs explicit readiness/error/timeout handling and a deterministic return to the local painted fallback.

Sources: [Session concepts](https://docs.dev.runwayml.com/characters/concepts/), [Integration](https://docs.dev.runwayml.com/characters/integration/).

The listed developer rate for `gwm1_avatars` is2credits upfront plus2credits per6seconds, at$0.01 per developer credit: approximately12credits/$0.12 for30seconds of active time, before infrastructure/voice and any differing billing rounding. A five-hour continuously active session sequence would be approximately6000usagecredits/$60 plus session starts, not free idle. Verify actual account rates and how developer billing relates to the web subscription before provisioning. The plugin bills while its avatar worker is active; enforce short maximum duration and cleanup.

Sources: [Pricing](https://docs.dev.runwayml.com/guides/pricing/), [Worker cleanup](https://docs.dev.runwayml.com/characters/livekit/).

## Bounded experiment

One30-second session with a private custom Wisp reference, a public synthetic rehearsal line and maximum-duration enforcement. Avoid real visitor audio, camera and recordings. Keep microphone/audio ownership on the laptop and send silent output to projector/phone. Begin with a local scripted audio driver; do not assume an OpenAI session is already interoperable.

Judge every frame for identity, finger count, full-body persistence, stable camera,15%complete-fog margin, natural listening/speaking and the last settled pose. Measure readiness, audio/video skew, interruption latency, cleanup, Stop/Blackout and fallback. Record actual debited credits and stop if morphology or framing fails; do not launch repeated paid runs without a new testable hypothesis. A successful friendly test still needs separate controlled transformation/evil and live guest rehearsals.

No developer key was created, no session provisioned, no new dependency installed and no credit spent for this research. Keep current production paths intact until a visual/performance/control pilot demonstrates material improvement.

## Actual web pilot checkpoint
A private custom character named **Wisp — fog visual pilot** was created in the user's existing Runway web account from the approved fog image with optimization disabled. The first processing attempt rejected the description; one friendly-only description and neutral welcome script were accepted after refreshing the source image. It is ready for a conversation, not proof of video quality.

The web page requires microphone access and states that conversations are recorded into the account's assets, billed2credits per6seconds. Camera and microphone were left OFF, and no call started; displayed balance stayed13822. Explicit user approval was requested before granting this new microphone access, with a30-second cap. No developer API key was created or exposed. Web account readiness does not establish developer API access or billing interchangeability.
