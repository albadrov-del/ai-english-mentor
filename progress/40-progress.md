# S4-2 (#40) — Per-level progress tracking

**Status:** 🟡 in progress · **Issue:** #40 · **Branch:** `feat/40-progress` · **PR:** (pending)

## Done
- `public/js/progress.js` (pure): model `{ [profileId]: { [level]: { completed:[lessonId],
  exam:{initial,final} } } }`; `markComplete`, `isComplete`, `completedCount`, `levelPercent`,
  `resetLevel` (Start over), `clearProfile` (Clear progress), `setExam`/`getExam` (for S4-3).
  Immutable updates; progress kept **per level**.
- `storage.js`: `loadProgress`/`saveProgress` (`aem.progress.v1`).
- `app.js`: Course screen shows a **% bar** + `n/total` and a **✓** on completed lessons; **Finish
  lesson** marks the lesson complete; **Start over** (confirm) resets the level; **Clear progress**
  (mandatory confirm) wipes the profile's progress. Switching the profile's level shows that level's
  own progress (others preserved).
- `backup.js`: `buildBackup`/`parseBackup` now carry `progress` (still **no PIN**; legacy backups → `{}`).
  Export/import wired in `app.js`.
- `index.html`/`styles.css`: progress bar + Start over / Clear progress buttons + completed style.
- Tests: `tests/unit/progress.test.js` (CRUD, percent rounding, per-level isolation, reset/clear, exam);
  backup progress round-trip; `tests/e2e/progress.spec.js` (finish → ✓ + % rises, persists across reload,
  Clear resets, per-level separation). **130 unit/API green**; `--list` = 28 E2E.

## Next (resume here)
- [ ] Push, open PR `Closes #40`, confirm CI green, self-merge → flip PROGRESS S4-2 to ✅ →
      continue to **S4-3 (#41)** — spoken level exam (placement + final, AI-graded).
