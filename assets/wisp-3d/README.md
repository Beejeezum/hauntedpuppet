# Wisp: shared 3D performance rig

`wisp.glb` is an actual volume mesh with skin weights and morph targets, not a turntable video or stacked sprite. The connected body has 21,104 vertices. A 24-bone skeleton controls head, crest, torso, tail, arms, wrists, four digits per hand and independent eyes. Four skeletal animation clips are exported.

The cute and evil endpoints share vertex/index topology. `Evil` changes the same body, eyes, brows, mouth cavity, fangs and claws continuously. Each mesh retains its own matching target name. The runtime applies one normalized form value across those targets. Separate eyelid targets plus `BlinkEvil_L/R` correctives allow blinks through the change. Mouth controls are `JawOpen`, `MouthFunnel`, `MouthWide`, `MouthSmile`, `TongueUp`, and `TongueOut`; they accept the app's acoustic estimates or performer input. They are not an audio-to-phoneme solver.

The original face-free painted body and blue iris texture are retained and embedded in the GLB. Skin UVs project the painted color onto the curved sculpt; this is not a finished non-overlapping texture-paint unwrap. Runtime lighting, cyan rim emission and bloom supply the apparition edge. The editable Blender source and reproducible build are in `source/wisp-3d/` in the repository, excluded from the public web build. All matching shape keys are driven by the source armature's shared custom properties.

Use **Living 3D Wisp** below the main preview, or choose it under Appearance. This is a selectable first 3D sculpt alongside the painted character. The projector receives the selected renderer through the existing owner-scoped channel and remains silent. Operator voice, webcam coefficients, audience gates and phone-triggered moves use the same control path. No new credential or capture service is introduced.

## Artist review limits

The rig is functional; final likeness and surface painting are still art-direction work. The source uses a voxel-remeshed/decimated sculpt, not hand-retopologized production facial edge loops. Fingers have one control per digit rather than a multi-phalange hand rig. The source is deliberately editable for refinement. The painted renderer remains available during that work.

Dependencies: Blender 4.5.0 for rebuilding; pinned Three.js 0.186.1 for playback (MIT, under `assets/vendor/three`). No Unreal installation is required to play the GLB in this app.

Direct entry: `/?character=3d` selects the new rig on the existing operator console. The normal root keeps the operator's saved Appearance preference.

The playback engine blends the native Float animation clip with procedural secondary joints and facial inputs. Software GPU playback uses a reduced internal render scale; hardware acceleration uses a higher scale. The final projection canvas remains 1280×720 before the existing calibration/mapping pipeline. Continuous vertex-based bounds are calculated from the current skinned pose and fitted to the stage. Failed loads and lost contexts retain the painted fallback. GPU targets, bone textures, geometry, materials and loaded image bitmaps are released on disposal.

The camera is perspective. Enter, exit and deep orbit use real Z travel with smooth handoffs; they do not solely shrink a front-facing card. The bounds fit uses the nearest deformed surface depth and the camera frustum. The Khronos validator reports zero errors. Its Blender `NODE_SKINNED_MESH_NON_ROOT` warnings are retained and covered by a check that skinned meshes and the root joint share the same rig parent; non-power-of-two original images and unused UV attributes are informational notices.
