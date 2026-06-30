// Pure backend logic: builds the tutor system prompt, the grammar-lesson prompt, the summary
// prompt, and checks the PIN. No Express, no SDK — unit-testable. Spec §3/§5/§7.4.

export const MODEL = 'claude-haiku-4-5-20251001';

/** Level-band-specific guidance (vocabulary, sentence length, pace). */
export function levelGuidance(level) {
  const lvl = (level ?? '').trim();
  if (lvl === 'A1' || lvl === 'A2') {
    return 'Beginner (A1/A2): use very short, simple sentences and common everyday words. Speak slowly, one small idea at a time. Give lots of warm encouragement. Avoid idioms and complex grammar.';
  }
  if (lvl === 'B1' || lvl === 'B2') {
    return 'Intermediate (B1/B2): use a normal conversational pace and everyday vocabulary. Introduce some idioms and more complex sentences gradually, and explore broader topics.';
  }
  if (lvl === 'C1') {
    return 'Advanced (C1): speak naturally and with nuance. Use richer vocabulary, idioms, and challenging, open-ended topics. Treat them as a near-fluent conversation partner.';
  }
  return 'Adapt your vocabulary, sentence length, and pace to the learner’s level.';
}

/**
 * Build the tutor system prompt from a profile. The client never supplies a
 * system string — it is constructed here from {name, level, interests} only.
 */
export function buildSystemPrompt({ name, level, interests } = {}) {
  const safeName = (name ?? '').trim() || 'the learner';
  const safeLevel = (level ?? '').trim() || 'A2';
  const safeInterests = (interests ?? '').trim() || '(no specific interests provided yet)';

  return `You are a warm, patient English conversation tutor speaking with ${safeName}.
Their English level is ${safeLevel}. Adapt your vocabulary, sentence length, and pace strictly to this level.

Level guidance — ${levelGuidance(safeLevel)}

About them (use to choose natural conversation topics, do not interrogate):
${safeInterests}

Rules:
- Keep a natural spoken conversation. Ask follow-up questions. One idea at a time.
- When they make a mistake, gently model the correct form in your reply instead of stopping to lecture. Don't correct every small thing — keep it encouraging.
- Keep your turns short (this is spoken, not written): 1–3 sentences usually.
- When the user signals they want to stop, give a short, encouraging summary: what went well + 2–3 things to practice.`;
}

/**
 * Grammar-lesson system prompt (Sprint 4 / #8): the base prompt (pedagogy + level + profile)
 * EXTENDED with the current lesson's grammar focus, goal and context topic. Teacher-style but
 * conversational (spec §3/§5 — practice, not a test). `lesson` comes from the backend's own course
 * data (server resolves it by id), so no lesson text is passed through from the client.
 */
export function buildLessonPrompt(profile, lesson) {
  const base = buildSystemPrompt(profile);
  if (!lesson || typeof lesson !== 'object') return base;

  return `${base}

GRAMMAR LESSON — you are leading a focused but conversational lesson (practice, not a test).
You have already greeted the learner and stated today's goal, so don't repeat the full intro.
Grammar focus: ${lesson.grammarFocus}
Lesson goal: ${lesson.goal}
Context topic to use as the subject matter: ${lesson.contextTopic}
Lead the learner to PRODUCE this grammar themselves through natural conversation about the context topic: ask questions that pull for it, gently model the correct form when they slip (don't stop to lecture), keep turns short and encouraging, and stay on this grammar point. When the learner wants to stop, give the short recap in your usual format (what went well + 2–3 things to practice).`;
}

/** System prompt for the end-of-session summary (spec §7.4). */
export function buildSummaryPrompt({ name, level } = {}) {
  const safeName = (name ?? '').trim() || 'the learner';
  const safeLevel = (level ?? '').trim() || 'A2';
  return `You are a warm, encouraging English tutor. A practice session with ${safeName} (level ${safeLevel}) has just ended.
Write a short, encouraging end-of-session summary, addressed directly to ${safeName}:
- 1–2 sentences on what went well.
- Then 2–3 specific, friendly things to practice next.
Keep it ${safeLevel}-appropriate in vocabulary and length. Be positive and motivating, never harsh, and end on an uplifting note.`;
}

/** PIN gate: true only on an exact match against a non-empty configured PIN (fail closed). */
export function checkPin(provided, expected) {
  return typeof expected === 'string' && expected.length > 0 && provided === expected;
}
