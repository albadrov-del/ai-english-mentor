import {
  CURRICULUM,
  PHASES,
  getSession,
  firstPhase,
  phaseForExchange,
} from '../../public/js/curriculum.js';

describe('curriculum data', () => {
  test('has the 6 seeded sessions with unique ids', () => {
    expect(CURRICULUM).toHaveLength(6);
    const ids = CURRICULUM.map((s) => s.id);
    expect(new Set(ids).size).toBe(6);
  });

  test('every session has the required shape (id, title, level, type, goal, vocab, phrases, phases)', () => {
    for (const s of CURRICULUM) {
      expect(typeof s.id).toBe('string');
      expect(typeof s.title).toBe('string');
      expect(typeof s.level).toBe('string');
      expect(['light', 'challenging']).toContain(s.type);
      expect(typeof s.goal).toBe('string');
      expect(Array.isArray(s.vocab)).toBe(true);
      expect(s.vocab.length).toBeGreaterThan(0);
      expect(Array.isArray(s.phrases)).toBe(true);
      for (const p of PHASES) expect(s.phases).toHaveProperty(p);
    }
  });

  test('mixes light and challenging lessons', () => {
    const types = new Set(CURRICULUM.map((s) => s.type));
    expect(types.has('light')).toBe(true);
    expect(types.has('challenging')).toBe(true);
  });
});

describe('curriculum helpers', () => {
  test('getSession finds by id, else null', () => {
    expect(getSession(CURRICULUM[0].id)).toBe(CURRICULUM[0]);
    expect(getSession('nope')).toBeNull();
  });

  test('firstPhase is the warmup', () => {
    expect(firstPhase()).toBe('warmup');
    expect(PHASES[0]).toBe('warmup');
  });

  test('phaseForExchange advances through phases and caps at recap', () => {
    expect(phaseForExchange(0)).toBe('warmup');
    expect(phaseForExchange(1)).toBe('warmup');
    expect(phaseForExchange(2)).toBe('vocabulary');
    expect(phaseForExchange(4)).toBe('guided_questions');
    expect(phaseForExchange(6)).toBe('roleplay');
    expect(phaseForExchange(8)).toBe('recap');
    expect(phaseForExchange(999)).toBe('recap');
  });

  test('phaseForExchange is defensive about bad input', () => {
    expect(phaseForExchange(-5)).toBe('warmup');
    expect(phaseForExchange(NaN)).toBe('warmup');
  });
});
