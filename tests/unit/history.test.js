import {
  HISTORY_VERSION,
  RESUME_SUMMARIZE_OVER,
  RESUME_KEEP_RECENT,
  deriveTitle,
  createConversation,
  updateConversation,
  upsertConversation,
  deleteConversation,
  findConversation,
  listByProfile,
  migrateConversation,
  selectResumeContext,
  buildResumeMessages,
} from '../../public/js/history.js';

const profile = { id: 'p1', level: 'B1', name: 'Josipa' };
const turns = (n) =>
  Array.from({ length: n }, (_, i) => ({ role: i % 2 === 0 ? 'user' : 'assistant', content: `m${i}` }));

describe('deriveTitle', () => {
  test('uses the first user message, truncated', () => {
    expect(deriveTitle([{ role: 'assistant', content: 'hi' }, { role: 'user', content: 'Tell me about pools' }])).toBe(
      'Tell me about pools',
    );
    const long = 'x'.repeat(60);
    expect(deriveTitle([{ role: 'user', content: long }])).toBe(`${'x'.repeat(40)}…`);
  });

  test('falls back to a generic label with no user message', () => {
    expect(deriveTitle([])).toBe('New conversation');
    expect(deriveTitle([{ role: 'assistant', content: 'hello' }])).toBe('New conversation');
  });
});

describe('createConversation', () => {
  test('builds a versioned record bound to the profile', () => {
    const c = createConversation(profile, [{ role: 'user', content: 'Hi there' }]);
    expect(c.version).toBe(HISTORY_VERSION);
    expect(c.profileId).toBe('p1');
    expect(c.level).toBe('B1');
    expect(c.title).toBe('Hi there');
    expect(typeof c.id).toBe('string');
    expect(c.createdAt).toBeLessThanOrEqual(c.updatedAt);
  });
});

describe('updateConversation', () => {
  test('replaces messages and bumps updatedAt; keeps a custom title', () => {
    const c = { ...createConversation(profile, [{ role: 'user', content: 'first' }]), updatedAt: 1 };
    const out = updateConversation(c, [...c.messages, { role: 'assistant', content: 'reply' }]);
    expect(out.messages).toHaveLength(2);
    expect(out.updatedAt).toBeGreaterThan(1);
    expect(out.title).toBe('first'); // derived earlier, preserved
  });

  test('fills a still-generic title once a user message exists', () => {
    const c = createConversation(profile, []); // title: "New conversation"
    const out = updateConversation(c, [{ role: 'user', content: 'Now we talk' }]);
    expect(out.title).toBe('Now we talk');
  });
});

describe('CRUD on the list', () => {
  test('upsert prepends new (newest first) and replaces by id', () => {
    const a = createConversation(profile, [{ role: 'user', content: 'a' }]);
    const b = createConversation(profile, [{ role: 'user', content: 'b' }]);
    let list = upsertConversation([], a);
    list = upsertConversation(list, b);
    expect(list.map((c) => c.id)).toEqual([b.id, a.id]);

    const a2 = { ...a, title: 'renamed' };
    list = upsertConversation(list, a2);
    expect(list).toHaveLength(2);
    expect(findConversation(list, a.id).title).toBe('renamed');
  });

  test('delete removes by id; find returns null when absent', () => {
    const a = createConversation(profile, []);
    const list = deleteConversation([a], a.id);
    expect(list).toHaveLength(0);
    expect(findConversation(list, a.id)).toBeNull();
  });

  test('listByProfile filters and sorts newest-first', () => {
    const a = { ...createConversation({ id: 'p1' }, []), id: 'a', updatedAt: 100 };
    const b = { ...createConversation({ id: 'p1' }, []), id: 'b', updatedAt: 300 };
    const other = { ...createConversation({ id: 'p2' }, []), id: 'c', updatedAt: 999 };
    const out = listByProfile([a, b, other], 'p1');
    expect(out.map((c) => c.id)).toEqual(['b', 'a']);
  });
});

describe('migrateConversation', () => {
  test('backfills missing fields on an old record', () => {
    const out = migrateConversation({ id: 'x', messages: [{ role: 'user', content: 'hey' }] });
    expect(out.version).toBe(HISTORY_VERSION);
    expect(out.profileId).toBeNull();
    expect(out.title).toBe('hey');
    expect(out.createdAt).toBeGreaterThan(0);
    expect(out.updatedAt).toBe(out.createdAt);
  });

  test('tolerates an empty/garbage object', () => {
    const out = migrateConversation({});
    expect(out.messages).toEqual([]);
    expect(out.title).toBe('New conversation');
  });
});

describe('selectResumeContext', () => {
  test('short conversations resume verbatim (no summary)', () => {
    const msgs = turns(RESUME_SUMMARIZE_OVER);
    const sel = selectResumeContext(msgs);
    expect(sel.needsSummary).toBe(false);
    expect(sel.recent).toEqual(msgs);
    expect(sel.older).toEqual([]);
  });

  test('long conversations split into older + recent for summarization', () => {
    const msgs = turns(RESUME_SUMMARIZE_OVER + 10);
    const sel = selectResumeContext(msgs);
    expect(sel.needsSummary).toBe(true);
    expect(sel.recent).toHaveLength(RESUME_KEEP_RECENT);
    expect(sel.older).toHaveLength(msgs.length - RESUME_KEEP_RECENT);
    expect([...sel.older, ...sel.recent]).toEqual(msgs);
  });
});

describe('buildResumeMessages', () => {
  test('prepends an assistant recap when a summary is provided', () => {
    const recent = [{ role: 'user', content: 'last' }];
    const out = buildResumeMessages(recent, 'we discussed pools');
    expect(out[0].role).toBe('assistant');
    expect(out[0].content).toContain('we discussed pools');
    expect(out.slice(1)).toEqual(recent);
  });

  test('returns just the recent turns when there is no recap', () => {
    const recent = [{ role: 'user', content: 'last' }];
    expect(buildResumeMessages(recent, '')).toEqual(recent);
    expect(buildResumeMessages(recent, '   ')).toEqual(recent);
  });
});
