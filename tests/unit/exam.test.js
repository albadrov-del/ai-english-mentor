import { EXAMS, examForLevel, getExamItem, parseVerdict } from '../../public/js/course.js';
import { buildExamGradePrompt } from '../../server/prompt.js';

describe('exam data (#41)', () => {
  test('seeds A1, A2 and B1 with well-shaped prompts', () => {
    for (const lvl of ['A1', 'A2', 'B1']) {
      const items = examForLevel(lvl);
      expect(items.length).toBeGreaterThan(0);
      for (const it of items) {
        expect(typeof it.id).toBe('string');
        expect(typeof it.grammarFocus).toBe('string');
        expect(typeof it.prompt).toBe('string');
        expect(typeof it.target).toBe('string');
      }
    }
  });

  test('examForLevel is empty for an unseeded level', () => {
    expect(examForLevel('C1')).toEqual([]);
  });

  test('exam item ids are globally unique', () => {
    const ids = Object.values(EXAMS).flat().map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('getExamItem finds by id, else null', () => {
    const first = examForLevel('A1')[0];
    expect(getExamItem(first.id)).toBe(first);
    expect(getExamItem('nope')).toBeNull();
  });
});

describe('parseVerdict (#41)', () => {
  test('reads a leading CORRECT / INCORRECT and the note', () => {
    expect(parseVerdict('CORRECT — nice past tense')).toEqual({ correct: true, note: 'nice past tense' });
    expect(parseVerdict('INCORRECT — try "was" here')).toEqual({ correct: false, note: 'try "was" here' });
  });

  test('is case-insensitive and tolerant of separators', () => {
    expect(parseVerdict('correct: good job').correct).toBe(true);
    expect(parseVerdict('  Incorrect - almost').correct).toBe(false);
  });

  test('fails closed on anything not clearly correct', () => {
    expect(parseVerdict('hmm not sure').correct).toBe(false);
    expect(parseVerdict('').correct).toBe(false);
  });
});

describe('buildExamGradePrompt (#41)', () => {
  const profile = { name: 'Josipa', level: 'B1' };
  const item = examForLevel('B1')[0];

  test('embeds the question + target and asks for a CORRECT/INCORRECT verdict', () => {
    const out = buildExamGradePrompt(profile, item);
    expect(out).toContain('Josipa');
    expect(out).toContain(item.prompt);
    expect(out).toContain('CORRECT');
    expect(out).toContain('INCORRECT');
  });
});
