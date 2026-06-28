# S2-6 (#26) — Tutor mode + curriculum (headline)

**Status:** 🟡 in progress · **Issue:** #26 · **Branch:** `feat/26-tutor-curriculum` · **PR:** (pending)

## Done
- `public/js/curriculum.js` (shared by browser + backend, pure) — 6 seeded sessions
  (travel; water-treatment chemicals; pool; meat-industry cleaning; wastewater; Turkish/Korean
  dramas), each `{ id, title, level, type(light|challenging), goal, vocab[], phrases[],
  phases{warmup,vocabulary,guided_questions,roleplay,recap} }`. Helpers: `PHASES`, `getSession`,
  `firstPhase`, `phaseForExchange`. Extend by appending to `CURRICULUM`.
- `server/prompt.js` — `buildTutorPrompt(profile, session, phase)` **extends** `buildSystemPrompt`
  with a private lesson guide; framed "do not read aloud / never announce phases" (spec §3/§5).
- `server/app.js` — `/api/chat` accepts `tutor:{ sessionId, phase }` and resolves the session from
  the **backend's own curriculum** → no lesson/prompt text passes through from the client. Unknown
  id falls back to the base prompt.
- `public/js/api.js` — `buildChatBody`/`sendChat` carry `tutor:{ sessionId, phase }` only.
- `public/js/app.js` — **Lessons** screen per profile (picker with level/type badges + goal);
  starting a lesson opens with the curriculum **warm-up** (shown locally) and drifts through phases
  as the chat grows (`phaseForExchange`); lessons saved to history tagged with `curriculumId` +
  lesson title (reuses #25). End recap reuses the §3/§5 summary.
- `public/index.html` + `styles.css` — `screen-curriculum`, lesson cards + badges.
- Tests: **+8** curriculum unit, **+3** `buildTutorPrompt` unit, **+1** chat-request unit,
  **+2** API (tutor path proves backend-built prompt + **no client passthrough** + unknown-id
  fallback); **E2E** `curriculum.spec.js` (list, warm-up + tutor body, saved-to-history).
  **102 unit/API green**; `--list` = 22 E2E.

## Security note
The proxy stays closed: the client sends only `sessionId` + `phase`; the backend builds the prompt
from its own curriculum. An API test asserts injected `tutor.goal/title` text never reaches the
system prompt.

## Next (resume here)
- [ ] Push, open PR `Closes #26`, confirm CI green, self-merge → flip PROGRESS S2-6 to ✅ →
      **Sprint 2 complete** (mark the Sprint 2 section done in PROGRESS.md) → stop the loop.
- [ ] Owner: try "Lessons → Traveling with the family" on the live app; confirm a natural, phased,
      level-appropriate session ending in an encouraging recap.
