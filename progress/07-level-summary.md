# Task 7 — Level adaptation + session summary + prompt refinement

**Status:** 🟡 in progress · **Issue:** #7 · **Branch:** `feat/07-level-summary`

## Done
- `server/prompt.js` — `levelGuidance(level)` (A1/A2 beginner · B1/B2 intermediate · C1 advanced) injected into `buildSystemPrompt`; gentle error-correction rule kept (spec §3); new `buildSummaryPrompt(profile)` (what went well + 2–3 things to practice).
- `server/app.js` — `POST /api/summary` (PIN-gated; summary system prompt built server-side; transcript + a final elicitation turn). Shared `sanitizeMessages` / `extractText` helpers.
- `api.js` — `sendSummary`. `app.js` — End session fetches the summary (loading state) and renders it in `summary-body`, with a graceful fallback on error.
- Tests: +4 unit (level bands distinct; summary prompt) + 4 API (`/api/summary`: 401, 200, server-built prompt + elicitation + client `system` ignored, 502) + 2 E2E (summary renders; error fallback). **48 total green** locally.

## Next (resume here)
- [ ] Confirm CI green on the PR (verify `gh pr checks <PR>` conclusions; E2E runs in CI only).
- [ ] When green: **self-merge** `Closes #7`, finalize this note, PROGRESS → ✅, continue to **Issue #8** (PWA wrapper: manifest, service worker, icons).

## Notes
- The frontend still never sends a system prompt — both `/api/chat` and `/api/summary` build it server-side.
- Speaking the summary aloud could be added later; for now it renders on the summary screen.
