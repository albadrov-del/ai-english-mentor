# S2-1 (#21) — Logging / observability

**Status:** 🟡 in progress · **Issue:** #21 · **Branch:** `feat/21-logging` · **PR:** #27

## Done
- `public/js/log.js` — leveled logger (DEBUG/INFO/WARN/ERROR), debug via `?debug=1` / `localStorage aem.debug`; `redact()` masks secret-named keys + `sk-ant-…` tokens; `mountDebugPanel` (mounts only when debug on).
- Instrumented `api.js` (request/response/errors), `speech.js` (mic start/stop/result/end), `app.js` (chat.send, mic.error warn, panel mount).
- `server/app.js` — logs the real `/api/*` upstream cause (status/name/message); never the key/headers.
- `.debug-panel` styles. 10 unit tests; **58 total green** locally.

## Next (resume here)
- [ ] Confirm CI green on PR #27 (`gh pr checks 27`), self-merge → flip PROGRESS S2-1 to ✅ → continue to **S2-2 (#22)** (mic continuous-capture + silence-timeout).

## Notes
- Frontend logger redacts before any sink; backend uses `console.error` (Render captures stdout/stderr).
- Fixes the earlier opaque "Could not reach the tutor" — the real cause is now visible in Render logs.
