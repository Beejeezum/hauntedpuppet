# Editable character source

Open Wisp.blend in Blender 4.5+. Select Wisp_Rig and edit the custom properties to change Evil, jaw, lids, brows, smile and tongue together. The Evil slider changes all corresponding mesh shape keys. Compound blink correctives are driven from Evil × side-specific blink. The NLA editor contains Float, Wave, TurnAway and MenacingPace; tracks are muted in the saved source so the rest rig is easy to inspect.

`build_wisp.py` rebuilds the sculpt, weights, UV projection, shape controls, clips, .blend and GLB from the existing painted references. Run it from Blender's background Python mode. The scene packs its two original painted texture sources. Exported GLB has 24 skin joints and matching per-mesh target topology. Runtime spring motion, gaze, material rim/bloom and audio input are implemented in assets/wisp-3d-runtime.js.

The first sculpt needs ongoing art-direction and topology refinement; keep the shared control names and skeleton semantics when replacing geometry. This source is not published to Netlify's browser asset directory.
