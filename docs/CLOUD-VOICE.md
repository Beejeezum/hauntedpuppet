# Hosted voice setup and validation

The hosted desk uses Netlify Functions for authenticated voice setup. The browser creates a WebRTC offer; the function combines it with Wisp's bounded character configuration and exchanges it with OpenAI's `/v1/realtime/calls`. Microphone audio and the generated voice then travel on WebRTC media tracks. Provider credentials stay in Functions secrets, not the browser, repository, CDN, or phone.

## One-time owner setup

In the project's private Netlify environment settings, mark these variables secret, include **Functions** scope, and use the production context:

- `OPENAI_REALTIME_API_KEY`: your OpenAI project key. A directly configured `OPENAI_API_KEY` also works when it is not paired with a gateway base URL.
- `HAUNT_OPERATOR_PASSWORD`: a unique 16–256 character show-operator password. A `HAUNT_OPERATOR_PASSWORD_HASH` in `scrypt:<32-character salt hex>:<128-character digest hex>` format is supported instead.
- `HAUNT_SESSION_SECRET`: a random signing secret of at least 32 characters. This project's signing secret has been generated privately through the Netlify environment tool; its value was not printed or committed.

Redeploy after changing function secrets. They are fixed per deployed function version. Netlify account authorization or a successful static deployment does not itself configure an OpenAI project key. Local Mac Keychain storage is separate and is not uploaded automatically.

The app never asks for an OpenAI key on a hosted page. Sign in using the operator password; the browser receives a Secure, HttpOnly, SameSite=Strict cookie valid for 30 days. Stop All does not sign you out. Sign out ends local voice resources and clears that browser's cookie. Rotate the signing secret and redeploy to invalidate all existing operator sessions.

Without operator configuration, voice endpoints fail closed. Without a provider key, the authenticated desk explains that the server needs its cloud secret. Public viewers can load the artwork and offline material, but cannot invoke paid voice endpoints. Login, session creation and general APIs have separate Netlify rate limits.

## Runtime storage

Netlify Database is auto-provisioned through the pinned `@netlify/database` package and the migration under `netlify/database/migrations`. Its atomic stage lease permits one live Realtime caller at a time across operator browsers. Conditional release includes both owner session and nonce so an old cleanup cannot release a newer caller. Database availability is required; failure does not fall back to unguarded paid calls.

Netlify Blobs stores private, context-isolated call-control objects: pending IDs, provider call IDs, cancellation markers and heartbeat times. These are control metadata, not visitor audio, SDP or transcripts. Independent cancellation markers avoid lost cancellation during a late SDP response. Do not replace the database ownership lease with read-modify-write blob state.

The model can request a whitelisted friendly gesture/expression/gaze while speaking; the client permits at most one applied reaction per response and ignores stale/reset calls. Speech continues to own the mouth. Tool-only turns get one bounded spoken continuation; already spoken turns do not get duplicate audio.

The scheduled cleanup runs once per minute on production. Lost browser leases become eligible after 90 seconds; failed provider hangups retain their records for retry. A session has a one-hour upper limit. Pending owner claims from crashed invocations can be released once the 90-second grace period passes and no provider call record exists.

## What differs from the local app

- Native streaming mouths remain approximate acoustic animation, not phoneme recognition.
- Newly generated hosted prepared speech currently uses an explicit `amplitude-fallback` jaw. Netlify does not run the local Pocketsphinx alignment helper. Included and previously aligned performances retain their actual cues.
- The legacy record/transcribe/reply/aligned-speech microphone modes remain local-only; the hosted selector disables them.
- Both projector and desk must use the same browser profile and origin. The desk is the only microphone and audible playback owner; the projector stays silent.
- Hosted phone control uses a separate authenticated room adapter under `/api/phone/*` and `/api/remote/*`. It delegates only bounded show controls, never provider credentials or direct voice API access. The original LAN bridge remains available for the local Mac workflow. Validate cloud phone routing independently from the voice handler.

## Tests

`npm run test:cloud` tests authentication, CSRF, durable cold-invocation state, cancellation ordering, cleanup retries, provider errors, one-stage ownership and a real local Postgres-compatible lease engine. `tests/cloud_browser.cjs` uses actual browser WebRTC media with simulated OpenAI/storage endpoints; it verifies remembered login, received audio, mouth movement, silent output, sign-out cleanup and missing-backend messages. `tests/realtime_timeouts.cjs` verifies bounded requests and immediate resource release.

These tests do **not** establish that a real OpenAI key has been configured, that the account has model access, or that a physical outdoor microphone/speaker setup works. Record genuine provider validation separately after owner sign-in.

References: [OpenAI WebRTC unified interface](https://developers.openai.com/api/docs/guides/realtime-webrtc), [Netlify Functions](https://docs.netlify.com/build/functions/overview/), [Netlify Database](https://docs.netlify.com/build/data-and-storage/netlify-db/), [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/).
