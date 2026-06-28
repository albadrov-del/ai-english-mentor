// Pure backend logic: builds the tutor system prompt, the summary prompt, and checks the PIN.
// No Express, no SDK — unit-testable. Spec §3/§5/§7.4.
import { PHASES } from '../public/js/curriculum.js';

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
 * Tutor-mode system prompt: the base prompt (pedagogy + level + profile) EXTENDED with a
 * private lesson guide from the curriculum (spec §3/§5 — phases steer the tutor, they are not
 * announced and it stays a conversation, not a test). `session` comes from the backend's own
 * curriculum (server resolves it by id), so no lesson text is passed through from the client.
 */
export function buildTutorPrompt(profile, session, phase) {
  const base = buildSystemPrompt(profile);
  if (!session || typeof session !== 'object') return base;

  const ph = PHASES.includes(phase) ? phase : PHASES[0];
  const vocab = Array.isArray(session.vocab) ? session.vocab.join(', ') : '';
  const phrases = Array.isArray(session.phrases) ? session.phrases.join('; ') : '';
  const guide = session.phases?.[ph];
  const guideText = Array.isArray(guide) ? guide.join(' / ') : guide ?? '';

  return `${base}

LESSON CONTEXT — a private guide for you only. Do NOT read it aloud, and never announce phases or steps; just steer the conversation naturally.
Topic: ${session.title}. Lesson goal: ${session.goal}
Target vocabulary to weave in when it fits: ${vocab}
Useful phrases to model: ${phrases}
Right now you are around the "${ph}" stage: ${guideText}
Move between stages smoothly and conversationally. Keep it a friendly chat, not a test — gently model corrections as you go. When the learner wants to stop, give the short encouraging recap (what went well + 2–3 things to practice).`;
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
