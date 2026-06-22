# Task 4 — Wire frontend to Claude (text conversation works)

**Status:** ✅ done · **Issue:** #4 · **Merged:** PR #15

## Done
- `public/js/api.js` — `buildChatBody(profile, messages)` (pure; strips any `system` and non user/assistant roles) + `sendChat({ profile, messages, pin })` (fetch `POST /api/chat` with the `x-app-pin` header).
- `app.js` `onSend` now calls the proxy (replaces the stub): appends the user turn, POSTs `{ profile, messages }` + PIN, renders Claude's reply, keeps multi-turn history; on failure shows `chat-error` (401 → PIN hint); a `sending` flag disables the input mid-request.
- `storage.js` `loadPin`/`savePin`; `index.html` Settings PIN input (home) + `chat-error` (conversation).
- Tests: 4 unit (`tests/unit/chat-request.test.js`) — **28 total green** locally; E2E updated (network-mocked): reply renders, multi-turn history forwarded, error state, PIN persists.

## Outcome
✅ **Done.** Merged via PR #15; CI green (unit + API + E2E). The app now holds a real text conversation with Claude end-to-end (live with the owner's key; mocked in CI). Next: **Issue #5** — voice input/output via the Web Speech API.

## Notes
- The frontend never sends a system prompt — the backend builds it (enforced in both `api.js` and `server/app.js`).
- PIN is stored in localStorage (`aem.pin.v1`), entered via home → Settings. Real end-to-end against live Claude is owner-side (needs the key).
- **Milestone:** the app now holds a real text conversation with Claude end-to-end (mocked in CI; real with the owner's key).
