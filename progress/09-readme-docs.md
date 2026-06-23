# Task 9 — README + hosting + Android install docs

**Status:** 🟡 in progress · **Issue:** #9 · **Branch:** `feat/09-readme-docs`

## Done
- Rewrote `README.md` from the skeleton into a full guide:
  - CI status badge; features; tech stack.
  - Run locally (`npm install` → `.env` → `npm start` → localhost:3000; enter PIN in Settings).
  - Configuration (`ANTHROPIC_API_KEY` + `APP_PIN`, owner marker, spend-cap warning) + curl smoke-test.
  - Tests (`npm test`, `npx playwright test`) + CI note.
  - Deploy on a free tier (Render/Railway web service: Node, `npm start`, env vars; cold-start + HTTPS notes); Vercel/serverless alternative.
  - Install on Android (Chrome → Add to Home screen → enter PIN); voice-support note.
  - Out of scope (spec §8); project layout.
- Verified all README-referenced paths exist (internal links resolve).

## Next (resume here)
- [ ] Confirm CI green on the PR (docs-only; unit + E2E should pass unchanged).
- [ ] When green: **self-merge** `Closes #9` → **all 9 issues done** → set every PROGRESS row ✅, finalize this note, write the closing summary, and STOP the loop.

## Notes
- Docs-only task; no new code.
- Owner-side to-dos remain: deploy to an HTTPS host, set `ANTHROPIC_API_KEY` + `APP_PIN` + a spend cap, and verify real voice + install on an Android phone.
