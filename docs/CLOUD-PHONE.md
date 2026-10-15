# Hosted laptop and phone controls

The laptop operator signs in to the hosted desk. Enable **Phone remote** there, scan its QR on a phone, and enter the six-digit code. The QR selects the laptop's show room; it does not contain a credential. Each additional phone needs a fresh one-use code. Phones do not sign in as operators.

The laptop keeps the projected character, native voice connection, microphone, and speakers. A paired phone sends a small allowlisted command: gestures, gaze, audience, idle loops, known prepared cue, volume, Stop, or Blackout. It receives a downscaled character preview and safe show status. Neither phone responses nor pairing URLs contain provider keys, signing secrets, or conversation transcripts.

Hosted pairing uses HTTPS and Netlify Database. Local laptop mode retains the optional LAN server on port8771. Open a hosted phone page through the laptop QR: opening `/phone_remote/` without a room shows guidance and does not attempt a LAN pairing request.

## Required cloud setup

- Configure operator access with `HAUNT_SESSION_SECRET` and the operator password/hash as described in the cloud operator documentation. The session signing secret must remain stable across deploys to preserve operator sessions and paired phone token signatures.
- Install the pinned `@netlify/database` dependency. Netlify provisions the appropriate database for the deploy environment.
- Commit and deploy `netlify/database/migrations/20261015160200_cloud_phone.sql`. Schema changes reach hosted databases through migrations; do not manually create tables in production.
- Keep the operator laptop desk open. A different desk may take over its room after a five-second owner lease expires. Projector-only tabs never consume phone commands or acquire the microphone.

A cloud database/configuration failure produces an explicit unavailable response. The interface must not claim that a command applied merely because its request was queued.

## Boundaries and recovery

Pairing codes expire after90seconds and can be consumed only once. There are at most8paired phones per room, with8-hour phone sessions. Revoke and Disable invalidate phone tokens through a generation change. Phone tokens are HMAC-signed with a separate `phone:` domain and cannot serve as an operator cookie or authorize AI provider endpoints.

Commands use unique IDs and Postgres BIGSERIAL sequence numbers, serialized as strings to preserve integer precision. The queue is bounded at64pending/in-progress commands. Queued commands expire after3seconds; reconnecting does not replay stale performances. Stop and Blackout cancel prior queued/in-progress commands and bypass the ordinary12commands/second phone limit. Pairing attempts are limited to5per source per minute.

The operator desk polls more slowly in cloud mode to bound function traffic: approximately750ms for commands,2500ms for safe state/preview, and6000ms for status. A phone polls its state about once per second. If owner/state heartbeat expires, normal controls pause and the old preview disappears. The current desk can recover after a brief connection loss; after another desk takes ownership, the old desk cannot execute its commands.

## Verification

`node tests/cloud_remote.mjs` uses the actual local NetlifyDB/Postgres-compatible engine and applies the committed migration. It covers owner exclusion, concurrent code consumption and UUID deduplication, acknowledgements, typed commands, rate/queue behavior, stale commands, lease recovery/takeover, signature separation, revocation, preview bounds, and expired-phone cleanup.

`node tests/cloud_remote_browser.mjs` exercises the hosted phone browser against that real local database-backed handler. The HTTPS transport is intercepted locally; it does not certify a deployed Netlify service. The local database engine is documented as unsuitable for load testing, so its rate-flood check is sequential. A deployed database and physical laptop/phone/projector test are still needed before a public performance.
