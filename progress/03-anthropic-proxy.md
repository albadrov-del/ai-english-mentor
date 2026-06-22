# Task 3 — Backend proxy for Anthropic API

**Status:** 🟡 in progress · **Issue:** #3 · **Branch:** `feat/03-anthropic-proxy`

## Done
- `server/prompt.js` — pure `buildSystemPrompt(profile)` (spec §5) + `checkPin` (fail-closed).
- `server/app.js` — `createApp({ anthropic, pin, model })` DI factory. `POST /api/chat`: PIN gate (`x-app-pin`, 401 without it), **backend-built** system prompt (client `system` ignored; only user/assistant turns forwarded), model `claude-haiku-4-5-20251001` non-streaming, `max_tokens` 320, returns `{ reply }`; serves static `public/`.
- `server.js` — entry: dotenv + real Anthropic client + `app.listen`; `npm start`.
- Deps added: express, @anthropic-ai/sdk, dotenv (+ supertest dev). `.env.example` adds `APP_PIN`.
- Tests: 4 unit (prompt + PIN) + 5 Supertest API (SDK mocked at the boundary) — **24 total green** locally.
- README: `APP_PIN`, spend-cap warning, curl smoke-test.

## Next (resume here)
- [ ] Confirm CI green on the PR (unit + API + Playwright E2E). Verify `gh pr checks <PR>` conclusions before merging (see #2 lesson).
- [ ] When green: **self-merge** `Closes #3`, finalize this note, PROGRESS → ✅, continue to **Issue #4** (wire the frontend to `/api/chat`).

## Notes
- Owner-side check (needs the real key, which the loop doesn't have): set `ANTHROPIC_API_KEY` + `APP_PIN` in `.env`, `npm start`, run the README curl → expect a real `{reply}`. Automated proof is the mocked API tests.
- The Anthropic client is **injected** into `createApp`, so API tests mock it (no network in CI).
- The frontend is wired to this proxy in **#4**.
