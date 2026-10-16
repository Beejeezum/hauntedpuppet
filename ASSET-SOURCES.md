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

## Painted morph and wispy cel studies

`assets/wisp-morph/` contains original transparent raster sheets generated with the built-in image tool against the approved cute and scary Wisp references. The morph sheet supplies six single-face anatomy keys; the tail sheet supplies six variations of the curl and smoky contour. Manifests retain source rectangles, alpha bounds, registration anchors, reference paths and SHA-256 provenance. They are generated painted animation assets, not motion or imagery extracted from another production.

`assets/puppeteer-pitch-worklet.js` and `assets/puppeteer-voice.js` implement original local effect presets. Audition recordings in test evidence process the existing AI-generated rehearsal line; they do not contain a newly captured human voice.

## Organic Wisp and ocular study (2026-10-15)

`assets/wisp-v2/` contains seven unchanged built-in-generated transparent raster sources, registered turnaround/eye/mouth/optics manifests, exact prompts and SHA-256 provenance. This version is a separate workshop study. It preserves both original speaking characters. Eye whites, irises, pupils, highlights, brows and lid paintings are independent components; runtime masks/feathers these sources without replacing them with vector character artwork. Three directional views per form are authored keys, not a completed continuous turnaround or demon speech rig.

`assets/spirit-effects/` contains original generated transparent vapor and floating-eye atlases, with generation notes. The app emits a bounded painted wake from the character's transformed lower-body anchor. No third-party effect pack, shader, artwork or runtime was copied in this pass. Research sources and license boundaries are documented in `docs/EYE-ACTING-RESEARCH.md` and `docs/CHARACTER-PRODUCTION-V2.md`.
