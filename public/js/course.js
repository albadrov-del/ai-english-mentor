// Grammar-backbone course (Sprint 4 / #8). Pure — no DOM, no other imports — so it is shared by
// the browser (Course UI, lesson opener) and the backend (server/prompt.js builds the lesson prompt
// from it). The frontend sends only a lessonId; the backend looks the lesson up here, so no lesson
// text is passed through from the client.
//
// Grammar is the backbone: each lesson teaches ONE grammar unit, ordered simple→complex, practiced
// in the context of a topic from the learner's profile (water treatment, dramas, family, travel,
// pool). Lessons exist per CEFR level (A1–C1); only the learner's selected level is offered. Extend
// by adding to GRAMMAR_LESSONS. (Pedagogy stays conversational, spec §3/§5; the exam is EXAMS, below.)

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
  B2: [
    { id: 'b2-1', level: 'B2', order: 1, grammarFocus: 'present perfect continuous', goal: 'Talk about recent, ongoing activities and their duration using "have been + -ing".', contextTopic: 'projects you have been working on' },
    { id: 'b2-2', level: 'B2', order: 2, grammarFocus: 'past perfect', goal: 'Describe what had already happened before another past event using "had + past participle".', contextTopic: 'an incident or change at your site' },
    { id: 'b2-3', level: 'B2', order: 3, grammarFocus: 'reported speech', goal: 'Report what other people said, shifting tenses and pronouns correctly.', contextTopic: 'what a colleague or supplier told you' },
    { id: 'b2-4', level: 'B2', order: 4, grammarFocus: 'relative clauses (defining & non-defining)', goal: 'Add information about people and things with who, which, that and whose.', contextTopic: 'equipment and people at your workplace' },
    { id: 'b2-5', level: 'B2', order: 5, grammarFocus: 'third and mixed conditionals', goal: 'Talk about unreal past situations and their results ("if I had known, I would have…").', contextTopic: 'decisions you would have made differently' },
    { id: 'b2-6', level: 'B2', order: 6, grammarFocus: 'modals of deduction (must have / might have / can’t have)', goal: 'Make deductions about the past using modal verbs.', contextTopic: 'explaining the likely cause of a fault' },
  ],
  C1: [
    { id: 'c1-1', level: 'C1', order: 1, grammarFocus: 'inversion for emphasis', goal: 'Add emphasis with inverted structures ("Never have I…", "Not only… but also…").', contextTopic: 'presenting results and achievements' },
    { id: 'c1-2', level: 'C1', order: 2, grammarFocus: 'cleft sentences (it-clefts and what-clefts)', goal: 'Highlight key information with "It was… that…" and "What I need is…".', contextTopic: 'making a point in a meeting' },
    { id: 'c1-3', level: 'C1', order: 3, grammarFocus: 'advanced conditionals (unless, provided that, were to)', goal: 'Express precise conditions and consequences in formal English.', contextTopic: 'negotiating terms with a supplier' },
    { id: 'c1-4', level: 'C1', order: 4, grammarFocus: 'participle clauses', goal: 'Speak and write more concisely with -ing and -ed participle clauses.', contextTopic: 'describing a treatment process efficiently' },
    { id: 'c1-5', level: 'C1', order: 5, grammarFocus: 'hedging & modal nuance (may well, is likely to, would tend to)', goal: 'Give cautious, professional opinions with appropriate hedging.', contextTopic: 'assessing risks and options at work' },
    { id: 'c1-6', level: 'C1', order: 6, grammarFocus: 'discourse markers & cohesion', goal: 'Structure an argument with linkers like nevertheless, furthermore and in terms of.', contextTopic: 'making a persuasive case to management' },
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

// ---- Placement / final exam (Sprint 4 / #41) ----
// A FIXED set of spoken prompts per level, one per key grammar unit. The learner answers out loud
// (or by typing); the model grades each answer for correct use of the target grammar. Because the
// set is fixed, the initial and final exam are identical and directly comparable.
export const EXAMS = {
  A1: [
    { id: 'a1-ex-1', grammarFocus: 'present simple of "to be"', prompt: 'Tell me about your family — use is and are.', target: 'am/is/are' },
    { id: 'a1-ex-2', grammarFocus: 'there is / there are', prompt: 'What is in your kitchen? Use "there is" and "there are".', target: 'there is/are' },
    { id: 'a1-ex-3', grammarFocus: 'present simple + frequency', prompt: 'What do you usually do at work? Use always, usually or sometimes.', target: 'present simple + adverbs of frequency' },
    { id: 'a1-ex-4', grammarFocus: 'can / can’t', prompt: 'What can you do well, and what can’t you do?', target: 'can / can’t' },
    { id: 'a1-ex-5', grammarFocus: 'articles + plurals', prompt: 'Describe a few things around you — use a, an, the and plurals.', target: 'articles and plural nouns' },
    { id: 'a1-ex-6', grammarFocus: 'was / were', prompt: 'Where were you last weekend? Use was and were.', target: 'past simple of "to be"' },
  ],
  A2: [
    { id: 'a2-ex-1', grammarFocus: 'past simple', prompt: 'What did you do yesterday? Use the past simple.', target: 'past simple' },
    { id: 'a2-ex-2', grammarFocus: 'present continuous', prompt: 'What are you doing right now, and these days?', target: 'present continuous' },
    { id: 'a2-ex-3', grammarFocus: 'going to (future)', prompt: 'What are you going to do next weekend?', target: '"going to" future' },
    { id: 'a2-ex-4', grammarFocus: 'comparatives / superlatives', prompt: 'Compare two series you like — which is better, and which is the best?', target: 'comparatives and superlatives' },
    { id: 'a2-ex-5', grammarFocus: 'some / any, much / many', prompt: 'What do you need to buy? Use some, any, much and many.', target: 'some/any, much/many' },
    { id: 'a2-ex-6', grammarFocus: 'present perfect', prompt: 'Tell me something you have never done.', target: 'present perfect (ever/never)' },
  ],
  B1: [
    { id: 'b1-ex-1', grammarFocus: 'present perfect vs past simple', prompt: 'What have you done in your job, and what did you do last year?', target: 'present perfect vs past simple' },
    { id: 'b1-ex-2', grammarFocus: 'will vs going to', prompt: 'Make a prediction and a plan about your field.', target: 'will vs going to' },
    { id: 'b1-ex-3', grammarFocus: 'first conditional', prompt: 'What will happen if there is a problem at work? Use if + present, will.', target: 'first conditional' },
    { id: 'b1-ex-4', grammarFocus: 'second conditional', prompt: 'What would you change at your site if you could?', target: 'second conditional' },
    { id: 'b1-ex-5', grammarFocus: 'passive voice', prompt: 'Explain how water is treated — use the passive.', target: 'passive voice' },
    { id: 'b1-ex-6', grammarFocus: 'modals of advice / obligation', prompt: 'Give a friend advice about pool care — use should, must and have to.', target: 'should / must / have to' },
  ],
  B2: [
    { id: 'b2-ex-1', grammarFocus: 'present perfect continuous', prompt: 'What have you been working on recently, and for how long?', target: 'present perfect continuous' },
    { id: 'b2-ex-2', grammarFocus: 'past perfect', prompt: 'Tell me about something that had already happened before a change at work.', target: 'past perfect' },
    { id: 'b2-ex-3', grammarFocus: 'reported speech', prompt: 'A colleague gave you some news — report what they said.', target: 'reported speech' },
    { id: 'b2-ex-4', grammarFocus: 'relative clauses', prompt: 'Describe a piece of equipment and the person who operates it — use relative clauses.', target: 'relative clauses' },
    { id: 'b2-ex-5', grammarFocus: 'third conditional', prompt: 'Tell me about a decision you would have made differently. Use "if I had…".', target: 'third conditional' },
    { id: 'b2-ex-6', grammarFocus: 'modals of deduction', prompt: 'Something went wrong at the plant — what must have or might have caused it?', target: 'modals of deduction (must/might/can’t have)' },
  ],
  C1: [
    { id: 'c1-ex-1', grammarFocus: 'inversion', prompt: 'Emphasise an achievement using inversion — try "Not only…" or "Never have I…".', target: 'inversion for emphasis' },
    { id: 'c1-ex-2', grammarFocus: 'cleft sentences', prompt: 'Highlight the most important point of your work using "What… is…" or "It is… that…".', target: 'cleft sentences' },
    { id: 'c1-ex-3', grammarFocus: 'advanced conditionals', prompt: 'Set a condition for a supplier using "provided that" or "unless".', target: 'advanced conditionals' },
    { id: 'c1-ex-4', grammarFocus: 'participle clauses', prompt: 'Describe a process concisely using participle clauses ("Having tested…", "Treated with…").', target: 'participle clauses' },
    { id: 'c1-ex-5', grammarFocus: 'hedging', prompt: 'Give a cautious professional opinion about a risk — hedge with "is likely to" or "may well".', target: 'hedging / modal nuance' },
    { id: 'c1-ex-6', grammarFocus: 'discourse markers', prompt: 'Make a short persuasive argument using linkers like "furthermore" and "nevertheless".', target: 'discourse markers and cohesion' },
  ],
};

/** The exam prompts for a level (empty array if none). */
export function examForLevel(level) {
  return (EXAMS[level] ?? []).slice();
}

/** Find an exam item by id across all levels, or null. */
export function getExamItem(id) {
  for (const level of Object.keys(EXAMS)) {
    const found = EXAMS[level].find((it) => it.id === id);
    if (found) return found;
  }
  return null;
}

/**
 * Parse the model's one-line grade into { correct, note }. The grading prompt asks it to start with
 * CORRECT or INCORRECT; anything not clearly "correct" counts as incorrect (fail closed).
 */
export function parseVerdict(text) {
  const t = String(text ?? '').trim();
  const correct = /^\s*correct\b/i.test(t);
  const note = t
    .replace(/^\s*(in)?correct\b/i, '')
    .replace(/^[\s—:.\-]+/, '')
    .trim();
  return { correct, note };
}
