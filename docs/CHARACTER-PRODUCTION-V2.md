# Painted Wisp: authored motion and attached atmosphere

Primary-source research checked October 15, 2026. This is a production proposal, not a list of libraries already integrated. No renderer, character assets or application behavior were changed for this research. Integration costs below are engineering judgments, not vendor estimates. No claim is made about Disney's proprietary production methods.

## Decision

Keep the illustrated Wisp and current runtime. The next improvement is **new directional artwork plus authored performance**, rather than another global scale/rotation curve. A front painting rotated on its canvas cannot reveal the back of a head, the far arm, or changing cheek contours. Mesh deformation can provide breathing and drag; it cannot invent those missing surfaces.

First produce one excellent cute turn-and-settle sequence and one body-attached vapor study. Only adopt another renderer after those studies demonstrate a visible benefit on the actual projector. The existing voice, stop, family reset, phone and silent projection contracts remain intact.

## Assets to commission or draw

Use the approved front Wisp as the identity anchor. Paint matching front, left/right three-quarter, left/right profile, rear three-quarter and back views on a common registration canvas. Preserve face proportions, translucent edge color, brush grain and light direction. Do not mirror asymmetric lighting as a shortcut. Back views have no face painted through the body.

For the first useful production slice:

- A 1.2–1.8 second front → three-quarter → profile → back → profile → front turn, with approximately 16–24 distinct drawings, timed on a 24fps exposure sheet. This is a starting art budget, not a requirement to interpolate every frame evenly.
- A 2–3 second anticipation → curved launch → overshoot → settle move, with torso, hands and tail doing different things. Paint key extremes and breakdowns before adding in-betweens.
- A short idle tail loop, blink variants, one look-down pose, and a strong front listening pose. Keep face and mouth replacement layers separable wherever live speech is required.
- Matching scary directional art after cute motion reads correctly. Reuse anchor conventions and timing semantics, not incompatible silhouette geometry.

