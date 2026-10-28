PRIVATE FINITE-CUE PLAYBACK PROOF — NOT PROMOTED TO SHOWDESK

Why: the prior single-master seeking study has no native cue-end boundary.
This proof appends only selected finite media into one MediaSource/video,
then seals that timeline when requested. Open timelines also accept serialized
new selections while the current native video is playing. No clock timer is responsible for preventing later
master sections or their sound from playing. One source assignment per
prepared playlist, not per cue. The existing production player is unchanged.

Two packaged sections use unchanged H264 packets from the pinned 35-second
painted source; packaging-review.json records full decoded-frame RGB hashes
and source/asset pins. All 243 packaged frames exactly match their original
source frames. This is packaging, not new art or approval of those joins.

Audio is independently AAC-encoded from original 48k stereo authoring PCM
work/wisp-eyes-context-review-v1.wav (raw sample SHA256
86754e2687af3ff6ed5ca076f60b05b9fa86f6d5a0ea95badf4c825b0c4c858c).
Friendly samples [0,244000); morph [244000,486000).
Fragment flags: +frag_keyframe+empty_moov+default_base_moof+negative_cts_offsets.
Copied video input windows: first 122 frames; seek 122/24 then 121 frames.
Mux -c:v copy -c:a aac -b:a 192k. No image/Runway generation credits used.
MSE append windows remove AAC padding at each finite boundary. First AAC
priming/quiet-handle timing and subjective audio joins still need review;
this is NOT sample-accurate gapless audio acceptance.

Native test: tests/finite_cue_study.cjs uses actual muted Chromium and WebKit,
first-only, forward and reverse playback, native ended and final frame,
finite buffered bounds, Stop, delayed old fetch/replacement and disposal.
The first strict appendWindowStart test failed WebKit reverse order: it
presented no second-cue frames. A one-24k-track-tick boundary tolerance fixes
the rejected IDR caused by timestamp rounding. This adjustment includes
only the selected segment's own first frame, not later unselected media.
Do not remove final-frame regression or substitute clock-only end checks.

The forward sequence also runs at normal 1x speed; callback media-time gaps
are recorded, not treated as a guarantee of display performance. The source
UI starts sound off and its Stop button clears the native source.

Limits: accelerated 4x stress cases do not prove smooth 24fps presentation;
no long soak, phone integration, arbitrary codec compatibility,
mid-cue seamless replacement, layer compositing, human mix/visual approval,
provider, microphone or physical projection validation. Default finite playlists are fetched before play. The optional open
timeline can fetch/append during native playback, then explicitly seal at
the selected final frame. Concurrent selections are serialized and stale
queued appends cancel on Stop/replacement. Cue endpoints use an integer
frame count divided by24, avoiding cumulative floating-point end rounding
that otherwise drops the final WebKit frame on a three-cue sequence.
This is bounded to64 cues/30minutes, not an indefinite unattended scheduler;
buffer eviction and runtime show-control integration remain unfinished. No automatic fallback, no production migration, no approved
16-cue inventory entries. The reverse test has no authored visual join.
The source UI is manual playback with opt-in laptop sound, not remote output.
