# S2-3 (#23) — More natural TTS (voice / rate / pitch)

**Status:** 🟡 in progress · **Issue:** #23 · **Branch:** `feat/23-natural-tts` · **PR:** (pending)

## Done
- `public/js/speech.js`
  - `getVoices(win)` — safe snapshot of `speechSynthesis.getVoices()` (may be empty until `voiceschanged`).
  - `rankVoice(voice, lang)` — heuristic preferring natural/branded voices (Google, Microsoft
    Online "Natural"/neural, Apple Enhanced/Siri) and exact `en-US`, then any `en*`.
  - `listEnglishVoices(voices, lang)` — `en*` only, best-ranked first (for the dropdown).
  - `pickVoice(voices, { voiceURI, lang })` — saved pick if still present, else best English voice,
    else `null` (browser default).
  - `speak()` now applies `voice`, `rate`, `pitch`.
- `public/js/profiles.js` — `voiceURI` / `rate` / `pitch` on the profile; `VOICE_RATE` (0.5–2) and
  `VOICE_PITCH` (0–2) ranges; `withVoiceDefaults()` clamps + backfills (pre-#23 profiles keep working);
  `createProfile()` accepts them.
- `public/index.html` + `app.js` + `styles.css` — collapsible **Voice (text-to-speech)** section in the
  profile editor: voice `<select>` (Automatic + device voices), speed/pitch sliders with live `<output>`
  labels; persisted via existing storage. `speakReply()` uses the active profile's voice/rate/pitch.
- Tests: +12 unit (`tests/unit/speech.test.js` voice ranking/selection + speak wiring;
  `tests/unit/profiles.test.js` voice defaults/clamp/coerce). E2E (`tests/e2e/voice.spec.js`) asserts the
  settings UI + rate/pitch persistence. **75 unit/API green** locally; Playwright `--list` discovers 16 tests.

## Out of scope (owner decision, per spec)
- **Cloud TTS via the backend proxy** would sound markedly more natural but widens the proxy beyond the
  spec's "minimal intermediary" (§4) and touches §8 (heavier AV beyond v1). Recommended as a **follow-up
  issue for the owner to approve** — not built here.

## Next (resume here)
- [ ] Push, open PR `Closes #23`, confirm CI green (`gh pr checks <PR>`), self-merge → flip PROGRESS S2-3
      to ✅ → continue to **S2-4 (#24)** — "Start conversation" button on the profile screen.
