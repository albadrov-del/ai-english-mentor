// Frontend client for the proxy.
// buildChatBody is pure (unit-tested); the fetch helpers are covered by E2E with a mocked route.
import { log } from './log.js';

/**
 * Assemble the request body. The frontend sends ONLY the profile + user/assistant
 * turns — never a system prompt (the backend builds that). Stray roles are stripped.
 */
export function buildChatBody(profile, messages) {
  return {
    profile: {
      name: profile?.name ?? '',
      level: profile?.level ?? '',
      interests: profile?.interests ?? '',
    },
    messages: (messages ?? [])
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
      .map((m) => ({ role: m.role, content: String(m.content ?? '') })),
  };
}

// Shared POST helper with logging. The logger redacts the PIN header automatically.
async function postJson(path, payload, pin) {
  log.debug('POST', path, { headers: { 'x-app-pin': pin ?? '' }, messages: payload.messages?.length ?? 0 });
  let res;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-app-pin': pin ?? '' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    log.error('POST', path, 'network error', String(e && e.message ? e.message : e));
    const err = new Error('Network error');
    err.status = 0;
    throw err;
  }
  log.debug('POST', path, '->', res.status);
  if (!res.ok) {
    log.error('POST', path, 'failed', res.status);
    const err = new Error(`Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json().catch(() => ({}));
}

/** POST /api/chat; resolve to the reply text, or throw with .status. */
export async function sendChat({ profile, messages, pin }) {
  const data = await postJson('/api/chat', buildChatBody(profile, messages), pin);
  return data.reply ?? '';
}

/** POST /api/summary; resolve to the summary text, or throw with .status. */
export async function sendSummary({ profile, messages, pin }) {
  const data = await postJson('/api/summary', buildChatBody(profile, messages), pin);
  return data.summary ?? '';
}
