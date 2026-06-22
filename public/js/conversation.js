// Pure conversation/session logic — no DOM, so it is unit-testable in Node.
// The real Claude reply is wired in #4; for now stubReply() echoes the user.

/** Start a session for a profile with an empty message list. */
export function createSession(profile) {
  return { profile, messages: [] };
}

/** Append a { role, content } message. Returns a new array (no mutation). */
export function appendTurn(messages, role, content) {
  return [...messages, { role, content }];
}

/** Placeholder assistant reply until the AI tutor is connected (#4). */
export function stubReply(userText) {
  const trimmed = String(userText).trim();
  return `You said: “${trimmed}”. (Echo placeholder — the AI tutor is connected in task #4.)`;
}
