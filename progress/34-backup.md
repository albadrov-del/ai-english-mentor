# S3-2 (#34) — Export / Import data (JSON backup)

**Status:** ✅ done · **Issue:** #34 · **Merged:** PR #37

## Done
- `public/js/backup.js` (pure): `buildBackup({profiles, history}, exportedAt?)` → versioned,
  timestamped envelope `{ app:'ai-english-mentor', version:1, exportedAt, profiles, history }` that
  **never includes the PIN**; `parseBackup(text|obj)` validates the envelope, **reuses**
  `migrateConversation` (history.js) + `validateProfile`/`withVoiceDefaults` (profiles.js) so imported
  data is normalized (invalid profiles dropped, history migrated), throws a friendly message on bad
  JSON or an unrecognized file.
- `public/js/app.js`: Settings **Export data** (downloads a Blob as JSON, filename
  `ai-english-mentor-backup-YYYY-MM-DD.json`) + **Import data** (hidden file input → `parseBackup` →
  **confirm-overwrite only when data already exists** → `saveProfiles`/`saveHistory` → re-render);
  a `backup-status` line for success/error feedback.
- `public/index.html` + `styles.css`: backup controls + status styling.
- Tests: `tests/unit/backup.test.js` (+7); `tests/e2e/backup.spec.js` (+3: export download has the
  profile and no PIN; import restores a profile; bad file → friendly error). **122 unit/API green**;
  `--list` = 26 E2E.

## Notes
- Storage stays **localStorage** (owner decision) — no IndexedDB migration. The backup is the
  robustness answer to a cache-clear; true permanent storage (Capacitor/cloud) is the #9 follow-up.

## Outcome
✅ **Done.** Merged via PR #37; CI green (E2E ×2, Unit ×2); auto-deployed to Render.
Next: **S3-3 (#35)** — level-gated lessons (final Sprint 3 issue).
