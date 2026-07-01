import {
  getLevelProgress,
  isComplete,
  completedCount,
  levelPercent,
  markComplete,
  resetLevel,
  clearProfile,
  setExam,
  getExam,
} from '../../public/js/progress.js';

describe('progress — completion', () => {
  test('markComplete adds a lesson once (no duplicates) and is immutable', () => {
    const p0 = {};
    const p1 = markComplete(p0, 'pX', 'A1', 'a1-1');
    expect(isComplete(p1, 'pX', 'A1', 'a1-1')).toBe(true);
    expect(p0).toEqual({}); // original untouched
    const p2 = markComplete(p1, 'pX', 'A1', 'a1-1'); // again
    expect(completedCount(p2, 'pX', 'A1')).toBe(1);
  });

  test('getLevelProgress is a safe accessor', () => {
    expect(getLevelProgress({}, 'nobody', 'A1')).toEqual({ completed: [], exam: {} });
  });

  test('levelPercent rounds and guards total ≤ 0', () => {
    let p = markComplete({}, 'pX', 'A1', 'a1-1');
    expect(levelPercent(p, 'pX', 'A1', 6)).toBe(17); // 1/6 → 17%
    p = markComplete(p, 'pX', 'A1', 'a1-2');
    p = markComplete(p, 'pX', 'A1', 'a1-3');
    expect(levelPercent(p, 'pX', 'A1', 6)).toBe(50); // 3/6
    expect(levelPercent(p, 'pX', 'A1', 0)).toBe(0);
  });
});

describe('progress — per-level isolation + reset/clear', () => {
  test('levels are independent', () => {
    let p = markComplete({}, 'pX', 'A1', 'a1-1');
    p = markComplete(p, 'pX', 'A2', 'a2-1');
    expect(completedCount(p, 'pX', 'A1')).toBe(1);
    expect(completedCount(p, 'pX', 'A2')).toBe(1);
    expect(isComplete(p, 'pX', 'A2', 'a1-1')).toBe(false);
  });

  test('resetLevel clears only that level (keeps other levels + exam)', () => {
    let p = markComplete({}, 'pX', 'A1', 'a1-1');
    p = markComplete(p, 'pX', 'A2', 'a2-1');
    p = setExam(p, 'pX', 'A1', 'initial', { score: 2, total: 6 });
    p = resetLevel(p, 'pX', 'A1');
    expect(completedCount(p, 'pX', 'A1')).toBe(0);
    expect(completedCount(p, 'pX', 'A2')).toBe(1); // untouched
    expect(getExam(p, 'pX', 'A1').initial).toEqual({ score: 2, total: 6 }); // exam kept
  });

  test('clearProfile removes one profile, keeps others', () => {
    let p = markComplete({}, 'pX', 'A1', 'a1-1');
    p = markComplete(p, 'pY', 'B1', 'b1-1');
    p = clearProfile(p, 'pX');
    expect(completedCount(p, 'pX', 'A1')).toBe(0);
    expect(completedCount(p, 'pY', 'B1')).toBe(1);
  });
});

describe('progress — exam results', () => {
  test('setExam stores initial and final separately', () => {
    let p = setExam({}, 'pX', 'B1', 'initial', { score: 4, total: 6 });
    p = setExam(p, 'pX', 'B1', 'final', { score: 6, total: 6 });
    expect(getExam(p, 'pX', 'B1')).toEqual({ initial: { score: 4, total: 6 }, final: { score: 6, total: 6 } });
  });
});
