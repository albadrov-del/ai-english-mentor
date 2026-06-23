# Task 6 — Animated robot avatar tied to speech

**Status:** ✅ done · **Issue:** #6 · **Merged:** PR #17

## Done
- `index.html` — an SVG robot (head / eyes / mouth / antenna) replaces the emoji placeholder; the avatar carries `data-speaking`.
- `speech.js` — `speak()` wires the utterance `onstart`/`onend` (+`onerror`) to `onStart`/`onEnd`.
- `app.js` — `setSpeaking()` toggles the avatar `speaking` state off the `speak()` lifecycle; reset to idle on entering/leaving the conversation.
- `styles.css` — robot styling + mouth (scaleY) / nod / antenna-pulse animations **only** while `.speaking`; honors `prefers-reduced-motion`. No 3D/video libs.
- Tests: 2 unit (`speak` lifecycle wiring) + 1 E2E smoke (`avatar.spec.js`: speaking state on reply, idle after `onend`; synthesis stubbed). **40 total green** locally.

## Outcome
✅ **Done.** Merged via PR #17; CI green. The robot animates only while the tutor speaks. Next: **Issue #7** (level adaptation + session summary + prompt refinement).

> ⚠️ E2E lesson (cost one red CI run, caught before merge): `window.speechSynthesis` is a **read-only accessor** in real Chromium, so `window.speechSynthesis = stub` is silently ignored. Stub browser-API globals with `Object.defineProperty(window, 'speechSynthesis', { value: stub, configurable: true })`. (`window.SpeechRecognition` is undefined by default, so a plain assignment works for it.)

## Notes
- Animation is driven by the SpeechSynthesis utterance lifecycle (starts on `onstart`, stops on `onend`/`onerror`), so the robot moves only while actually speaking.
- Visual quality is owner-side to eyeball; automated tests assert the `data-speaking` state, not the pixels.
