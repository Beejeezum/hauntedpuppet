# Painted transformation and living tail cels

Both PNG atlases are original raster illustrations made with the built-in image generation tool. No vector stand-ins, recoloring, or programmatically painted replacement characters are used. The original generated atlas files are preserved unchanged.

## Morph atlas

References: approved cute `../wisp/wisp-assembled-transparent.png` and scary `../wisp-scary/wisp-assembled-transparent.png`.

Prompt: Exactly six full-body morph keyframes in a strict 3 × 2 transparent atlas. One ghost, one head, one pair of eyes, one mouth per cell. Uniform front camera and luminous ivory finely textured painted material with turquoise rim light. Cute round body/big eyes/mitten arms gradually become an elongated flowing S-body, narrowed icy eyes, large shadow grin, claw arms and extended curled crest/tail. Swirling wispy edge tendrils evolve through the progression. No labels, grid, background, props, gore, vector illustration, duplicate faces or overlapping ghosts. Keep complete bodies and transparent gutters.

Inspection: the six images show physical changes to body silhouette, hands, facial proportions and tail. The first two remain mostly cute; the third is halfway; the last three progress through increasingly evil anatomy. These are six authored-looking generated keys, not a dense hand-inbetweened 24 fps sequence. Exact approved endpoint art should be retained by the application. Extra face/mouth overlays during the short morph would cause registration errors and must be omitted.

The original atlas nominal second row starts slightly above 512 pixels. The manifest uses a safe 494-pixel gutter split so complete flame crests remain in their own source rectangles. Local alpha bounds use threshold >3/255. Read rectangles from the manifest rather than assuming a uniform 512-pixel row split.

## Tail loop

Reference: approved cute `../wisp/registered-layers/layers--tail.png`.

Prompt: Six tail-only painted cels in a strict 3 × 2 transparent atlas. Fixed wide softly edged neck opening at the same upper anchor in every cell. Preserve luminous ivory/turquoise material and the left-curl identity. Subtle sequence: neutral curl; loosen/lift; left sway with fine wispy tips; inward/down curl; gentle right sway; near-neutral return. Animate inside the tail silhouette and smoky edge, not just a rigid rotation. No other body parts, faces, text, background, or clipping.

Inspection: curl tip, curl interior and feathered outer wisps change between cels. The generated neck varies horizontally, so `tail-loop.json` gives a separate anchor for every frame and a common scale should be used. Neck width stays between 297 and 299 source pixels.

Cute renderer integration uses common scale **0.82** and native neck anchor **[520, 1100]**, behind the approved body core. Visual inspection of the assembled native-size character found no exposed neck line. Manual/frozen rehearsal and `nativeCanvas()` retain the exact original tail; reduced motion holds cel zero. Optional loading is nonblocking and bounded to three seconds; unavailable art leaves the original 23-layer rig working. The tail uses the same shared show clock at eight cels per second and all frame geometry contributes to conservative bounds.

`tests/tail_cels.cjs` verifies all six cels, the original frozen fallback, reduced-motion holding, missing optional-art fallback, and all **33,088** character envelope samples. Browser tests are graphics-only; they do not validate physical projection or live voice.
