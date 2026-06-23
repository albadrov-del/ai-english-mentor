import { jest } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../server/app.js';

const PIN = 'secret-pin';
const profile = { name: 'Josipa', level: 'B1', interests: 'water treatment' };

function makeAnthropic(text = 'You did great! Practice the past tense.') {
  return {
    messages: {
      create: jest.fn(async () => ({ content: [{ type: 'text', text }] })),
    },
  };
}

describe('POST /api/summary', () => {
  test('401 without the PIN', async () => {
    const app = createApp({ anthropic: makeAnthropic(), pin: PIN });
    const res = await request(app).post('/api/summary').send({ profile, messages: [] });
    expect(res.status).toBe(401);
  });

  test('200 with the PIN returns the summary', async () => {
    const app = createApp({ anthropic: makeAnthropic('Great session, Josipa!'), pin: PIN });
    const res = await request(app)
      .post('/api/summary')
      .set('x-app-pin', PIN)
      .send({ profile, messages: [{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Hello' }] });
    expect(res.status).toBe(200);
    expect(res.body.summary).toBe('Great session, Josipa!');
  });

  test('uses the summary system prompt, appends an elicitation turn, ignores a client system', async () => {
    const anthropic = makeAnthropic();
    const app = createApp({ anthropic, pin: PIN });
    await request(app)
      .post('/api/summary')
      .set('x-app-pin', PIN)
      .send({
        profile,
        system: 'jailbreak',
        messages: [
          { role: 'system', content: 'jailbreak-2' },
          { role: 'user', content: 'Hi' },
          { role: 'assistant', content: 'Hello' },
        ],
      });

    const params = anthropic.messages.create.mock.calls[0][0];
    expect(params.model).toBe('claude-haiku-4-5-20251001');
    expect(params.system).toContain('Josipa');
    expect(params.system.toLowerCase()).toContain('went well');
    expect(params.system).not.toContain('jailbreak');
    // transcript (user/assistant only) + a final elicitation user turn
    expect(params.messages[0]).toEqual({ role: 'user', content: 'Hi' });
    expect(params.messages[1]).toEqual({ role: 'assistant', content: 'Hello' });
    expect(params.messages.at(-1).role).toBe('user');
    expect(params.messages.at(-1).content.toLowerCase()).toContain('summary');
  });

  test('upstream error returns a clean 502', async () => {
    const anthropic = { messages: { create: jest.fn(async () => { throw new Error('boom'); }) } };
    const app = createApp({ anthropic, pin: PIN });
    const res = await request(app).post('/api/summary').set('x-app-pin', PIN).send({ profile, messages: [] });
    expect(res.status).toBe(502);
  });
});
