import { buildBackup, parseBackup, BACKUP_APP, BACKUP_VERSION } from '../../public/js/backup.js';

describe('buildBackup', () => {
  test('wraps profiles + history with app/version/exportedAt and never includes a PIN', () => {
    const out = buildBackup(
      { profiles: [{ id: 'p1', name: 'A', level: 'B1', interests: '' }], history: [{ id: 'c1' }] },
      '2026-01-01T00:00:00.000Z',
    );
    expect(out.app).toBe(BACKUP_APP);
    expect(out.version).toBe(BACKUP_VERSION);
    expect(out.exportedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(out.profiles).toHaveLength(1);
    expect(out.history).toHaveLength(1);
    expect(JSON.stringify(out).toLowerCase()).not.toContain('pin');
  });

  test('tolerates missing input', () => {
    const out = buildBackup();
    expect(out.profiles).toEqual([]);
    expect(out.history).toEqual([]);
  });
});

describe('parseBackup', () => {
  const valid = buildBackup(
    {
      profiles: [{ id: 'p1', name: 'Josipa', level: 'B1', interests: 'pools' }],
      history: [{ id: 'c1', profileId: 'p1', messages: [{ role: 'user', content: 'hi' }] }],
    },
    '2026-01-01T00:00:00.000Z',
  );

  test('round-trips a built backup — fills voice defaults and migrates history', () => {
    const { profiles, history } = parseBackup(JSON.stringify(valid));
    expect(profiles[0].name).toBe('Josipa');
    expect(profiles[0]).toHaveProperty('rate'); // withVoiceDefaults applied
    expect(profiles[0]).toHaveProperty('voiceURI');
    expect(history[0]).toHaveProperty('version'); // migrateConversation applied
    expect(history[0]).toHaveProperty('curriculumId');
  });

  test('accepts an already-parsed object, not just a string', () => {
    expect(parseBackup(valid).profiles[0].name).toBe('Josipa');
  });

  test('drops invalid profiles, keeps valid ones', () => {
    const data = buildBackup({
      profiles: [
        { id: 'p1', name: '', level: 'ZZ' }, // invalid
        { id: 'p2', name: 'Ok', level: 'A1' }, // valid
        { name: 'NoId', level: 'A1' }, // missing id
      ],
      history: [],
    });
    expect(parseBackup(JSON.stringify(data)).profiles.map((p) => p.id)).toEqual(['p2']);
  });

  test('rejects invalid JSON with a friendly error', () => {
    expect(() => parseBackup('{not json')).toThrow(/json/i);
  });

  test('rejects a file that is not our backup', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'something-else', profiles: [] }))).toThrow(
      /backup/i,
    );
  });
});
