# Task 1 — Frontend scaffold: profile select + edit (localStorage)

**Status:** 🟡 in progress · **Issue:** #1 · **Branch:** `feat/01-profile-screens`

## Done so far
- Harness: `package.json` (ESM) + `jest.config.json`; `npm test` runs Jest via `node --experimental-vm-modules`.
- CI: `.github/workflows/ci.yml` runs `npm ci` + `npm test` on push/PR.
- `public/js/profiles.js` — pure profile logic: `LEVELS` (A1–C1), `createProfile`, `validateProfile`, `upsertProfile`, `deleteProfile`, `findProfile`.
- `public/js/storage.js` — thin localStorage wrapper (`loadProfiles`/`saveProfiles`, key `aem.profiles.v1`).
- `tests/unit/profiles.test.js` — **12 passing** unit tests.
- `public/index.html` + `public/styles.css` — mobile-first shell, three screens with `data-testid` hooks.
- `public/js/app.js` — screen router + CRUD wiring to localStorage (create / edit / delete; select profile → conversation placeholder). Syntax-checked; unit tests green.
- Playwright wired: `playwright.config.js`, `scripts/dev-server.mjs` (static server for tests), `tests/e2e/profiles.spec.js` (2 specs: full CRUD + persistence across reloads; validation blocks an incomplete profile). `@playwright/test` added; CI `e2e` job added.

## Next (to finish #1's DoD) — resume here
- [ ] Confirm CI is green on the PR (unit **and** Playwright E2E). ⚠️ The Playwright **browser download is blocked on this machine's network** (TLS `UNABLE_TO_VERIFY_LEAF_SIGNATURE` on Playwright's CDN), so E2E cannot run locally — **CI is the E2E gate.** Don't self-merge until CI is green.
- [ ] When CI is green: **self-merge** PR `Closes #1`, finalize this note, flip the PROGRESS row to ✅, then continue to Issue #2.
- [ ] If CI E2E fails: read the failing assertion, fix `public/` or the spec, push, re-check CI.

## Notes
- Pure logic is DOM/storage-free so it unit-tests in Node; storage + UI are verified via Playwright E2E (per the testing strategy).
- `npm install` flagged 18 moderate advisories from transitive **dev** deps (Jest) — not runtime; revisit if needed.
