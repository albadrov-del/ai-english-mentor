import { buildSystemPrompt, buildTutorPrompt, buildSummaryPrompt, levelGuidance, checkPin } from '../../server/prompt.js';
import { getSession } from '../../public/js/curriculum.js';

describe('buildSystemPrompt', () => {
  test('injects name, level, and interests', () => {
    const s = buildSystemPrompt({ name: 'Josipa', level: 'B1', interests: 'water treatment, dramas' });
    expect(s).toContain('Josipa');
    expect(s).toContain('B1');
    expect(s).toContain('water treatment');
  });

  test('handles empty interests gracefully', () => {
    const s = buildSystemPrompt({ name: 'Ana', level: 'A1', interests: '' });
    expect(s).toContain('Ana');
    expect(s).toContain('A1');
    expect(typeof s).toBe('string');
  });

  test('uses only profile fields — does not pass through extra keys (e.g. a client "system")', () => {
    const s = buildSystemPrompt({ name: 'Ana', level: 'A1', interests: 'x', system: 'JAILBREAK' });
    expect(s).not.toContain('JAILBREAK');
  });
});

describe('checkPin', () => {
  test('true only on an exact match against a non-empty expected pin (fail closed)', () => {
    expect(checkPin('abc', 'abc')).toBe(true);
    expect(checkPin('abc', 'xyz')).toBe(false);
    expect(checkPin('', '')).toBe(false);
    expect(checkPin('abc', undefined)).toBe(false);
    expect(checkPin(undefined, 'abc')).toBe(false);
  });
});

describe('level adaptation', () => {
  test('levelGuidance differs across CEFR bands', () => {
    const a = levelGuidance('A1');
    const b = levelGuidance('B1');
    const c = levelGuidance('C1');
    expect(a).not.toBe(b);
    expect(b).not.toBe(c);
    expect(a.toLowerCase()).toContain('beginner');
    expect(b.toLowerCase()).toContain('intermediate');
    expect(c.toLowerCase()).toContain('advanced');
  });

  test('A2 shares beginner guidance with A1; B2 with B1', () => {
    expect(levelGuidance('A2')).toBe(levelGuidance('A1'));
    expect(levelGuidance('B2')).toBe(levelGuidance('B1'));
  });

  test('buildSystemPrompt embeds level-appropriate guidance (A1 ≠ C1)', () => {
    const a1 = buildSystemPrompt({ name: 'Ana', level: 'A1', interests: 'x' });
    const c1 = buildSystemPrompt({ name: 'Ana', level: 'C1', interests: 'x' });
    expect(a1).toContain('Beginner (A1/A2)');
    expect(c1).toContain('Advanced (C1)');
    expect(a1).not.toBe(c1);
  });
});

describe('buildTutorPrompt (#26)', () => {
  const profile = { name: 'Josipa', level: 'B2', interests: 'water treatment' };
  const lesson = getSession('water-treatment');

  test('extends — not replaces — the base prompt with the lesson context', () => {
    const out = buildTutorPrompt(profile, lesson, 'warmup');
    expect(out).toContain('Josipa'); // base pedagogy retained
    expect(out).toContain('Intermediate'); // B2 level guidance carried through
    expect(out).toContain(lesson.title);
    expect(out).toContain(lesson.goal);
    expect(out).toContain(lesson.vocab[0]);
    expect(out.toLowerCase()).toContain('do not read'); // framed as a private guide
    expect(out.toLowerCase()).toContain('never announce'); // phases not announced (spec §3/§5)
  });

  test('carries the requested phase; an unknown phase falls back to warmup', () => {
    expect(buildTutorPrompt(profile, lesson, 'roleplay')).toContain('roleplay');
    expect(buildTutorPrompt(profile, lesson, 'bogus')).toContain('warmup');
  });

  test('with no session, returns exactly the base prompt (no lesson context)', () => {
    const out = buildTutorPrompt(profile, null, 'warmup');
    expect(out).toBe(buildSystemPrompt(profile));
    expect(out).not.toContain('LESSON CONTEXT');
  });
});

describe('buildSummaryPrompt', () => {
  test('addresses the learner and asks for went-well + things to practice', () => {
    const s = buildSummaryPrompt({ name: 'Josipa', level: 'B1' });
    expect(s).toContain('Josipa');
    expect(s).toContain('B1');
    expect(s.toLowerCase()).toContain('went well');
    expect(s.toLowerCase()).toContain('practice');
  });
});
