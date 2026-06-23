// Frontend client for the chat proxy.
// buildChatBody is pure (unit-tested); sendChat does the fetch (covered by E2E with a mocked route).

/**
 * Assemble the request body. The frontend sends ONLY the profile + user/assistant
 * turns — never a system prompt (the backend builds that). Any stray system/other
 * roles are stripped here too.
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

/** POST to /api/chat with the PIN header; resolve to the reply text, or throw with .status. */
export async function sendChat({ profile, messages, pin }) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-app-pin': pin ?? '' },
    body: JSON.stringify(buildChatBody(profile, messages)),
  });
  if (!res.ok) {
    const err = new Error(`Chat request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  return data.reply ?? '';
}

/** POST to /api/summary with the PIN header; resolve to the summary text, or throw with .status. */
export async function sendSummary({ profile, messages, pin }) {
  const res = await fetch('/api/summary', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-app-pin': pin ?? '' },
    body: JSON.stringify(buildChatBody(profile, messages)),
  });
  if (!res.ok) {
    const err = new Error(`Summary request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  return data.summary ?? '';
}
