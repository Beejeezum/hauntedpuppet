The Ghost Next Door — new attraction direction

Start with docs/attraction-v2/product-blueprint.txt and technology-decisions.txt.
This folder is a replacement product foundation, not a new skin over Showdesk.
The existing production app is not changed by importing or testing this module.

show-director.mjs is a renderer-neutral decision core. It emits a validated cue ID
and completion token from next(now). A future native/media adapter must acknowledge
ACTUAL picture/sound completion with complete(token,now); a wall-clock timeout alone
must never masquerade as film completion. next() cannot dispatch while a cue runs.
Use a monotonic host clock. Pause/resume, decoder health and display ownership belong
in the adapter and are not implemented here.

Only exact-media reviewed joins are routable. Ordinary actions use living idle and
morph bridges, never a departure/arrival detour. Explicit empty-stage scenes may
depart and return. Imported cue objects are copied. Unreviewed assets fail admission;
simulation fixtures require an explicit simulation option and mark their outputs.

Phone commands require authenticated pairing in the future bridge. The bridge—not
an untrusted phone—assigns a globally increasing command sequence and tracks the
owner session. The model's sequence check is anti-replay, not authentication or an
implemented transport. Latest uncommitted moment replaces earlier pending intent;
already-dispatched footage completes. The bridge must consume stop-output-now
immediately for blackout and fail to black if renderer ownership is lost.

Current core: profiles, pacing, cooldowns, variation memory, operator lease,
playlist order, copy-safe settings export/restore, blackout, stale completion and
bounded command history. File storage/UI/decoder/native OSC transport are pending.

Run: node --test tests/attraction-v2/show-director.test.mjs (Node24 used locally).
Three simulated hours in tests are NOT a real-media soak test or installation QA.
