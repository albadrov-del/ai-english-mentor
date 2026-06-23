# Task 5 — Voice input/output (Web Speech API)

**Status:** 🟡 in progress · **Issue:** #5 · **Branch:** `feat/05-voice`

## Done
- `public/js/speech.js` — thin, injectable wrapper: `getSpeechRecognition` / `isRecognitionSupported` / `isSynthesisSupported`, `createMic` (idle↔listening state machine, discrete utterances `continuous=false`, `onend`/`onerror`), `speak()`.
- `app.js` — mic button (tap-to-toggle) → `submitText(transcript)`; assistant replies spoken via SpeechSynthesis when supported; mic disabled while sending; voice stopped (mic + synthesis cancel) when leaving the conversation. Unsupported → mic hidden + `voice-unsupported` note (text still works).
- `index.html` + styles: mic button (`data-state` idle/listening) + voice note.
- Tests: 10 unit (`speech.test.js`: state machine, support detection, speak) + 2 E2E smoke (`voice.spec.js`: mic toggle; recognized phrase → user turn → reply), speech APIs stubbed. **38 total green** locally.

## Next (resume here)
- [ ] Confirm CI green on the PR (verify `gh pr checks <PR>` conclusions; E2E runs in CI only).
- [ ] When green: **self-merge** `Closes #5`, finalize this note, PROGRESS → ✅, continue to **Issue #6** (animated robot avatar).

## Notes
- Real speech (mic permission + actual STT/TTS) is **owner-side** — verify on Android Chrome; automated tests stub the APIs (per the testing strategy: real Web Speech is low-ROI to unit-test).
- `en-US`; discrete press-to-talk / tap-to-toggle (continuous mode is unreliable per the ADR).
