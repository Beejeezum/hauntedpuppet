# Current painted character sources

The Wisp illustrations are user-supplied assets from the coordinated character-art task at `help/outputs/wisp-2d-assets`. The delivered app contains the registered exports, source manifest 1.1, reference assembly, preview and handoff. It uses no procedural/vector replacement, GLB or 3D runtime.

All 23 registered PNGs are 1024×1536. Their source registration and baked feather masks are preserved. The six additional expression/consonant overlays use the source artist's revised feather exports; the app does not apply those masks a second time. `assets/wisp/integrity.json` records byte hashes, verified by the asset test. Native source images remain unchanged in the art task.

Canvas layering, root/shoulder/tail pivots, conservative animation, blink/gaze selection and speech mapping are implemented in `assets/painted-wisp.js`. New PNGs require manifest entries and corresponding renderer controls; they are not automatically new authored animations.

Eight included friendly show performances were generated through the user-authorized OpenAI speech connection and aligned locally. They contain generated character speech, not visitor recordings. Spectral voice processing is local app code. The local Pocketsphinx helper is installed separately from its pinned public package; its distribution retains its own licensing metadata.

Historical 0.6 archives retain the superseded 3D evaluation model/runtime and their original provenance. Those assets are not included or loaded by the current painted app.

## Optional painted scenery

`assets/scenes/haunted-window.png` is an original image generated with the built-in image generation tool on October15,2026 for this project. It is a separate mansion window background plate, not a modification to the approved Wisp layers. The source generated file was inspected before copying into the repository. Center and outer-edge darkness support projection; this plate is opt-in. It contains no visitor recordings or imported third-party artwork.

## Scary Wisp painted rig (October 2026)

Original raster art was generated with the built-in imagegen tool against the project's approved Wisp reference, then assembled as a registered front-facing 2D puppet. Sources, generation prompts, manifest and integrity hashes are under `assets/wisp-scary/`. Runtime consists of four body/arm/tail pieces, twelve mouth shapes and ten eye states. No Disney/Pixar imagery or animation files are included. Physical-acting references inform timing and staging only. The existing cute PNGs are unchanged.
