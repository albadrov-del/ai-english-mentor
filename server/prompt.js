// Pure backend logic: builds the tutor system prompt and checks the access PIN.
// No Express, no SDK — unit-testable. Spec §5 is the basis (refined further in #7).

export const MODEL = 'claude-haiku-4-5-20251001';

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

About them (use to choose natural conversation topics, do not interrogate):
${safeInterests}

Rules:
- Keep a natural spoken conversation. Ask follow-up questions. One idea at a time.
- Match ${safeLevel}: at A1/A2 use short, simple sentences and a slower pace; at B1/B2 speak conversationally; at C1 speak naturally, with nuance.
- When they make a mistake, gently model the correct form in your reply instead of stopping to lecture. Don't correct every small thing — keep it encouraging.
- Keep your turns short (this is spoken, not written): 1–3 sentences usually.
- When the user signals they want to stop, give a short, encouraging summary: what went well + 2–3 things to practice.`;
}

/** PIN gate: true only on an exact match against a non-empty configured PIN (fail closed). */
export function checkPin(provided, expected) {
  return typeof expected === 'string' && expected.length > 0 && provided === expected;
}
