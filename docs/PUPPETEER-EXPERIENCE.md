# Wisp's doorstep puppeteer desk

The operator directs a character, rather than selects a paragraph. The primary surface now puts eight whole-body actions beside the painted preview: bounce, dance, twirl, swoop, peekaboo, celebration, an entrance flourish and a fly-by. Movement does not close the microphone or manufacture a spoken response. Gaze and short reactions remain separate from voice.

## What professional character systems suggest

Public Disney Research work provides useful principles, rather than a verified diagram of any proprietary attraction's buttons:

- [PuppetPhone](https://studios.disneyresearch.com/2018/11/08/puppetphone-puppeteering-virtual-characters-using-a-smartphone/) explores using smartphone motion to manipulate a virtual puppet, with authored animation enriching the result. This supports a future opt-in tilt/drag puppeteering surface, rather than an ever-growing list of scripts. We have implemented paired buttons, not that paper's AR system or motion tracking.
- [Realistic and Interactive Robot Gaze](https://la.disneyresearch.com/publication/realistic-and-interactive-robot-gaze/) describes layered attention, saccades and gaze behavior in an animatronic research system. Wisp borrows the design principle of expressive attention: idle curiosity gives way to the visitor or an explicit operator look. Wisp does not claim person detection or camera tracking.
- [Design and Control of a Bipedal Robotic Character](https://la.disneyresearch.com/publication/design-and-control-of-a-bipedal-robotic-character/) describes an animation engine blending artist-directed motion sources and a real-time operator interface. For this painted ghost, the useful lesson is to compose authored performance with live interaction, preserving animation quality while the operator picks intentions.

## The operating rhythm

1. Start live conversation. Connection setup folds away once connected; microphone state, interrupt and goodbye remain available.
2. Pick the audience. Little ones and Family keep the cute character. Big kids permits the scary painting and an explicitly armed reveal.
3. Notice a costume or play a silent action. The 100-costume library, recorded lines and rehearsed stories live in closed drawers, so they do not dominate the show desk.
4. For a theatrical reveal, arm it and confirm the adjacent Reveal button. Arming expires after ten seconds. It cannot fire automatically. A connected voice can deliver the authored words; otherwise this is a silent visual routine.
5. Welcome kiddos immediately returns to the cute character and cancels a pending reveal. Stop and Blackout remain prominent in the header.

Paired phone commands expose the same movement, form, welcome and two-step reveal intentions. They report whether a reveal is armed or running and reject unavailable or disallowed actions honestly.

## Choices deliberately rejected

- A pretend 3D rear view assembled from frontal paintings. The available art supports a twirl and swoop, rather than an invented back-of-head drawing.
- One-click surprise triggers or automatic age guesses. The operator chooses Big kids and confirms the reveal.
- Unscoped letter shortcuts that can accidentally trigger while entering a quip. Buttons remain keyboard accessible with standard focus and activation.
- A voice pitch filter as a substitute for character acting. Voice direction, phrasing and timing provide the persona; custom voice work requires a separate supported asset and casting workflow.

## Verification boundaries

Focused browser suites exercise keyboard confirmation, timer expiry, cancellation after a late completion, movement takeover, Stop, invalid remote actions and Welcome during an active reveal. Automated accessibility and six viewport checks passed during development. Native WebRTC regressions use a simulated provider and real browser media; those are not a new production voice, physical phone or front-door audience test.
