NATIVE MOVING-FACE GEOMETRY CANDIDATES — NO RUNTIME OR HUMAN APPROVAL

The existing friendly study overlays a generated face patch with a radial
mask. That approach can introduce foreign skin/light and a pasted-on edge.
This new source analysis measures the original v28 movie's own mouth ink in
each of122frames. Native upper/lower ink bounds and weighted centerline are
recorded, along with the original movie SHA and detector dependencies.
The reference video and painting have not been edited.

Initial185luminance cutoff lost frames49–52: the native smile fades in the
middle during those frames. Bounded adaptive185/195/205/215thresholds recover
a component across all122frames, widths34–41pixels. Higher thresholds are
marked lowContrastFrames/confidence; these are uncertain candidates, not
anatomical landmarks or ground truth. Contact sheet includes those frames.
No temporal interpolation silently replaces a missing measurement. Artist
correction/smoothing and native-frame matching still need validation.

Important next renderer constraint: the movie mouth is NOT always a closed
line. It naturally varies from a crease to a small open smile. Use its
separate upper/lower ink boundaries as the source surface, not a duplicated
centerline that would stretch the original cavity. Keep original upper lip,
cheeks and jaw on a connected locally deformed native-video surface. Any new
oral paint belongs only behind the moving native lip aperture; replace no
outer face/eyes/fog with another painting. Preserve teeth height/occlusion.
Do not reuse the rejected scary attack-jaw/chest warp or rectangular overlay.

Proposed efficient implementation (NOT IMPLEMENTED): snapshot one native
video frame to the output canvas; copy only the small face ROI to independent
RGBA pixels for a local WebGL mesh. Using that same snapshot prevents mixed
body/face frames and avoids keeping a native video texture bound across
renderer contexts. Composite the changed local face with a native-paint
boundary; outside the facial support must remain pixel-identical. Source
body, hands and fog remain the full native movie. Activation/closure needs
smoothing and genuine speech/turn footage before any runtime promotion.

This folder has geometry candidates and a tracking diagnostic only, not a
speaking renderer, viseme kit, approved mouth, scary-character solution or
production asset. The rig must be rendered/reviewed in full moving-body
footage with speech; passing contour/mesh tests cannot approve appearance.

Reproduce into a NEW work/ directory:
python3 scripts/study-friendly-native-lips.py --ffmpeg PATH_TO_FFMPEG \
  --output work/NEW_FOLDER
No paid generation or new character art is involved.
