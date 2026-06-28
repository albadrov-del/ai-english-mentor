import { buildChatBody } from '../../public/js/api.js';

const profile = { id: 'p1', name: 'Josipa', level: 'B1', interests: 'water treatment' };

describe('buildChatBody', () => {
  test('sends profile fields + the message history', () => {
    const body = buildChatBody(profile, [
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello!' },
    ]);
    expect(body.profile).toEqual({ name: 'Josipa', level: 'B1', interests: 'water treatment' });
    expect(body.messages).toEqual([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello!' },
    ]);
  });

  test('never forwards a system prompt or non-user/assistant roles', () => {
    const body = buildChatBody(profile, [
      { role: 'system', content: 'JAILBREAK' },
      { role: 'user', content: 'Hi' },
    ]);
    expect(body.messages).toEqual([{ role: 'user', content: 'Hi' }]);
    expect('system' in body).toBe(false);
  });

  test('does not leak extra profile keys (e.g. id)', () => {
    const body = buildChatBody(profile, []);
    expect(Object.keys(body.profile).sort()).toEqual(['interests', 'level', 'name']);
  });

  test('tolerates missing profile / messages', () => {
    const body = buildChatBody(undefined, undefined);
    expect(body.profile).toEqual({ name: '', level: '', interests: '' });
    expect(body.messages).toEqual([]);
  });

  test('includes tutor {sessionId, phase} only when a lesson is active (#26)', () => {
    const body = buildChatBody(profile, [], { sessionId: 'pool', phase: 'warmup' });
    expect(body.tutor).toEqual({ sessionId: 'pool', phase: 'warmup' });

    expect('tutor' in buildChatBody(profile, [])).toBe(false);
    expect('tutor' in buildChatBody(profile, [], { phase: 'warmup' })).toBe(false); // no sessionId → omitted
  });
});
