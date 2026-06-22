import { createSession, appendTurn, stubReply } from '../../public/js/conversation.js';

describe('conversation logic', () => {
  test('createSession holds the profile and an empty message list', () => {
    const s = createSession({ id: '1', name: 'Ana', level: 'B1' });
    expect(s.profile.name).toBe('Ana');
    expect(s.messages).toEqual([]);
  });

  test('appendTurn adds a { role, content } message without mutating the input', () => {
    const m0 = [];
    const m1 = appendTurn(m0, 'user', 'Hello');
    expect(m1).toEqual([{ role: 'user', content: 'Hello' }]);
    expect(m0).toEqual([]); // original untouched

    const m2 = appendTurn(m1, 'assistant', 'Hi there');
    expect(m2).toHaveLength(2);
    expect(m2[1]).toEqual({ role: 'assistant', content: 'Hi there' });
  });

  test('stubReply echoes the user text', () => {
    const r = stubReply('  good morning ');
    expect(typeof r).toBe('string');
    expect(r).toContain('good morning');
  });
});
