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

## Next (to finish #1's DoD) — resume here
- [ ] Playwright: add `@playwright/test` + `playwright.config.js` + a tiny static server (`scripts/dev-server.mjs`) + `tests/e2e/profiles.spec.js` (create → edit → delete + persistence across reload). Add an E2E job to CI. Selectors already in the DOM: `new-profile`, `profile-item`, `select-profile`, `edit-profile`, `profile-name`, `profile-level`, `profile-interests`, `save-profile`, `delete-profile`, `editor-back`, `conversation-screen`, `conversation-greeting`, `conversation-back`.
- [ ] DoD met → PR `Closes #1` → **self-merge** → finalize this note → flip PROGRESS row to ✅.

## Notes
- Pure logic is DOM/storage-free so it unit-tests in Node; storage + UI are verified via Playwright E2E (per the testing strategy).
- `npm install` flagged 18 moderate advisories from transitive **dev** deps (Jest) — not runtime; revisit if needed.
