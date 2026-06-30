import { buildSystemPrompt, buildLessonPrompt, buildSummaryPrompt, levelGuidance, checkPin } from '../../server/prompt.js';
import { getLesson } from '../../public/js/course.js';

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

describe('buildLessonPrompt (#8)', () => {
  const profile = { name: 'Josipa', level: 'B1', interests: 'water treatment' };
  const lesson = getLesson('b1-5'); // passive voice → "how water is treated"

  test('extends — not replaces — the base prompt with the lesson context', () => {
    const out = buildLessonPrompt(profile, lesson);
    expect(out).toContain('Josipa'); // base pedagogy retained
    expect(out).toContain('Intermediate'); // B1 level guidance carried through
    expect(out).toContain(lesson.grammarFocus);
    expect(out).toContain(lesson.goal);
    expect(out).toContain(lesson.contextTopic);
    expect(out).toContain('GRAMMAR LESSON');
  });

  test('with no lesson, returns exactly the base prompt', () => {
    const out = buildLessonPrompt(profile, null);
    expect(out).toBe(buildSystemPrompt(profile));
    expect(out).not.toContain('GRAMMAR LESSON');
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
