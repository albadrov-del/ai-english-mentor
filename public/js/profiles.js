// Pure profile logic — no DOM, no localStorage, so it is unit-testable in Node.
// The DOM/storage layers (storage.js, the UI modules) build on top of these.

/** CEFR levels supported by the app (spec §2.2): A1 through C1. */
export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

function newId() {
  // crypto.randomUUID is available in browsers and Node 19+. Fallback just in case.
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `p_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/** Build a profile object from raw form input (trims text, assigns an id). */
export function createProfile({ name, level, interests = '' }) {
  return {
    id: newId(),
    name: (name ?? '').trim(),
    level,
    interests: (interests ?? '').trim(),
  };
}

/** Validate a profile. Returns { valid, errors } where errors maps field -> message. */
export function validateProfile(profile) {
  const errors = {};
  if (!profile || typeof profile.name !== 'string' || profile.name.trim() === '') {
    errors.name = 'Name is required.';
  }
  if (!LEVELS.includes(profile?.level)) {
    errors.level = 'Pick a level (A1–C1).';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

/** Insert a new profile or replace the existing one with the same id. Returns a new array. */
export function upsertProfile(profiles, profile) {
  const i = profiles.findIndex((p) => p.id === profile.id);
  if (i === -1) return [...profiles, profile];
  const copy = profiles.slice();
  copy[i] = profile;
  return copy;
}

/** Remove a profile by id. Returns a new array. */
export function deleteProfile(profiles, id) {
  return profiles.filter((p) => p.id !== id);
}

/** Find a profile by id, or null. */
export function findProfile(profiles, id) {
  return profiles.find((p) => p.id === id) ?? null;
}
