import {
  GRAMMAR_LESSONS,
  LESSON_PHASES,
  lessonsForLevel,
  getLesson,
  lessonOpener,
} from '../../public/js/course.js';

describe('grammar course data (#8)', () => {
  test('seeds A1 through C1 with ordered, contiguous lessons', () => {
    for (const lvl of ['A1', 'A2', 'B1', 'B2', 'C1']) {
      const ls = lessonsForLevel(lvl);
      expect(ls.length).toBeGreaterThan(0);
      ls.forEach((l, i) => expect(l.order).toBe(i + 1));
    }
  });

  test('every lesson has the required shape', () => {
    for (const lvl of Object.keys(GRAMMAR_LESSONS)) {
      for (const l of GRAMMAR_LESSONS[lvl]) {
        expect(typeof l.id).toBe('string');
        expect(l.level).toBe(lvl);
        expect(typeof l.order).toBe('number');
        expect(typeof l.grammarFocus).toBe('string');
        expect(typeof l.goal).toBe('string');
        expect(typeof l.contextTopic).toBe('string');
      }
    }
  });

  test('lesson ids are globally unique', () => {
    const ids = Object.values(GRAMMAR_LESSONS).flat().map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('LESSON_PHASES are warmup → teaching → practice → recap', () => {
    expect(LESSON_PHASES).toEqual(['warmup', 'teaching', 'practice', 'recap']);
  });
});

describe('course helpers', () => {
  test('lessonsForLevel returns [] for an unseeded / unknown level', () => {
    expect(lessonsForLevel('C1').length).toBeGreaterThan(0); // C1 is now seeded
    expect(lessonsForLevel('ZZ')).toEqual([]);
  });

  test('getLesson finds by id across levels, else null', () => {
    const first = lessonsForLevel('A1')[0];
    expect(getLesson(first.id)).toBe(first);
    expect(getLesson('nope')).toBeNull();
  });

  test('lessonOpener states the goal and names the grammar focus + context topic', () => {
    const l = getLesson('a2-1'); // past simple → "your last family trip"
    const opener = lessonOpener(l);
    expect(opener).toContain("Today we'll practice");
    expect(opener).toContain(l.grammarFocus);
    expect(opener).toContain(l.contextTopic);
    expect(lessonOpener(null)).toBe('');
  });
});
