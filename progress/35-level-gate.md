# S3-3 (#35) — Level-gated lessons (fix A1→B2 mismatch)

**Status:** 🟡 in progress · **Issue:** #35 · **Branch:** `feat/35-level-gate` · **PR:** (pending)

## Done
- `public/js/curriculum.js`: `levelMatches(sessionLevel, profileLevel)` — parses a single level
  (`"B2"`) or a range (`"A2–B1"` / `"A2-B1"`, en-dash or hyphen) into CEFR ordinals (order from
  `LEVELS` in profiles.js) and tests inclusion; returns `true` (don't hide) when the lesson has no
  CEFR token or the profile level is unknown.
- `public/js/app.js` `renderCurriculum`: offers only lessons matching the learner's level by default,
  with a level note and a **"Show all levels (N more)"** toggle (`curriculumShowAll`). Never dead-ends
  — if nothing matches (e.g. an A1 profile against the current B1+ seeds) it shows all with an
  explanatory note. Reset to level-only on each visit.
- `public/index.html` + `styles.css`: `curriculum-note` + `toggle-all-levels`.
- Tests: `tests/unit/curriculum.test.js` (+4: single/range/en-dash+hyphen/unknown + every seed
  reachable by some level); `tests/e2e/curriculum.spec.js` reworked for gating (B1 sees 3 by default,
  toggle reveals 6; the existing #26 warm-up + history tests now use a B1 profile so travel is the
  first matching lesson). **126 unit/API green**; `--list` = 26 E2E.

## Note
Interim fix. Sprint 4's per-level grammar curriculum (#8) replaces the topic-curriculum model with
proper per-CEFR lesson sequences, superseding this gating.

## Next (resume here)
- [ ] Push, open PR `Closes #35`, confirm CI green, self-merge → flip PROGRESS S3-3 to ✅ →
      **Sprint 3 complete** (mark the Sprint 3 section done) → STOP. #8 is Sprint 4 (its own plan).
