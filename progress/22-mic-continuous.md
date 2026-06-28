# S2-2 (#22) — Mic continuous capture + silence-timeout

**Status:** 🟡 in progress · **Issue:** #22 · **Branch:** `feat/22-mic-continuous` · **PR:** #28

## Done
- `public/js/speech.js` — `createMic` rewritten: `continuous` + `interimResults`; a turn is
  assembled from many result events and finalized (sent via `onResult`) only after a
  configurable **silence timeout** (`silenceMs`, default 3000) or an explicit **Stop**.
  - Mid-turn involuntary `onend` (Android ~60s cap / transient `no-speech`) **auto-restarts**
    the recognizer, keeping accumulated text, until Stop or silence fires; `onend` with no
    speech → idle (no restart loop). Injectable `timers` for deterministic tests.
  - New `onInterim(partial)` callback for live preview.
- `public/js/app.js` — `MIC_SILENCE_MS`, `onInterim → showInterim`, `mic-status` element;
  `updateMicUI` shows/hides the "still listening" indicator.
- `public/index.html` — `data-testid="mic-status"` live region; `styles.css` — `.mic-status`
  + `mic-pulse` (respects `prefers-reduced-motion`).
- Tests: `tests/unit/speech.test.js` rewritten (12 mic tests). `tests/e2e/voice.spec.js`
  updated (final result + Stop, status indicator, continuous/interim flags). **63 green** locally.
- `docs/ARCHITECTURE.md` — Voice-handling decision marked **superseded by #22** with rationale.

## Decision note
Chose "silence-timeout finalizes one turn, then idle" (tap to speak again) over always-on
hands-free, to avoid the TTS↔mic feedback loop and keep scope tight. Auto-restart covers only
*involuntary* mid-turn ends, satisfying the DoD ("auto-restart on onend until explicit stop")
without an endless silent loop.

## Next (resume here)
- [ ] Confirm CI green on PR #28 (`gh pr checks 28`), self-merge → flip PROGRESS S2-2 to ✅ →
      continue to **S2-3 (#23)** — natural TTS (voice/rate/pitch in profile settings).
