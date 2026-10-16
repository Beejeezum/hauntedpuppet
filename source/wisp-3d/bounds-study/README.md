# Conservative skin/morph framing envelope

The runtime implementation is `assets/wisp-3d-bounds.js`; this folder retains its study entry and reproducible review tools. It changes framing computation, not the model, animation, painted textures or voice.

## Construction and safety

Every source vertex is included. Rest-space cells and skin-influence bins group nearby vertices; no vertex sampling or tiny-weight dropping is used. For each group, joint and morph, the cache stores actual extrema of weighted offsets from a nearby rest center and weighted morph deltas. At each pose, current bone/bind matrices transform those intervals conservatively. Positive/negative morph coefficients and matrix components use the appropriate interval endpoints. The weighted center term retains weight-sum extrema; padding accounts for CPU/GPU homogeneous differences from imperfect floating-point weight sums.

Each small group's box is transformed to world space before union. The first whole-mesh-then-world-box trial was rejected because yaw inflated an axis by86%. The final combined bone/bind/world interval method bounds the tested authored poses within3.47%extra width,.87%height and9.62%depth; it avoids a second rotated-box expansion. It can fit a held1.3scale evil pose about2.8%smaller than exact framing. Actual A/B images were reviewed; no visible clipping or pose deformation. This is a conservative framing tradeoff, not identical boxes.

The cache is valid while rest positions, morph data, skin weights and vertex topology remain unchanged. Rebuild it after editing those attributes. Runtime morph coefficients, bone transforms, root transforms and gaze may change normally. The caller updates world matrices before `update`. Unsupported non-skinned meshes use the existing exact fallback. Disposal clears mesh references; the runtime clears the cache when disposing/reloading its model.

## Verification

Actual full-vertex Three bounds are the independent containment reference. Chromium and WebKit each passed117authored action/morph/blink/yaw poses plus48synthetic affine/negative-morph/extreme-depth stresses, with0misses/nonfinite results. The automated regression also enforces width/height/depth framing tolerances and is included in both CI browser paths. GPU disposal tests check the envelope reference clears across8model lifecycles.

Local CPU profile: exact per-frame bounds~7.4ms; grouped envelope~.4–.8ms, build~20–32ms once. Timings are observations, not deterministic CI thresholds. Unrecorded one-canvas software-GPU A/B: mean render work8.12→.91ms, observed26.5→33.6fps; p95frame42.5→34ms. Same model/settings, sequential contexts, baseline two-canvas soak active. These are NOT target-laptop60fps or physical-projector evidence.

An initial paired full dashboard/projector run did not repeat the single-canvas gain: operator16.9→15.7fps, projector16.8→15.7fps. That evidence is retained, not omitted. Counterbalanced warmed ABBA runs on the preceding interval variant also failed to establish a paired gain: operator exact16.27–16.64fps versus envelope15.23–16.77fps, with projector results similar. These are retained separately; the final tighter variant has no target-hardware or paired60fps approval. CPU savings do not by themselves establish paired GPU/compositor throughput. Do not claim an app-wide60fps success from the CPU benchmark.

Local integration passes:117deformation poses,1,260interruption/turn/idle samples,8GPU/cache disposal cycles, and Chromium/WebKit operator/projector checks covering offline mouth motion, gestures during speech, Stop, blackout, silence and painted fallback. Voice checks here are offline/synthetic; microphone/provider/physical-show acceptance remains separate.

`review.cjs` captures same-pose framing and unrecorded one-canvas cadence. `paired-cadence.cjs` measures operator/projector contexts. `verify.cjs` is the study containment entry; `tests/wisp_3d_bounds.cjs` imports the exact public module for ongoing CI.
