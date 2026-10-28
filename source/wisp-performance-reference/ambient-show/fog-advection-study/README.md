# Source-only smoke transport study

Research reference: [PavelDoGreat/WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation/tree/a2d292931f19d9b3b9f564e23e6c32729d2121c3), MIT license (Copyright2017PavelDobryakov). No upstream code or runtime was copied. The study implements an analytic curl-velocity field and semi-Lagrangian transport of a generated raster plate; it is not a pressure-solving fluid simulation or a3Dvolumetric renderer. It is not integrated into the app.

One actual289-frame/24fps GPU render was inspected at0,6,12seconds. The lettering moves and distorts rather than fading intact, but numerical smoothing and broad curl flow destroy the fine fog material. Rejected as final material. The new v4plate is also only a source seed, not human-approved typography. No bats, writing hand or completed story scene are delivered by this prototype.

The source study can be opened at index.html. It has no capture, audio or external runtime imports. Resources are disposed on page exit. Any future derivative that copies upstream code must retain its full MIT notice.

## Limited higher-order comparison

`fog-dye-high-order.mjs` adds independently implemented limited MacCormack dye transport, based on the method described in [NVIDIA GPU Gems3 chapter30](https://developer.nvidia.com/gpugems/gpugems3/part-v-physics-simulation/chapter-30-real-time-simulation-and-rendering-3d-fluids). It reuses the exact original seed, analytic velocity and decay to isolate numerical smoothing. No upstream code copied. It is not a pressure solve or3Dfluid.

`tests/fog_dye_transport_study.cjs` passes actualWebGL2 shader compilation, identical initial pixels, twelve simulated seconds of finite bounded float density, rejected invalid steps and disposal. Three sampled times are saved under work/fog-transport-comparison. Actual6second comparison retains more detail but still looks like warped planar strokes. Rejected as finished smoke material; not integrated, no Runway credits spent. See transport-comparison-v2.json.
