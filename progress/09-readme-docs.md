# Task 9 — README + hosting + Android install docs

**Status:** ✅ done · **Issue:** #9 · **Merged:** PR #20

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

## Outcome
✅ **Done.** Merged via PR #20; CI green. **This was the last task — all 9 issues are complete.** The README is a full run/test/deploy/install guide.

## Notes
- Docs-only task; no new code.
- Owner-side to-dos remain: deploy to an HTTPS host, set `ANTHROPIC_API_KEY` + `APP_PIN` + a spend cap, and verify real voice + install on an Android phone.
