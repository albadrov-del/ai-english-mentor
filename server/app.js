// Express app factory. The Anthropic client is injected so tests can mock it at
// the boundary (no real API calls, no network in CI).
import express from 'express';
import { fileURLToPath } from 'node:url';
import { buildSystemPrompt, buildLessonPrompt, buildSummaryPrompt, buildExamGradePrompt, checkPin, MODEL } from './prompt.js';
import { getLesson, getExamItem, parseVerdict } from '../public/js/course.js';

const PUBLIC_DIR = fileURLToPath(new URL('../public/', import.meta.url));
const CHAT_MAX_TOKENS = 320; // short spoken turns (spec §3); non-streaming
const SUMMARY_MAX_TOKENS = 450; // a few sentences of end-of-session summary

// Keep only user/assistant turns — a client-supplied `system` (or any other role) is dropped.
function sanitizeMessages(messages) {
  return messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
    .map((m) => ({ role: m.role, content: String(m.content ?? '') }));
}

function extractText(response) {
  return (response.content ?? [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
}

/**
 * @param {object}   opts
 * @param {object}   opts.anthropic  client exposing messages.create(params)
 * @param {string}   [opts.pin]      expected x-app-pin value (default process.env.APP_PIN)
 * @param {string}   [opts.model]    model id
 */
export function createApp({ anthropic, pin = process.env.APP_PIN, model = MODEL } = {}) {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  function authed(req, res) {
    if (!checkPin(req.get('x-app-pin'), pin)) {
      res.status(401).json({ error: 'Unauthorized' });
      return false;
    }
    return true;
  }

  app.post('/api/chat', async (req, res) => {
    if (!authed(req, res)) return;
    const { profile, messages, lesson } = req.body ?? {};
    if (!profile || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Expected { profile, messages }.' });
    }
    // Grammar-lesson mode: the client sends only a lessonId; the lesson is resolved from the
    // backend's own course data, so no lesson/prompt text is passed through (spec §4/§5).
    const lessonDef = lesson?.lessonId ? getLesson(lesson.lessonId) : null;
    const system = lessonDef ? buildLessonPrompt(profile, lessonDef) : buildSystemPrompt(profile);
    try {
      const response = await anthropic.messages.create({
        model,
        max_tokens: CHAT_MAX_TOKENS,
        system, // built server-side; client cannot supply prompt text
        messages: sanitizeMessages(messages),
      });
      res.json({ reply: extractText(response) });
    } catch (err) {
      // Log the real cause (e.g. authentication vs credit) — never the key/headers (spec §4).
      console.error('[api/chat] upstream error:', err?.status ?? '', err?.name ?? '', err?.message ?? String(err));
      res.status(502).json({ error: 'Upstream error contacting the AI service.' });
    }
  });

  app.post('/api/summary', async (req, res) => {
    if (!authed(req, res)) return;
    const { profile, messages } = req.body ?? {};
    if (!profile || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Expected { profile, messages }.' });
    }
    const transcript = sanitizeMessages(messages);
    const elicit = {
      role: 'user',
      content: 'The practice session is over. Please give me my encouraging summary now.',
    };
    try {
      const response = await anthropic.messages.create({
        model,
        max_tokens: SUMMARY_MAX_TOKENS,
        system: buildSummaryPrompt(profile), // summary-specific, built server-side
        messages: [...transcript, elicit],
      });
      res.json({ summary: extractText(response) });
    } catch (err) {
      console.error('[api/summary] upstream error:', err?.status ?? '', err?.name ?? '', err?.message ?? String(err));
      res.status(502).json({ error: 'Upstream error contacting the AI service.' });
    }
  });

  app.post('/api/grade', async (req, res) => {
    if (!authed(req, res)) return;
    const { profile, itemId, answer } = req.body ?? {};
    const item = itemId ? getExamItem(itemId) : null;
    if (!profile || !item || typeof answer !== 'string') {
      return res.status(400).json({ error: 'Expected { profile, itemId, answer }.' });
    }
    try {
      const response = await anthropic.messages.create({
        model,
        max_tokens: 80,
        system: buildExamGradePrompt(profile, item), // built server-side from our own exam item
        messages: [{ role: 'user', content: answer }],
      });
      res.json(parseVerdict(extractText(response)));
    } catch (err) {
      console.error('[api/grade] upstream error:', err?.status ?? '', err?.name ?? '', err?.message ?? String(err));
      res.status(502).json({ error: 'Upstream error contacting the AI service.' });
    }
  });

  app.use(express.static(PUBLIC_DIR));
  return app;
}
