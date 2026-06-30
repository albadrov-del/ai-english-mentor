// Grammar-backbone course (Sprint 4 / #8). Pure — no DOM, no other imports — so it is shared by
// the browser (Course UI, lesson opener) and the backend (server/prompt.js builds the lesson prompt
// from it). The frontend sends only a lessonId; the backend looks the lesson up here, so no lesson
// text is passed through from the client.
//
// Grammar is the backbone: each lesson teaches ONE grammar unit, ordered simple→complex, practiced
// in the context of a topic from the learner's profile (water treatment, dramas, family, travel,
// pool). Lessons exist per CEFR level; only the learner's selected level is offered. Extend by adding
// to GRAMMAR_LESSONS. (Pedagogy stays conversational, spec §3/§5; the exam — EXAMS — arrives in S4-3.)

/** Internal phase guide for a lesson (the tutor moves through these naturally). */
export const LESSON_PHASES = ['warmup', 'teaching', 'practice', 'recap'];

export const GRAMMAR_LESSONS = {
  A1: [
    { id: 'a1-1', level: 'A1', order: 1, grammarFocus: 'present simple of "to be" (am/is/are)', goal: 'Introduce yourself and describe people and things using am/is/are.', contextTopic: 'your family and home' },
    { id: 'a1-2', level: 'A1', order: 2, grammarFocus: 'there is / there are', goal: 'Say what exists around you using there is and there are.', contextTopic: 'your home and town' },
    { id: 'a1-3', level: 'A1', order: 3, grammarFocus: 'present simple (verbs) + adverbs of frequency', goal: 'Talk about routines using the present simple and words like always/usually/sometimes.', contextTopic: 'your daily routine at work' },
    { id: 'a1-4', level: 'A1', order: 4, grammarFocus: 'can / can’t (ability)', goal: 'Say what you can and can’t do using can and can’t.', contextTopic: 'skills at work and hobbies' },
    { id: 'a1-5', level: 'A1', order: 5, grammarFocus: 'articles a/an/the and plural nouns', goal: 'Use a, an, the and plural nouns correctly.', contextTopic: 'things around a kitchen or a pool' },
    { id: 'a1-6', level: 'A1', order: 6, grammarFocus: 'past simple of "to be" (was/were)', goal: 'Talk about the past using was and were.', contextTopic: 'a past holiday' },
  ],
  A2: [
    { id: 'a2-1', level: 'A2', order: 1, grammarFocus: 'past simple (regular and irregular verbs)', goal: 'Tell short stories about the past using the past simple.', contextTopic: 'your last family trip' },
    { id: 'a2-2', level: 'A2', order: 2, grammarFocus: 'present continuous (now vs in general)', goal: 'Describe what is happening now versus what you do in general.', contextTopic: 'what you are working on these days' },
    { id: 'a2-3', level: 'A2', order: 3, grammarFocus: '"going to" for future plans', goal: 'Talk about plans and intentions using "going to".', contextTopic: 'your plans for next summer' },
    { id: 'a2-4', level: 'A2', order: 4, grammarFocus: 'comparatives and superlatives', goal: 'Compare things using -er / more and the most.', contextTopic: 'comparing series and dramas you watch' },
    { id: 'a2-5', level: 'A2', order: 5, grammarFocus: 'some/any, much/many (countable & uncountable)', goal: 'Use some, any, much and many with countable and uncountable nouns.', contextTopic: 'shopping and cooking at home' },
    { id: 'a2-6', level: 'A2', order: 6, grammarFocus: 'present perfect (ever / never)', goal: 'Talk about life experiences using ever and never.', contextTopic: 'experiences you have had' },
  ],
  B1: [
    { id: 'b1-1', level: 'B1', order: 1, grammarFocus: 'present perfect vs past simple', goal: 'Choose correctly between the present perfect and the past simple.', contextTopic: 'your work experience' },
    { id: 'b1-2', level: 'B1', order: 2, grammarFocus: 'will vs going to', goal: 'Use will and going to for predictions, decisions and plans.', contextTopic: 'predictions about your field' },
    { id: 'b1-3', level: 'B1', order: 3, grammarFocus: 'first conditional (real future)', goal: 'Talk about real future possibilities with if + present, will.', contextTopic: 'safety and procedures at work' },
    { id: 'b1-4', level: 'B1', order: 4, grammarFocus: 'second conditional (hypothetical)', goal: 'Talk about hypothetical situations with if + past, would.', contextTopic: 'what you would improve at your site' },
    { id: 'b1-5', level: 'B1', order: 5, grammarFocus: 'passive voice (present and past)', goal: 'Describe processes with the passive (it is treated, it was cleaned).', contextTopic: 'how water is treated' },
    { id: 'b1-6', level: 'B1', order: 6, grammarFocus: 'modals: should / must / have to', goal: 'Give advice and talk about obligation using should, must and have to.', contextTopic: 'advising a friend on pool care' },
  ],
};

/** Lessons for a CEFR level, in order (empty array if none seeded for that level yet). */
export function lessonsForLevel(level) {
  return (GRAMMAR_LESSONS[level] ?? []).slice().sort((a, b) => a.order - b.order);
}

/** Find a lesson by id across all levels, or null. */
export function getLesson(id) {
  for (const level of Object.keys(GRAMMAR_LESSONS)) {
    const found = GRAMMAR_LESSONS[level].find((l) => l.id === id);
    if (found) return found;
  }
  return null;
}

/**
 * The tutor's opening line for a lesson — states the goal up front (spec #8), shown locally so the
 * lesson always opens well without an API call. Pure + deterministic (also unit-tested).
 */
export function lessonOpener(lesson) {
  if (!lesson) return '';
  return `Today we'll practice ${lesson.grammarFocus}. ${lesson.goal} Let's talk about ${lesson.contextTopic} while we do it — ready when you are!`;
}
