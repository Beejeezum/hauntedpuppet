# Next Wisp character-art pass

Status: a production brief, not completed art. Preserve the original painted and 3D options while reviewing a replacement. The current painted candidate and the earlier 3D sculpt are not final visual approvals.

## First approval: one convincing friendly character

Use the published painted Wisp as the likeness authority. Compare an unanimated front and three-quarter hero pose before adding more moves. Lock head-to-body proportions, cheek fullness, crest/tail shape, shoulder mass, eye placement, palm size and digit identity. Inspect the actual selected component images; earlier generation prompts are provenance, not proof that the requested anatomy was achieved. Keep four screenshots together: reference, front, three-quarter and side. Reject a technically valid asset that loses the reference's appeal.

## Smallest useful new art set

1. Matching relaxed, open, curled and pointing hand poses, both sides and both forms. Keep wrist and palm anchors fixed. Preserve digit count and thumb identity; include palm/back-of-hand views so a turn does not keep the hand facing the camera.
2. Shoulder and elbow breakdown drawings for an arm rising, folding and reaching across the torso. Include the overlap under the body. Review these in actual motion before creating a larger pose library.
Current midpoint render evidence still shows overlapping eye/socket contours and partially doubled claw tips. Registered centers and shared body topology are not sufficient to pass this visual gate.

3. Opposite-side body views matching the existing front/45/90/135/back set. Current turns reverse at the back; they are not a complete 360-degree performance.
4. Three intermediate cute-to-evil design drawings. Match the same face anchors and limb identities. Explain how cheek, lid, brow, mouth and finger shapes change; a crossfade between incompatible silhouettes is insufficient.

The current body component is 1024×1536 RGBA. Right-arm source is 1230×1278; left sources are approximately 1206×1305. Preserve canvas registration and clear alpha; do not auto-crop components. Current source anchors and transforms are in assets/wisp-performance/front-rig.js. If a redesigned proportion changes those anchors, update the registration deliberately rather than stretching mismatched artwork to fit.

## 3D rebuild requirements

The earlier GLB has smooth shading and about 21,000 connected body vertices. Its source uses voxel remeshing, decimation and projected painting. Rebuild the approved hero design with intentional deformation topology around face, shoulders, elbows and fingers. Create a complete texture unwrap and paint all views consistently. Preserve joint volume with artist-authored corrective shapes; use multiple controls along each finger where required. Maintain shared topology and target names across cute/evil before export. Blender viewport modifiers must be baked or translated into supported runtime deformation; their presence in the authoring file does not mean the browser evaluates them.

Keep the existing input contract for jaw, smile/funnel/wide, left/right blink, gaze, head pose and form blend. Voice/webcam/phone controls do not need another credential system or a new app. Preserve silent remotes and laptop-only audio.

## Visual acceptance reel

Review the same 15-second sequence at full size and slowed playback: notice, greet, listen, speak, wave, turn, morph and recover. Add close-ups of folded elbows, raised shoulders, eyelids, curled hands and intermediate form shapes. Review silhouette against black with glow reduced enough to expose construction. Reject angular bends, lost joint mass, sliding face features, detached hands and abrupt depth/overlap changes.

Measure operator plus projector together on the intended laptop. Hold the current geometry constant when comparing skinning algorithms; measure mesh-density changes separately. A successful geometry test or a sharp still image does not establish fluid motion. Validate Stop, interruptions, farewell-to-idle, reduced motion, fallback, silent remotes and cleanup after every rig integration. Physical projection contrast and guest-distance readability still require an on-site recording.

## Authoring-tool pilot, before a renderer change

[Spine physics constraints](https://us.esotericsoftware.com/spine-physics-constraints) can simulate secondary bone motion from the current skeleton state. This is relevant for crest, wrists and tail follow-through; those constraints require the Professional editor tier. The [official runtime repository and license](https://github.com/EsotericSoftware/spine-runtimes) require appropriate Spine licensing for integration/distribution. It is source-available, not a free-license drop-in; nothing was purchased, installed or integrated here. A pilot must use actual Wisp art and prove better bends, art control and paired browser cadence before replacing the current runtime.

[OpenToonz Plastic](https://opentoonz.readthedocs.io/en/latest/create_animations_using_plastic_tool.html) is another artist-side deformation workflow for mesh/skeleton drawings. The existing app does not import its scenes. [Inochi Creator](https://github.com/Inochi2D/inochi-creator) is another parameter-rig authoring option; browser compatibility and the asset bridge still require a pilot. These tools improve authoring control; the source paintings and deformation design still need an artist-directed pass.
