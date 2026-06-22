# Task 1 — Frontend scaffold: profile select + edit (localStorage)

**Status:** ✅ done · **Issue:** #1 · **Merged:** PR #11 (squash `373831c`)

## Done so far
- Harness: `package.json` (ESM) + `jest.config.json`; `npm test` runs Jest via `node --experimental-vm-modules`.
- CI: `.github/workflows/ci.yml` runs `npm ci` + `npm test` on push/PR.
- `public/js/profiles.js` — pure profile logic: `LEVELS` (A1–C1), `createProfile`, `validateProfile`, `upsertProfile`, `deleteProfile`, `findProfile`.
- `public/js/storage.js` — thin localStorage wrapper (`loadProfiles`/`saveProfiles`, key `aem.profiles.v1`).
- `tests/unit/profiles.test.js` — **12 passing** unit tests.
- `public/index.html` + `public/styles.css` — mobile-first shell, three screens with `data-testid` hooks.
- `public/js/app.js` — screen router + CRUD wiring to localStorage (create / edit / delete; select profile → conversation placeholder). Syntax-checked; unit tests green.
- Playwright wired: `playwright.config.js`, `scripts/dev-server.mjs` (static server for tests), `tests/e2e/profiles.spec.js` (2 specs: full CRUD + persistence across reloads; validation blocks an incomplete profile). `@playwright/test` added; CI `e2e` job added.

## Outcome
✅ **Done.** All CI checks green (Jest unit ×12 + Playwright E2E ×2), merged to `main` via PR #11 (squash `373831c`). Next: **Issue #2** (conversation screen shell + navigation).

> ⚠️ Carries forward to all browser-test tasks: Playwright's browser download is **blocked on the dev machine** (TLS `UNABLE_TO_VERIFY_LEAF_SIGNATURE` on Playwright's CDN), so Playwright E2E is **validated in CI, not locally**. Write the spec, push, and gate the self-merge on CI being green.

## Notes
- Pure logic is DOM/storage-free so it unit-tests in Node; storage + UI are verified via Playwright E2E (per the testing strategy).
- `npm install` flagged 18 moderate advisories from transitive **dev** deps (Jest) — not runtime; revisit if needed.
