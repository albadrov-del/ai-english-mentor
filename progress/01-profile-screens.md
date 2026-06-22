# Task 1 — Frontend scaffold: profile select + edit (localStorage)

**Status:** 🟡 in progress · **Issue:** #1 · **Branch:** `feat/01-profile-screens`

## Done so far
- Harness: `package.json` (ESM) + `jest.config.json`; `npm test` runs Jest via `node --experimental-vm-modules`.
- CI: `.github/workflows/ci.yml` runs `npm ci` + `npm test` on push/PR.
- `public/js/profiles.js` — pure profile logic: `LEVELS` (A1–C1), `createProfile`, `validateProfile`, `upsertProfile`, `deleteProfile`, `findProfile`.
- `public/js/storage.js` — thin localStorage wrapper (`loadProfiles`/`saveProfiles`, key `aem.profiles.v1`).
- `tests/unit/profiles.test.js` — **12 passing** unit tests.

## Next (to finish #1's DoD) — resume here
- [ ] `public/index.html` + `public/styles.css` — mobile-first shell.
- [ ] UI modules + a simple screen router in `public/js/app.js`: home (list profiles + "New profile"), editor (name / level A1–C1 / interests; save + delete), placeholder conversation screen.
- [ ] Wire storage: load on start; save on create/edit/delete; selecting a profile → conversation placeholder.
- [ ] Playwright: add `@playwright/test` + `playwright.config.js` + a tiny static server for tests + `tests/e2e/profiles.spec.js` (create → edit → delete + persistence across reload). Add an E2E job to CI.
- [ ] DoD met → PR `Closes #1` → **self-merge** → finalize this note → flip PROGRESS row to ✅.

## Notes
- Pure logic is DOM/storage-free so it unit-tests in Node; storage + UI are verified via Playwright E2E (per the testing strategy).
- `npm install` flagged 18 moderate advisories from transitive **dev** deps (Jest) — not runtime; revisit if needed.
