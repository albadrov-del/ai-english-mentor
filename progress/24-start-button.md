# S2-4 (#24) — "Start conversation" button

**Status:** 🟡 in progress · **Issue:** #24 · **Branch:** `feat/24-start-button` · **PR:** (pending)

## Done
- `public/js/app.js` `renderHome()` — each profile item now renders an explicit
  **▶ Start conversation** button (`data-testid="start-profile"`, primary) next to **Edit**,
  wrapped in a `.profile-actions` row; clicking it opens the conversation screen directly.
  A one-line intro **`list-hint`** appears whenever ≥1 profile exists (hidden when empty,
  where the existing `empty-hint` shows instead). Tapping the profile name still works too.
- `public/index.html` — `data-testid="list-hint"` paragraph.
- `public/styles.css` — `.profile-item` wraps; name on its own row, actions right-aligned
  below (mobile-friendly); `.profile-actions` / `.list-hint`.
- `tests/e2e/profiles.spec.js` — Start opens the conversation (greeting + avatar visible);
  intro hint hidden when empty, visible with profiles. **75 unit/API green**; `--list` = 17 E2E.

## Notes
- No new screen (spec screen 1), per DoD. The button reuses `openConversation()`.

## Next (resume here)
- [ ] Push, open PR `Closes #24`, confirm CI green (`gh pr checks <PR>`), self-merge → flip PROGRESS
      S2-4 to ✅ → continue to **S2-5 (#25)** — save conversations (history + resume), `public/js/history.js`.
