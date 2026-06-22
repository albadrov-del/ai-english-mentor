# Task 3 — Backend proxy for Anthropic API

**Status:** ✅ done · **Issue:** #3 · **Merged:** PR #14

## Done
- `server/prompt.js` — pure `buildSystemPrompt(profile)` (spec §5) + `checkPin` (fail-closed).
- `server/app.js` — `createApp({ anthropic, pin, model })` DI factory. `POST /api/chat`: PIN gate (`x-app-pin`, 401 without it), **backend-built** system prompt (client `system` ignored; only user/assistant turns forwarded), model `claude-haiku-4-5-20251001` non-streaming, `max_tokens` 320, returns `{ reply }`; serves static `public/`.
- `server.js` — entry: dotenv + real Anthropic client + `app.listen`; `npm start`.
- Deps added: express, @anthropic-ai/sdk, dotenv (+ supertest dev). `.env.example` adds `APP_PIN`.
- Tests: 4 unit (prompt + PIN) + 5 Supertest API (SDK mocked at the boundary) — **24 total green** locally.
- README: `APP_PIN`, spend-cap warning, curl smoke-test.

## Outcome
✅ **Done.** Merged via PR #14; CI green (unit + API + E2E). Next: **Issue #4** — wire the conversation screen to `POST /api/chat` (send `{ profile, messages }` + the `x-app-pin` header, render the reply, multi-turn, graceful error handling; the frontend must **not** send a system prompt).

## Notes
- Owner-side check (needs the real key, which the loop doesn't have): set `ANTHROPIC_API_KEY` + `APP_PIN` in `.env`, `npm start`, run the README curl → expect a real `{reply}`. Automated proof is the mocked API tests.
- The Anthropic client is **injected** into `createApp`, so API tests mock it (no network in CI).
- The frontend is wired to this proxy in **#4**.
