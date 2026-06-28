// Curriculum data + pure helpers (Sprint 2 / #26). No DOM and no other imports, so this is
// shared by BOTH the browser (lesson picker, phase pacing) and the backend (server/prompt.js
// builds the tutor system prompt from it). The frontend sends only a sessionId + phase; the
// backend looks the session up here, so lesson text is never passed through from the client.
//
// Pedagogy (spec §3/§5): phases are an INTERNAL guide for the tutor — a natural conversation,
// not a test. The tutor never announces phases. Add new sessions by appending to CURRICULUM.

/** Phase order the tutor moves through during a lesson. */
export const PHASES = ['warmup', 'vocabulary', 'guided_questions', 'roleplay', 'recap'];

/** Roughly how many user↔tutor exchanges to spend per phase before drifting to the next. */
export const TURNS_PER_PHASE = 2;

export const CURRICULUM = [
  {
    id: 'travel',
    title: 'Traveling with the family',
    level: 'A2–B1',
    type: 'light',
    goal: 'Introduce yourself and use present and past simple to describe plans and past trips.',
    vocab: ['trip', 'journey', 'flight', 'book a hotel', 'luggage', 'sightseeing', 'departure', 'delay', 'itinerary'],
    phrases: ['How was your trip?', 'We are planning to…', 'Last summer we went to…', "I'd love to visit…"],
    phases: {
      warmup: 'How was your last trip? Where did you go?',
      vocabulary:
        'Weave in travel words as the chat flows (trip, flight, luggage, sightseeing, delay, itinerary) — don’t drill them.',
      guided_questions: [
        'Where would you like to travel with Alan and the kids?',
        'Have you traveled with David, Dunja and Jelena?',
        'What was your best trip, and why?',
        'What was hard about traveling with children?',
      ],
      roleplay:
        'Slip into a short role-play: booking a hotel room or asking for directions at the airport. You play the receptionist / airport helper.',
      recap: 'Wrap up with 3 phrases worth reusing and gentle feedback on past-tense forms.',
    },
  },
  {
    id: 'water-treatment',
    title: 'Chemicals & equipment at water treatment facilities',
    level: 'B2',
    type: 'challenging',
    goal: 'Use technical vocabulary to explain a process and describe the function and purpose of equipment.',
    vocab: [
      'coagulant',
      'flocculation',
      'sedimentation',
      'chlorination',
      'dosing pump',
      'filtration',
      'pH adjustment',
      'sludge',
      'effluent',
      'disinfection byproducts',
    ],
    phrases: ['first… then… once…', 'as a result', 'the water is treated with…', 'the purpose of this is to…'],
    phases: {
      warmup: 'Describe your job to someone who knows nothing about water treatment.',
      vocabulary:
        'Encourage precise terms as they explain (coagulant, flocculation, sedimentation, chlorination, dosing pump, sludge, effluent).',
      guided_questions: [
        'Which chemicals do you use most, and why?',
        'How do you control the dosing?',
        'Which equipment needs the most maintenance?',
      ],
      roleplay:
        'Role-play explaining the treatment process to an English-speaking auditor or supplier. You play the auditor asking clarifying questions.',
      recap: 'Give feedback on process connectors (first, then, once, as a result) and the passive ("the water is treated…").',
    },
  },
  {
    id: 'pool',
    title: 'Pool water purification',
    level: 'B1',
    type: 'light',
    goal: 'Compare methods, give simple explanations, and use modals to make recommendations.',
    vocab: ['chlorine', 'salt chlorination', 'pH balance', 'algae', 'filter', 'backwash', 'test strip', 'safe levels'],
    phrases: ['you should…', "you shouldn't…", 'you need to…', 'I would recommend…'],
    phases: {
      warmup: 'Do you enjoy swimming? Tell me about a pool you know.',
      vocabulary: 'Weave in pool-care words (chlorine, salt chlorination, pH balance, algae, filter, backwash, test strip).',
      guided_questions: [
        'How is pool treatment different from industrial water treatment?',
        'What would you recommend for a home pool?',
      ],
      roleplay: 'Role-play advising a friend on keeping their pool water clean and safe. You play the friend asking for help.',
      recap: 'Feedback on should / shouldn’t, need to, and recommend + -ing.',
    },
  },
  {
    id: 'meat-cleaning',
    title: 'Cleaning & disinfection of meat-industry equipment',
    level: 'B2',
    type: 'challenging',
    goal: 'Describe procedures and sequence with a focus on hygiene and safety.',
    vocab: [
      'CIP (clean-in-place)',
      'sanitization',
      'residue',
      'contamination',
      'hygiene standard',
      'HACCP',
      'rinse cycle',
      'detergent',
      'food-grade',
    ],
    phrases: ['first, …', 'next, …', 'after that, …', 'finally, …', 'make sure to…'],
    phases: {
      warmup: 'Walk me through what cleaning looks like at the end of a shift.',
      vocabulary: 'Encourage procedure vocabulary (CIP, sanitization, residue, contamination, HACCP, rinse cycle, detergent, food-grade).',
      guided_questions: [
        'Walk me through cleaning a line after a prosciutto or kulen shift.',
        'Why is each step important?',
      ],
      roleplay: 'Role-play training a new colleague on the disinfection protocol. You play the new colleague asking questions.',
      recap: 'Feedback on imperatives and sequencing language; praise clarity.',
    },
  },
  {
    id: 'wastewater',
    title: 'Wastewater from the meat industry',
    level: 'B2–C1',
    type: 'challenging',
    goal: 'Explain problems and solutions, use cause and effect, and persuade.',
    vocab: [
      'organic load',
      'BOD/COD',
      'fats and grease',
      'screening',
      'biological treatment',
      'discharge limits',
      'compliance',
      'regulation',
    ],
    phrases: ['because…', 'therefore…', 'as a result…', 'this would allow us to…'],
    phases: {
      warmup: 'What makes meat-industry wastewater harder to treat than ordinary wastewater?',
      vocabulary: 'Weave in (organic load, BOD/COD, fats and grease, screening, biological treatment, discharge limits, compliance).',
      guided_questions: ['How do you meet discharge limits?', 'What would you improve at your site, and why?'],
      roleplay: 'Role-play presenting a proposed improvement to management — be persuasive. You play a skeptical manager.',
      recap: 'Feedback on cause/effect and persuasion language (because, therefore, this would allow us to…).',
    },
  },
  {
    id: 'dramas',
    title: 'Free conversation: Turkish & Korean dramas',
    level: 'B1',
    type: 'light',
    goal: 'Give opinions, retell a plot, and express preferences — relaxed fluency.',
    vocab: ['plot', 'character', 'episode', 'season', 'subtitle', 'cliffhanger', 'recommend'],
    phrases: ["it's about…", 'my favorite character is…', "I'd recommend it because…"],
    phases: {
      warmup: 'What are you watching right now? Tell me about it.',
      vocabulary: 'Weave in (plot, character, episode, season, subtitle, cliffhanger, recommend).',
      guided_questions: ['Tell me the story of one you like.', 'Why do you like it?'],
      roleplay: "Role-play recommending a series to a friend who hasn't seen it. You play the curious friend.",
      recap: 'Feedback on opinion phrases; plenty of positive reinforcement for confidence.',
    },
  },
];

/** Find a lesson by id, or null. */
export function getSession(id) {
  return CURRICULUM.find((s) => s.id === id) ?? null;
}

/** The phase a lesson starts in. */
export function firstPhase() {
  return PHASES[0];
}

/** Map a running exchange count to a phase, capped at the final (recap) phase. */
export function phaseForExchange(exchanges, turnsPerPhase = TURNS_PER_PHASE) {
  const n = Number.isFinite(exchanges) ? Math.max(0, Math.floor(exchanges)) : 0;
  const idx = Math.min(Math.floor(n / turnsPerPhase), PHASES.length - 1);
  return PHASES[idx];
}
