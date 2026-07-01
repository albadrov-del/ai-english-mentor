// Per-profile, per-level learning progress (Sprint 4 / #40). Pure — no DOM — unit-testable.
// Shape: { [profileId]: { [level]: { completed: [lessonId], exam: { initial, final } } } }
// Persisted in localStorage (storage.js) and folded into export/import (backup.js). Progress is
// kept PER LEVEL, so switching a profile's level keeps each level's progress separate.

function entryFor(progress, profileId, level) {
  const e = progress?.[profileId]?.[level];
  return {
    completed: Array.isArray(e?.completed) ? e.completed : [],
    exam: e?.exam && typeof e.exam === 'object' ? e.exam : {},
  };
}

/** Safe accessor: always returns { completed: [], exam: {} }. */
export function getLevelProgress(progress, profileId, level) {
  return entryFor(progress, profileId, level);
}

export function isComplete(progress, profileId, level, lessonId) {
  return entryFor(progress, profileId, level).completed.includes(lessonId);
}

export function completedCount(progress, profileId, level) {
  return entryFor(progress, profileId, level).completed.length;
}

/** Whole-number percent of `total` lessons completed at this level (0 when total ≤ 0). */
export function levelPercent(progress, profileId, level, total) {
  if (!total || total <= 0) return 0;
  const done = Math.min(completedCount(progress, profileId, level), total);
  return Math.round((done / total) * 100);
}

// All updates return a NEW progress object (no mutation).
function withLevel(progress, profileId, level, updater) {
  const base = progress && typeof progress === 'object' ? progress : {};
  const forProfile = { ...(base[profileId] ?? {}) };
  forProfile[level] = updater(entryFor(base, profileId, level));
  return { ...base, [profileId]: forProfile };
}

export function markComplete(progress, profileId, level, lessonId) {
  return withLevel(progress, profileId, level, (entry) => ({
    ...entry,
    completed: entry.completed.includes(lessonId) ? entry.completed : [...entry.completed, lessonId],
  }));
}

/** "Start over": clear this level's completed lessons (keeps exam scores). */
export function resetLevel(progress, profileId, level) {
  return withLevel(progress, profileId, level, (entry) => ({ ...entry, completed: [] }));
}

/** "Clear progress": remove all of a profile's progress (every level + exams). */
export function clearProfile(progress, profileId) {
  const base = progress && typeof progress === 'object' ? progress : {};
  const next = { ...base };
  delete next[profileId];
  return next;
}

/** Save an exam result for a level: which = 'initial' | 'final' (used by S4-3). */
export function setExam(progress, profileId, level, which, result) {
  return withLevel(progress, profileId, level, (entry) => ({
    ...entry,
    exam: { ...entry.exam, [which]: result },
  }));
}

export function getExam(progress, profileId, level) {
  return entryFor(progress, profileId, level).exam;
}
