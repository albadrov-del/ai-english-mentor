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

const HISTORY_KEY = 'aem.history.v1';

/** Load the saved conversations array, or [] if none / corrupt. */
export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Persist the conversations array. */
export function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    /* ignore (quota / private mode) */
  }
}

const PIN_KEY = 'aem.pin.v1';

/** Load the saved access PIN (empty string if none). */
export function loadPin() {
  try {
    return localStorage.getItem(PIN_KEY) ?? '';
  } catch {
    return '';
  }
}

/** Persist the access PIN. */
export function savePin(pin) {
  try {
    localStorage.setItem(PIN_KEY, pin ?? '');
  } catch {
    /* ignore */
  }
}

const PTT_KEY = 'aem.ptt.v1';

/** Whether push-to-talk (hold-to-speak) mode is enabled (#33). */
export function loadPushToTalk() {
  try {
    return localStorage.getItem(PTT_KEY) === '1';
  } catch {
    return false;
  }
}

/** Persist the push-to-talk preference. */
export function savePushToTalk(on) {
  try {
    localStorage.setItem(PTT_KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
}
