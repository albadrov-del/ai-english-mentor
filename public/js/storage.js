// Thin localStorage wrapper for profiles. Browser-only (verified via E2E, not unit tests).
// Kept deliberately small so the testable logic lives in profiles.js.

export const STORAGE_KEY = 'aem.profiles.v1';

/** Load the saved profiles array, or [] if none / corrupt. */
export function loadProfiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Persist the profiles array. */
export function saveProfiles(profiles) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}
