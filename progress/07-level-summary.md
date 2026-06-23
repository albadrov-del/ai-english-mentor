# Task 7 — Level adaptation + session summary + prompt refinement

**Status:** ✅ done · **Issue:** #7 · **Merged:** PR #18

## Done
- `server/prompt.js` — `levelGuidance(level)` (A1/A2 beginner · B1/B2 intermediate · C1 advanced) injected into `buildSystemPrompt`; gentle error-correction rule kept (spec §3); new `buildSummaryPrompt(profile)` (what went well + 2–3 things to practice).
- `server/app.js` — `POST /api/summary` (PIN-gated; summary system prompt built server-side; transcript + a final elicitation turn). Shared `sanitizeMessages` / `extractText` helpers.
- `api.js` — `sendSummary`. `app.js` — End session fetches the summary (loading state) and renders it in `summary-body`, with a graceful fallback on error.
- Tests: +4 unit (level bands distinct; summary prompt) + 4 API (`/api/summary`: 401, 200, server-built prompt + elicitation + client `system` ignored, 502) + 2 E2E (summary renders; error fallback). **48 total green** locally.

## Outcome
✅ **Done.** Merged via PR #18; CI green. Level-adaptive prompts (A1–C1) + a Claude end-of-session summary. Next: **Issue #8** (PWA wrapper: manifest, service worker, icons).

## Notes
- The frontend still never sends a system prompt — both `/api/chat` and `/api/summary` build it server-side.
- Speaking the summary aloud could be added later; for now it renders on the summary screen.
