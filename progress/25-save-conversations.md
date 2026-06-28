# S2-5 (#25) — Save conversations (history + resume)

**Status:** 🟡 in progress · **Issue:** #25 · **Branch:** `feat/25-save-conversations` · **PR:** (pending)

## Done
- `public/js/history.js` (pure, unit-tested) — versioned records
  `{ version, id, profileId, title, level, messages[], createdAt, updatedAt }`:
  `createConversation`, `updateConversation` (bumps `updatedAt`, fills generic title),
  `upsertConversation` (newest-first / replace by id), `deleteConversation`, `findConversation`,
  `listByProfile` (filtered, newest-first), `deriveTitle`, `migrateConversation` (forward-compat),
  and resume assembly: `selectResumeContext` (≤16 msgs verbatim; longer → older+recent split) +
  `buildResumeMessages` (optional recap turn + recent).
- `public/js/storage.js` — `loadHistory`/`saveHistory` (`localStorage` key `aem.history.v1`); local
  only, no login/cloud sync (spec §6/§8).
- `public/js/app.js` — persist the live session **per turn** (created on first turn, updated after;
  user turn saved even if the reply fails); new **History screen** per profile (Continue / + New /
  Delete each). `resumeConversation` sends prior context, **summarizing the older part via the proxy**
  (`sendSummary`) for long chats. History button added to each profile item.
- `public/index.html` + `styles.css` — `screen-history`, list/item styling.
- Tests: **+14 unit** (`tests/unit/history.test.js`); **E2E** (`tests/e2e/history.spec.js`):
  save → reload → continue → delete, and New-from-history. **89 unit/API green**; `--list` = 19 E2E.

## Decision note
The live session maps **1:1** to its saved record (persist overwrites that record). Resuming a *long*
conversation therefore **compacts** it (recap + recent) once a new turn is sent — intentional, keeps
storage/tokens bounded; short chats (the common case) keep full fidelity. Resume itself does **not**
persist, so opening history never mutates a saved chat until the user actually continues it.

## Next (resume here)
- [ ] Push, open PR `Closes #25`, confirm CI green, self-merge → flip PROGRESS S2-5 to ✅ → continue to
      **S2-6 (#26)** — tutor mode + curriculum (depends on this; reuses history for per-session progress).
