import { buildSystemPrompt, checkPin } from '../../server/prompt.js';

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
