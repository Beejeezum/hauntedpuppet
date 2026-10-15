# Open-source components

Reviewed against the upstream repositories on 15 October 2026. A library helps only when it solves a concrete production problem; it does not replace authored character animation.

## Added to this project

| Component | Purpose | License / source |
| --- | --- | --- |
| Playwright | Browser regression tests for voice lifecycle, projector silence, phone controls and cancellation | Apache-2.0 · https://github.com/microsoft/playwright |
| axe-core | Automated checks for labels, focusable controls and contrast; complements manual usability review | MPL-2.0 · https://github.com/dequelabs/axe-core |
| Nayuki QR Code generator | Local pairing QR, without sending the laptop address or pairing information to an external QR service | MIT · https://github.com/nayuki/QR-Code-generator · vendored commit 3c6d0b3cefb4e049dc337e82237c9644399716a8 |
| PocketSphinx | Forced phoneme alignment of prepared English spoken performances | BSD-style · https://github.com/cmusphinx/pocketsphinx |

## Evaluated for later production work

- **PixiJS** (MIT, https://github.com/pixijs/pixijs): GPU-backed sprites, masks, filters and larger animated texture sets. Suitable for a measured renderer upgrade when painted cells and a rig demand it. The current approved paintings are preserved in the existing canvas renderer.
- **Socket.IO** (MIT, https://github.com/socketio/socket.io): bidirectional transport and reconnect behavior for richer multi-controller shows. The first LAN remote uses bounded local HTTP command/state exchange to fit the current Python server; this remains a useful option when multi-room or shared cloud operation is needed.
- **Rive runtime** (https://github.com/rive-app/rive-runtime): designer-authored state-machine animation, but the current character is painted raster artwork. Evaluate an authored sample before adopting a different asset pipeline.
- **Live2D Cubism Web Framework** (https://github.com/Live2D/CubismWebFramework): deformation and expressive face control. Its licensing and authored-model workflow are separate from a permissively licensed wrapper; confirm those requirements before production integration.

## Provenance

Retain upstream licenses and version/commit identifiers for vendored components. Do not copy example characters or proprietary models as Wisp assets. The project's generated Wisp art and original application code are not automatically relicensed by using these libraries.