Export lossless transparent PNG sequences with untrimmed reference dimensions. A deterministic packer may trim each frame only if it stores original canvas size, trim rectangle, anchor and duration. Include a contact sheet and a black-background playback render. Krita explicitly supports animation image-sequence export; a sprite atlas is a separate build step. [Krita animation export documentation](https://docs.krita.org/en/reference_manual/render_animation.html)

## A small asset contract

Each clip needs: version, character form, frame rectangles, per-frame duration, source canvas size, alpha bounds, chest/root anchor, head/face anchor, left/right hand anchors, tail root, view angle, face visibility, loop policy and a stable exit pose. Optional named events include `anticipation`, `launch`, `back-facing`, `face-available`, `settle` and `complete`.

A turn must change drawings and occlusion order. When facing away, hide front facial layers; never keep two eyes and a talking mouth on the back. Continue audio, but return through authored drawings to a readable three-quarter/front pose for sustained conversation. Preserve the same performance clock in the silent projector; do not choose random cels independently per display.

At build time reject non-finite coordinates, frames outside atlases, missing anchors, negative durations, unexpected face visibility, excessive decoded texture budgets and missing license/provenance. Keep the old front rig usable if an optional turn atlas fails.

## Motion with weight, rather than a floating sticker

This is an art-direction recommendation: eyes lead the intention, head follows, torso follows head, and tail/hands lag behind acceleration. Use asymmetric timing: a readable preparation, a quick action, a short overshoot, then a longer controlled recovery. A ghost can be buoyant without every part oscillating in phase.

Drive motion from a single root trajectory with position and velocity. Apply bounded damped secondary motion to tail and hands, reset on cancellation, and clamp long frame deltas after backgrounding. Author turns in the velocity direction; use an actual rear drawing during retreat. Avoid stacking idle bounce, dance, orbit and speech sway at full strength. One primary clip owns the body, with controlled gaze/blink/mouth overlays.

Depth needs more than scale: direction-specific poses, acceleration, silhouette change, trailing cloth/vapor and recovery make a rush credible. Start with perspective-derived scale along a bounded depth path, but do not claim a 2D projection has real volumetric depth or change the face into a squashed front sticker to simulate yaw.

## Vapor attached to the character

Paint a small family of translucent wisps with soft, textured edges. Spawn them from the animated tail root, shoulder edges and trailing body contour, not a screen-centered ring. Evaluate emission points after the full pose transform. Emit according to distance traveled as well as elapsed time, with a bounded per-second budget so fast motion does not leave dotted gaps.

At birth, particles inherit some root velocity plus local trailing velocity; afterward they drift in world/projector space. Keep a small near-body sheath in character space so Wisp stays coherent, but allow the older trail to lag behind. Render rear vapor behind the torso, a restrained front veil in front, and protect the face with a mask or density limit. Use premultiplied-alpha textures carefully; test for dark fringes and rectangular atlas edges on black. Keep emission, lifetime, opacity and pool count bounded; Stop/family reset must cancel bursts and clear residual scary effects. Blackout must clear character and atmosphere together.

## Tools evaluated

| Tool and primary evidence | Exact license boundary | Fit, cost and decision |
|---|---|---|
| [Krita source](https://invent.kde.org/graphics/krita), [license](https://krita.org/en/about/license/) | Application GPL v3; artwork belongs to its creator. Distributed Krita plugins are GPL. | Best immediate paint/cel authoring option. Low application integration cost: only exported PNG/JSON enters Wisp. Main cost is drawing and registration, not an engine rewrite. |
| [OpenToonz](https://github.com/opentoonz/opentoonz), [license](https://github.com/opentoonz/opentoonz/blob/master/LICENSE.txt) | Main project BSD-3-Clause; bundled third-party code and MyPaint brushes have separate notices. | Good alternative for an animator who wants exposure-sheet/cel production. Low runtime integration via exports, medium training cost. Do not embed its desktop renderer in the web app. |
| [PixiJS](https://github.com/pixijs/pixijs), [license](https://github.com/pixijs/pixijs/blob/dev/LICENSE), [mesh](https://pixijs.com/8.x/guides/components/scene-objects/mesh), [particles](https://pixijs.com/8.x/guides/components/scene-objects/particle-container) | MIT core; retain license/copyright. Separate assets/plugins require their own review. | Strong future renderer candidate for textured meshes, masks and batched vapor. Medium/high integration: texture lifecycle, pose mapping, context loss, projector synchronization and regression parity. Prototype one tail mesh and bounded vapor pass first. ParticleContainer optimizes many particles but deliberately has fewer features than ordinary containers; mask/filter the enclosing effect deliberately. |
| [Effekseer](https://github.com/effekseer/Effekseer), [web runtime](https://github.com/effekseer/EffekseerForWeb), [web license](https://github.com/effekseer/EffekseerForWeb/blob/main/LICENSE) | MIT projects; retain notices and review bundled/sample effect resources separately. | Useful authored effects editor/runtime for later ectoplasm bursts or transformation accents. Medium/high integration: JS/WASM loader, WebGL context/composition, resource loading, attachment transforms and cleanup. Requires HTTP serving for WASM/resources. Reject as the first fix for character acting: an effects engine does not supply painted turns or facial appeal. |
| [Rive runtime](https://github.com/rive-app/rive-runtime), [license](https://github.com/rive-app/rive-runtime/blob/main/LICENSE), [image meshes](https://rive.app/docs/editor/manipulating-shapes/meshes), [editor plans](https://rive.app/pricing) | Runtime MIT. Editor/service/export entitlements are separate commercial terms; verify current plan before committing authoring work. | Supports deformable image meshes and state machines, so it is not limited to vector-looking characters. Medium/high conversion/authoring cost and new export pipeline. Reject a wholesale migration now; evaluate only if an artist will maintain the rig. Do not equate open runtime with open editor or free production export. |
| [Spine runtimes](https://github.com/EsotericSoftware/spine-runtimes), [runtime license](https://github.com/EsotericSoftware/spine-runtimes/blob/4.3/LICENSE), [editor agreement](https://esotericsoftware.com/spine-editor-license) | Custom Spine Runtimes License Agreement, not MIT/open-source. Integration/modification and distribution are governed by the editor agreement, including a valid editor license at integration. | Strong textured skeletal/mesh workflow with professional authoring; high re-rigging and licensing coordination cost. Editor/runtime versions should be frozen together. Credible paid alternative if a dedicated Spine animator is engaged, not a casual GitHub drop-in. |

## Ship in evidence-backed stages

1. Approve a contact sheet at front/profile/back, then a short silent turn preview. Reject identity drift, flat flip tricks, visible double faces or inconsistent lighting before runtime work.
2. Play the registered turn through the existing character scheduler. Test repeated reverse turns, interruption at every key pose, Stop, Welcome kiddos, speech while rear-facing and projector silence.
3. Add the bounded attached-vapor study behind a feature flag. Compare identical recorded paths with and without it on black and on the actual projection surface. Reject detached rings, face washout and smoke that looks like a second character.
4. Measure frame time, decoded texture memory, dropped frames and context recovery on the actual laptop. A 2048×2048 RGBA texture is 16MiB before extra copies/mipmaps; atlas count matters more than compressed download size alone.
5. Keep artist approval separate from automated tests: tests can prove registration, cleanup and state consistency; they cannot certify appealing acting or street-level projection quality. Record the actual silent output and watch it at intended viewing distance before promoting the new art.

No third-party implementation was copied or dependency added in this research pass. Pin a specific reviewed release/commit and preserve notices when any tool runtime is actually adopted.
