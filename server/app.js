// Express app factory. The Anthropic client is injected so tests can mock it at
// the boundary (no real API calls, no network in CI).
import express from 'express';
import { fileURLToPath } from 'node:url';
import { buildSystemPrompt, checkPin, MODEL } from './prompt.js';

const PUBLIC_DIR = fileURLToPath(new URL('../public/', import.meta.url));
const MAX_TOKENS = 320; // short spoken turns (spec §3); non-streaming

/**
 * @param {object}   opts
 * @param {object}   opts.anthropic  client exposing messages.create(params)
 * @param {string}   [opts.pin]      expected x-app-pin value (default process.env.APP_PIN)
 * @param {string}   [opts.model]    model id
 */
export function createApp({ anthropic, pin = process.env.APP_PIN, model = MODEL } = {}) {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/chat', async (req, res) => {
    if (!checkPin(req.get('x-app-pin'), pin)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { profile, messages } = req.body ?? {};
    if (!profile || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Expected { profile, messages }.' });
    }

    // The system prompt is built server-side. Any client-supplied `system` (top
    // level or as a message) is ignored — only role/content user/assistant turns pass through.
    const system = buildSystemPrompt(profile);
    const safeMessages = messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
      .map((m) => ({ role: m.role, content: String(m.content ?? '') }));

    try {
      const response = await anthropic.messages.create({
        model,
        max_tokens: MAX_TOKENS,
        system,
        messages: safeMessages,
      });
      const reply = (response.content ?? [])
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('')
        .trim();
      res.json({ reply });
    } catch {
      res.status(502).json({ error: 'Upstream error contacting the AI service.' });
    }
  });

  app.use(express.static(PUBLIC_DIR));
  return app;
}
