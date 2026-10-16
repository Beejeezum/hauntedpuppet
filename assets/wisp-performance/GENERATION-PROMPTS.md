# Production cleanup prompts

Tool: built-in image generation, genuine transparent background requested. Original approved paintings and first-generation atlases remain unchanged.

## Turn cleanup, cute and evil

Reference/edit target: respectively `cute-turns.png` and `evil-turns.png`.

Output: `cute-turns-v2.png`, `evil-turns-v2.png`.

Prompt template (hands = “friendly rounded fingers” for cute, “long curved claw fingers” for evil):

> Use case: precise-object-edit. Production sprite atlas cleanup. Edit the reference four-view painted Wisp turnaround into the SAME 2-column x 2-row layout but make EVERY figure SMALLER WITH LARGE CLEAR TRANSPARENT GUTTERS. Current source has clipped crests and neighboring figures touching; fix that. Preserve all four orientations and the character design: top left three-quarter 45 degrees toward screen-right; top right right-facing 90-degree profile; bottom left rear three-quarter 135 degrees; bottom right straight back 180 degrees. Preserve ivory pearl dimensional painted texture, cyan luminous edge, [hands], slender spirit torso and curled tapered tail. Faces remain COMPLETELY BLANK, no eyes or mouth or brows. Each character must be no taller than 65 percent of its square cell and no wider than 65 percent, centered within the cell. Each crest, hand, tail and soft glow FULLY VISIBLE within its own cell, with at least 80 pixels of genuinely transparent empty space from every cell boundary. Reconstruct clipped crest tips and tail tips. All four same scale. No text, no labels, no panel borders, no ground. Do not add detached smoke, floating ornaments or other characters. This is the same existing artwork cleaned for animation use, not a redesign. Transparent background.

Review: all eight views inspected. Actual alpha>12 cell margins range from 64 pixels upward; this is less than the requested 80 but clears the production 32-pixel guard. The browser regression reads the real PNG alpha and rejects ink entering that guard. This is an approved clipping/bleed correction, not final turn-acting approval.
