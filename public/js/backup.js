// Export / import the user's data as a JSON file (Sprint 3 / #34). Pure — no DOM —
// so it is unit-testable; the UI wiring lives in app.js. A manual backup in case the
// browser clears site data (storage stays localStorage; no cloud sync — spec §6/§8).
//
// The backup carries profiles + conversation history ONLY. It NEVER includes the access
// PIN (a shared secret — spec §4).

import { migrateConversation } from './history.js';
import { validateProfile, withVoiceDefaults } from './profiles.js';

export const BACKUP_APP = 'ai-english-mentor';
export const BACKUP_VERSION = 1;

/** Wrap profiles + history in a versioned, timestamped envelope (no PIN). */
export function buildBackup({ profiles = [], history = [] } = {}, exportedAt = new Date().toISOString()) {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt,
    profiles: Array.isArray(profiles) ? profiles : [],
    history: Array.isArray(history) ? history : [],
  };
}

/**
 * Parse + validate a backup (string or already-parsed object). Reuses the same migration
 * the app uses on load, so imported data is normalized: profiles get voice defaults and are
 * dropped if invalid; history is run through `migrateConversation`.
 * @returns {{ profiles: object[], history: object[] }}
 * @throws {Error} with a user-friendly message on bad JSON or an unrecognized file.
 */
export function parseBackup(input) {
  let data;
  try {
    data = typeof input === 'string' ? JSON.parse(input) : input;
  } catch {
    throw new Error('That file isn’t valid JSON.');
  }
  if (!data || typeof data !== 'object' || data.app !== BACKUP_APP) {
    throw new Error('That doesn’t look like an AI English Mentor backup.');
  }
  const rawProfiles = Array.isArray(data.profiles) ? data.profiles : [];
  const rawHistory = Array.isArray(data.history) ? data.history : [];

  const profiles = rawProfiles
    .map((p) => withVoiceDefaults(p))
    .filter((p) => typeof p.id === 'string' && p.id && validateProfile(p).valid);
  const history = rawHistory.map((c) => migrateConversation(c));

  return { profiles, history };
}
