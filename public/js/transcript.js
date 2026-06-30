// Pure transcript-cleanup helpers (Sprint 3 / #33). No DOM — unit-testable.
// Guards against two Web Speech API problems before text reaches the model:
//   1. Repeated phrases — the continuous-mode auto-restart can re-recognize overlapping
//      audio, producing e.g. "scream to filter scream to filter scream to filter".
//   2. Background-noise junk — short/punctuation-only fragments that aren't real speech.

/**
 * Collapse consecutive repeated words/phrases. Scans phrase windows (largest first) and
 * drops an n-gram when it immediately repeats the one before it, until stable. The casing
 * of the kept tokens is preserved; comparison is case-insensitive.
 */
export function dedupeTranscript(text, { maxPhrase = 6 } = {}) {
  const words = String(text ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean);
  if (words.length < 2) return words.join(' ');

  let changed = true;
  while (changed) {
    changed = false;
    const start = Math.min(maxPhrase, Math.floor(words.length / 2));
    for (let size = start; size >= 1 && !changed; size--) {
      for (let i = 0; i + 2 * size <= words.length; i++) {
        const a = words.slice(i, i + size).join(' ').toLowerCase();
        const b = words.slice(i + size, i + 2 * size).join(' ').toLowerCase();
        if (a === b) {
          words.splice(i + size, size); // drop the immediate duplicate
          changed = true;
          break;
        }
      }
    }
  }
  return words.join(' ');
}

/**
 * True for utterances not worth sending to the model: empty, no letters at all
 * (pure punctuation / digits / noise), or a lone stray letter. Real short words like
 * "hi", "ok", "no", "I", "a" are intentionally kept.
 */
export function isJunk(text) {
  const t = String(text ?? '').trim();
  if (t.length === 0) return true;
  if (!/[a-z]/i.test(t)) return true; // punctuation / digits only
  if (t.length === 1 && !/[ia]/i.test(t)) return true; // stray single letter (e.g. "s")
  return false;
}
