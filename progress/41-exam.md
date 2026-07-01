# S4-3 (#41) — Spoken level exam (placement + final, AI-graded)

**Status:** 🟡 in progress · **Issue:** #41 · **Branch:** `feat/41-exam` · **PR:** (pending)

## Done
- `public/js/course.js`: `EXAMS` per level (A1/A2/B1) — a **fixed** set of spoken prompts
  `{ id, grammarFocus, prompt, target }`, one per key grammar unit (so initial == final →
  comparable); `examForLevel`, `getExamItem`, and `parseVerdict` (leading CORRECT/INCORRECT, fails closed).
- `server/prompt.js`: `buildExamGradePrompt(profile, item)` grades ONE answer, asking for a one-line
  `CORRECT/INCORRECT — note`. `server/app.js`: `POST /api/grade` (PIN-gated) resolves the item from the
  backend's **own** EXAMS (client sends only `itemId` + `answer`), returns `parseVerdict → {correct,note}`.
- `public/js/api.js`: `sendGrade()`.
- `public/js/app.js`: **exam mode** in the conversation screen (reuses composer + mic + submit path):
  prompts one at a time, per-answer ✓/✗ + note, final **score X/N** saved via `progress.setExam` as
  `initial` (first run) or `final`, with a **"Start X/N → End Y/N"** comparison. Course screen gains a
  **Take/Retake the level test** button + a saved-score line.
- `index.html`/`styles.css`: exam entry + status.
- Tests: `tests/unit/exam.test.js` (data shape, `parseVerdict`, `buildExamGradePrompt`);
  `tests/api/grade.test.js` (verdict parse, **no client passthrough**, unknown id → 400, upstream → 502);
  `tests/e2e/exam.spec.js` (run exam → 6/6 saved → retake shows comparison). **143 unit/API green**;
  `--list` = 29 E2E.

## Notes
- Answers are graded by the model (spoken app → spoken test); the fixed prompt set keeps scores
  comparable. Exam scores live in `progress` (S4-2), so they're in export/import too.

## Next (resume here)
- [ ] Push, open PR `Closes #41`, confirm CI green, self-merge → flip PROGRESS S4-3 to ✅ →
      **Sprint 4 complete** (mark the section done) → STOP. B2/C1 grammar + cloud TTS/STT + Capacitor
      remain owner follow-ups.
