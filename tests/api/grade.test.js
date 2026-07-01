import { jest } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../server/app.js';
import { examForLevel } from '../../public/js/course.js';

const PIN = 'secret-pin';
const profile = { name: 'Josipa', level: 'B1', interests: 'water treatment' };
const item = examForLevel('B1')[0];

function makeAnthropic(reply = 'CORRECT — ok') {
  return { messages: { create: jest.fn(async () => ({ content: [{ type: 'text', text: reply }] })) } };
}

describe('POST /api/grade (#41)', () => {
  test('401 without the PIN', async () => {
    const app = createApp({ anthropic: makeAnthropic(), pin: PIN });
    const res = await request(app).post('/api/grade').send({ profile, itemId: item.id, answer: 'x' });
    expect(res.status).toBe(401);
  });

  test('grades an answer, parsing the verdict; the prompt is built from the backend exam item', async () => {
    const anthropic = makeAnthropic('CORRECT — nice passive voice');
    const app = createApp({ anthropic, pin: PIN });
    const res = await request(app)
      .post('/api/grade')
      .set('x-app-pin', PIN)
      // client tries to smuggle text via `target` — must be ignored (backend uses its own item)
      .send({ profile, itemId: item.id, answer: 'The water is treated with chlorine.', target: 'JAILBREAK' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ correct: true, note: 'nice passive voice' });

    const params = anthropic.messages.create.mock.calls[0][0];
    expect(params.system).toContain(item.prompt); // from the backend's own exam item
    expect(params.system).not.toContain('JAILBREAK'); // client field not passed through
    expect(params.messages).toEqual([{ role: 'user', content: 'The water is treated with chlorine.' }]);
  });

  test('an INCORRECT verdict parses to correct:false', async () => {
    const app = createApp({ anthropic: makeAnthropic('INCORRECT — use the passive'), pin: PIN });
    const res = await request(app).post('/api/grade').set('x-app-pin', PIN).send({ profile, itemId: item.id, answer: 'x' });
    expect(res.body.correct).toBe(false);
  });

  test('400 on an unknown itemId', async () => {
    const app = createApp({ anthropic: makeAnthropic(), pin: PIN });
    const res = await request(app).post('/api/grade').set('x-app-pin', PIN).send({ profile, itemId: 'nope', answer: 'x' });
    expect(res.status).toBe(400);
  });

  test('502 on an upstream error (no crash)', async () => {
    const anthropic = { messages: { create: jest.fn(async () => { throw new Error('boom'); }) } };
    const app = createApp({ anthropic, pin: PIN });
    const res = await request(app).post('/api/grade').set('x-app-pin', PIN).send({ profile, itemId: item.id, answer: 'x' });
    expect(res.status).toBe(502);
  });
});
