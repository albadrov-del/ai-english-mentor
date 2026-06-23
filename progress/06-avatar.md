# Task 6 — Animated robot avatar tied to speech

**Status:** 🟡 in progress · **Issue:** #6 · **Branch:** `feat/06-avatar`

## Done
- `index.html` — an SVG robot (head / eyes / mouth / antenna) replaces the emoji placeholder; the avatar carries `data-speaking`.
- `speech.js` — `speak()` wires the utterance `onstart`/`onend` (+`onerror`) to `onStart`/`onEnd`.
- `app.js` — `setSpeaking()` toggles the avatar `speaking` state off the `speak()` lifecycle; reset to idle on entering/leaving the conversation.
- `styles.css` — robot styling + mouth (scaleY) / nod / antenna-pulse animations **only** while `.speaking`; honors `prefers-reduced-motion`. No 3D/video libs.
- Tests: 2 unit (`speak` lifecycle wiring) + 1 E2E smoke (`avatar.spec.js`: speaking state on reply, idle after `onend`; synthesis stubbed). **40 total green** locally.

## Next (resume here)
- [ ] Confirm CI green on the PR (verify `gh pr checks <PR>` conclusions; E2E runs in CI only).
- [ ] When green: **self-merge** `Closes #6`, finalize this note, PROGRESS → ✅, continue to **Issue #7** (level adaptation + session summary + prompt refinement).

## Notes
- Animation is driven by the SpeechSynthesis utterance lifecycle (starts on `onstart`, stops on `onend`/`onerror`), so the robot moves only while actually speaking.
- Visual quality is owner-side to eyeball; automated tests assert the `data-speaking` state, not the pixels.
