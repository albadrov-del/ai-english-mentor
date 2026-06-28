// Pure conversation-history logic — no DOM, no localStorage, so it is unit-testable.
// Persistence lives in storage.js; the UI wiring lives in app.js. Saved conversations are
// per-profile and carry a `version` so the shape can evolve (spec §6 local-only, §8 no cloud sync).

/** Bump when the saved shape changes; migrateConversation() upgrades older records. */
export const HISTORY_VERSION = 1;

// On resume, conversations longer than this are compacted: the older part is summarized
// (via the proxy, in app.js) and only the most recent turns are kept verbatim.
export const RESUME_SUMMARIZE_OVER = 16;
export const RESUME_KEEP_RECENT = 8;

function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `c_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/** A short, human title from the first user message (else a generic label). */
export function deriveTitle(messages) {
  const firstUser = (Array.isArray(messages) ? messages : []).find((m) => m?.role === 'user');
  const text = String(firstUser?.content ?? '').trim();
  if (!text) return 'New conversation';
  return text.length > 40 ? `${text.slice(0, 40)}…` : text;
}

/** Build a fresh conversation record for a profile. */
export function createConversation(profile, messages = []) {
  const now = Date.now();
  const msgs = Array.isArray(messages) ? messages : [];
  return {
    version: HISTORY_VERSION,
    id: newId(),
    profileId: profile?.id ?? null,
    title: deriveTitle(msgs),
    level: profile?.level ?? '',
    messages: msgs,
    createdAt: now,
    updatedAt: now,
  };
}

/** Return a copy of `convo` with new messages, refreshed title (if still generic) and updatedAt. */
export function updateConversation(convo, messages) {
  const msgs = Array.isArray(messages) ? messages : convo?.messages ?? [];
  const keepTitle = convo?.title && convo.title !== 'New conversation';
  return {
    ...convo,
    messages: msgs,
    title: keepTitle ? convo.title : deriveTitle(msgs),
    updatedAt: Date.now(),
  };
}

/** Insert (most-recent-first) or replace by id. Returns a new array. */
export function upsertConversation(list, convo) {
  const arr = Array.isArray(list) ? list : [];
  const i = arr.findIndex((c) => c.id === convo.id);
  if (i === -1) return [convo, ...arr];
  const copy = arr.slice();
  copy[i] = convo;
  return copy;
}

/** Remove a conversation by id. Returns a new array. */
export function deleteConversation(list, id) {
  return (Array.isArray(list) ? list : []).filter((c) => c.id !== id);
}

/** Find a conversation by id, or null. */
export function findConversation(list, id) {
  return (Array.isArray(list) ? list : []).find((c) => c.id === id) ?? null;
}

/** A profile's conversations, newest first. */
export function listByProfile(list, profileId) {
  return (Array.isArray(list) ? list : [])
    .filter((c) => c.profileId === profileId)
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

/** Forward-compat: backfill any missing fields on a record loaded from storage. */
export function migrateConversation(convo) {
  const msgs = Array.isArray(convo?.messages) ? convo.messages : [];
  const created = convo?.createdAt ?? Date.now();
  return {
    version: HISTORY_VERSION,
    id: convo?.id ?? newId(),
    profileId: convo?.profileId ?? null,
    title: convo?.title ?? deriveTitle(msgs),
    level: convo?.level ?? '',
    messages: msgs,
    createdAt: created,
    updatedAt: convo?.updatedAt ?? created,
  };
}

/**
 * Decide how to resume a saved conversation. Short ones resume verbatim; long ones are
 * split so the older part can be summarized and only the recent turns kept.
 * @returns {{ needsSummary: boolean, older: object[], recent: object[] }}
 */
export function selectResumeContext(
  messages,
  { keepRecent = RESUME_KEEP_RECENT, summarizeOver = RESUME_SUMMARIZE_OVER } = {},
) {
  const msgs = Array.isArray(messages) ? messages : [];
  if (msgs.length <= summarizeOver) return { needsSummary: false, older: [], recent: msgs };
  return {
    needsSummary: true,
    older: msgs.slice(0, msgs.length - keepRecent),
    recent: msgs.slice(-keepRecent),
  };
}

/** Assemble the working context to resume with: an optional recap turn + the recent turns. */
export function buildResumeMessages(recent, recap = '') {
  const tail = Array.isArray(recent) ? recent : [];
  const text = String(recap ?? '').trim();
  if (text) {
    return [{ role: 'assistant', content: `Welcome back! Here's where we left off: ${text}` }, ...tail];
  }
  return [...tail];
}
