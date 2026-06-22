# Task 2 — Conversation screen shell (text-only) + navigation

**Status:** 🟡 in progress · **Issue:** #2 · **Branch:** `feat/02-conversation-shell`

## Done
- Conversation screen: avatar placeholder (🤖), transcript, composer (input + Send), `End session` + `← Home`.
- Summary placeholder screen; navigation home → editor → conversation → summary → home wired in `app.js`.
- `public/js/conversation.js` — pure session/message logic: `createSession`, `appendTurn`, `stubReply`.
- Stubbed echo reply renders in the transcript (real Claude arrives in #4).
- Tests: `tests/unit/conversation.test.js` (3) + `tests/e2e/conversation.spec.js` (2). **15 unit total green** locally; modules syntax-checked.

## Next (resume here)
- [ ] Confirm CI green on the PR (unit + Playwright E2E — **E2E runs in CI only**; see #1 note re: dev-machine TLS block).
- [ ] When green: **self-merge** PR `Closes #2`, finalize this note, flip PROGRESS row to ✅, continue to Issue #3.
- [ ] If E2E fails: read the failure, fix `public/` or the spec, push, re-check CI.

## Notes
- Conversation state (`session = { profile, messages }`) lives in `app.js`; pure parts in `conversation.js`.
- Kept `conversation-back` (← Home) so the #1 E2E (which clicks it) stays green; added `end-session` → summary.
