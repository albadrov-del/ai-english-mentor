# S3-1 (#33) — Voice robustness: dedup + noise/gibberish filtering

**Status:** ✅ done · **Issue:** #33 · **Merged:** PR #36

## Done
- `public/js/transcript.js` (pure): `dedupeTranscript(text)` collapses consecutively repeated
  words/phrases (scans largest→smallest n-gram windows until stable); `isJunk(text)` drops empty /
  punctuation- or digit-only / stray-single-letter utterances while keeping real short words
  (hi, ok, no, I, a).
- `public/js/speech.js`: `createMic` gains `minConfidence` (default 0.6) — low-confidence **final**
  results are skipped in `onresult` (a missing/0 confidence passes, since many engines omit it);
  `finalizeTurn` runs `dedupeTranscript` + `isJunk` before `onResult`. This also neutralizes the
  auto-restart re-append that produced *"scream to filter scream to filter…"*.
- **Push-to-talk** (hold-to-speak) Settings toggle: `storage.js` `loadPushToTalk`/`savePushToTalk`
  (`aem.ptt.v1`); mic is tap-to-toggle by default, hold-to-talk (pointerdown/up) when enabled.
- `public/index.html` + `styles.css`: Settings checkbox + `.field-check` row styling.
- Tests: `tests/unit/transcript.test.js` (+8), `tests/unit/speech.test.js` (+4: confidence/junk/dedupe),
  `tests/e2e/voice.spec.js` (+1: repeated phrase de-duplicated end-to-end). **115 unit/API green**;
  `--list` = 23 E2E.

## Decision note
- **getUserMedia `noiseSuppression`/`echoCancellation` not applied.** The Web Speech API manages its
  own audio stream — the app never touches it — so app-side constraints don't reach the recognizer
  (and forcing a separate `getUserMedia` call risks a second mic-permission prompt on mobile). Noise is
  handled via confidence + dedup + junk filters and the push-to-talk option (the strongest mitigation).
- **Cloud STT** (spec #7 out-of-scope) remains an owner follow-up — not built.

## Outcome
✅ **Done.** Merged via PR #36; CI green (E2E ×2, Unit ×2); auto-deployed to Render.
Next: **S3-2 (#34)** — Export / Import JSON backup.
