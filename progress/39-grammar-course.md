# S4-1 (#39) — Grammar Course (curriculum + teacher-style lesson flow)

**Status:** ✅ done · **Issue:** #39 · **Merged:** PR #42

## Done
- `public/js/course.js` (pure, shared with backend): `GRAMMAR_LESSONS` for **A1/A2/B1** (6 each,
  ordered simple→complex), each `{ id, level, order, grammarFocus, goal, contextTopic }`; helpers
  `lessonsForLevel`, `getLesson`, `lessonOpener` (states the goal up front); `LESSON_PHASES`.
- `server/prompt.js`: `buildLessonPrompt(profile, lesson)` extends `buildSystemPrompt` with the grammar
  focus / goal / context topic (teacher tone, still conversational, §3/§5 recap). `buildTutorPrompt` removed.
- `server/app.js` `/api/chat`: accepts `lesson:{ lessonId }` → resolves `getLesson` from the backend's
  own course data → `buildLessonPrompt` (client sends only an id; no prompt text).
- `public/js/api.js`: `buildChatBody`/`sendChat` carry `lesson:{ lessonId }` (was `tutor:{…}`).
- `public/js/app.js`: **Course** screen replaces the topic picker — lists the profile-level lessons in
  order; starting one opens the conversation in lesson mode (announces the goal via `lessonOpener`); a
  **Finish lesson** action returns to the Course. Profile button relabeled **📚 Course**.
- **Retired the topic path**: deleted `public/js/curriculum.js` + `tests/unit/curriculum.test.js` +
  `tests/e2e/curriculum.spec.js` + the `buildTutorPrompt` unit/API tests; topic strings live on as
  `contextTopic`. `index.html`/`styles.css`: Course screen + Finish-lesson button + course styles.
- Tests: `tests/unit/course.test.js` (data shape, helpers, opener); `tests/e2e/course.spec.js` (list →
  lesson announces the goal + sends `lesson.lessonId`, no `system` → Finish returns); `buildLessonPrompt`
  unit + API (extends base, no client passthrough, unknown id → base). **121 unit/API green**; `--list` = 25 E2E.

## Notes
- "Finish lesson" currently just returns to the Course; **marking the lesson complete is S4-2** (progress).
- Free-chat "Start conversation" (#24) is unchanged and stays as free practice; only the structured path changed.

## Outcome
✅ **Done.** Merged via PR #42; CI green (E2E ×2, Unit ×2); auto-deployed to Render.
Next: **S4-2 (#40)** — per-level progress (checkmarks, %, start-over, clear).
