# Task 5 — Voice input/output (Web Speech API)

**Status:** ✅ done · **Issue:** #5 · **Merged:** PR #16

## Done
- `public/js/speech.js` — thin, injectable wrapper: `getSpeechRecognition` / `isRecognitionSupported` / `isSynthesisSupported`, `createMic` (idle↔listening state machine, discrete utterances `continuous=false`, `onend`/`onerror`), `speak()`.
- `app.js` — mic button (tap-to-toggle) → `submitText(transcript)`; assistant replies spoken via SpeechSynthesis when supported; mic disabled while sending; voice stopped (mic + synthesis cancel) when leaving the conversation. Unsupported → mic hidden + `voice-unsupported` note (text still works).
- `index.html` + styles: mic button (`data-state` idle/listening) + voice note.
- Tests: 10 unit (`speech.test.js`: state machine, support detection, speak) + 2 E2E smoke (`voice.spec.js`: mic toggle; recognized phrase → user turn → reply), speech APIs stubbed. **38 total green** locally.

## Outcome
✅ **Done.** Merged via PR #16; CI green (unit + API + E2E). Voice in (mic→text) and out (spoken replies) work behind a testable wrapper. Next: **Issue #6** — animated robot avatar tied to speech. (Owner: verify real mic/speech once on Android Chrome.)

## Notes
- Real speech (mic permission + actual STT/TTS) is **owner-side** — verify on Android Chrome; automated tests stub the APIs (per the testing strategy: real Web Speech is low-ROI to unit-test).
- `en-US`; discrete press-to-talk / tap-to-toggle (continuous mode is unreliable per the ADR).
