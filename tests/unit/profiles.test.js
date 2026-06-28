import {
  LEVELS,
  VOICE_RATE,
  VOICE_PITCH,
  createProfile,
  validateProfile,
  upsertProfile,
  deleteProfile,
  findProfile,
  withVoiceDefaults,
} from '../../public/js/profiles.js';

describe('profiles pure logic', () => {
  test('LEVELS are the five CEFR levels A1–C1', () => {
    expect(LEVELS).toEqual(['A1', 'A2', 'B1', 'B2', 'C1']);
  });

  test('createProfile trims fields and assigns a non-empty id', () => {
    const p = createProfile({ name: '  Josipa  ', level: 'B1', interests: '  water treatment  ' });
    expect(p.name).toBe('Josipa');
    expect(p.interests).toBe('water treatment');
    expect(p.level).toBe('B1');
    expect(typeof p.id).toBe('string');
    expect(p.id.length).toBeGreaterThan(0);
  });

  test('createProfile assigns unique ids', () => {
    const a = createProfile({ name: 'A', level: 'A1' });
    const b = createProfile({ name: 'B', level: 'A1' });
    expect(a.id).not.toBe(b.id);
  });

  test('createProfile defaults interests to an empty string', () => {
    const p = createProfile({ name: 'A', level: 'A1' });
    expect(p.interests).toBe('');
  });

  test('validateProfile rejects a blank name', () => {
    const { valid, errors } = validateProfile({ name: '   ', level: 'A1' });
    expect(valid).toBe(false);
    expect(errors.name).toBeDefined();
  });

  test('validateProfile rejects an invalid level', () => {
    const { valid, errors } = validateProfile({ name: 'Ana', level: 'Z9' });
    expect(valid).toBe(false);
    expect(errors.level).toBeDefined();
  });

  test('validateProfile accepts a complete profile', () => {
    const { valid, errors } = validateProfile({ name: 'Ana', level: 'C1', interests: 'dramas' });
    expect(valid).toBe(true);
    expect(errors).toEqual({});
  });

  test('upsertProfile appends a new profile', () => {
    const p = createProfile({ name: 'A', level: 'A1' });
    const list = upsertProfile([], p);
    expect(list).toHaveLength(1);
    expect(list[0]).toEqual(p);
  });

  test('upsertProfile replaces an existing profile by id (no duplicate)', () => {
    const p = createProfile({ name: 'A', level: 'A1' });
    const updated = { ...p, name: 'Renamed', level: 'B2' };
    const list = upsertProfile([p], updated);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Renamed');
    expect(list[0].level).toBe('B2');
  });

  test('upsertProfile does not mutate the input array', () => {
    const p = createProfile({ name: 'A', level: 'A1' });
    const orig = [p];
    upsertProfile(orig, createProfile({ name: 'B', level: 'A2' }));
    expect(orig).toHaveLength(1);
  });

  test('deleteProfile removes the matching id', () => {
    const a = createProfile({ name: 'A', level: 'A1' });
    const b = createProfile({ name: 'B', level: 'A2' });
    const list = deleteProfile([a, b], a.id);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(b.id);
  });

  test('findProfile returns the match or null', () => {
    const a = createProfile({ name: 'A', level: 'A1' });
    expect(findProfile([a], a.id)).toEqual(a);
    expect(findProfile([a], 'nope')).toBeNull();
  });
});

describe('voice settings (#23)', () => {
  test('createProfile applies voice defaults', () => {
    const p = createProfile({ name: 'A', level: 'A1' });
    expect(p.voiceURI).toBe('');
    expect(p.rate).toBe(VOICE_RATE.default);
    expect(p.pitch).toBe(VOICE_PITCH.default);
  });

  test('createProfile keeps provided in-range voice settings', () => {
    const p = createProfile({ name: 'A', level: 'A1', voiceURI: 'urn:voice', rate: 1.3, pitch: 0.8 });
    expect(p.voiceURI).toBe('urn:voice');
    expect(p.rate).toBeCloseTo(1.3);
    expect(p.pitch).toBeCloseTo(0.8);
  });

  test('withVoiceDefaults fills missing fields and clamps out-of-range values', () => {
    const filled = withVoiceDefaults({});
    expect(filled.voiceURI).toBe('');
    expect(filled.rate).toBe(VOICE_RATE.default);
    expect(filled.pitch).toBe(VOICE_PITCH.default);

    expect(withVoiceDefaults({ rate: 9 }).rate).toBe(VOICE_RATE.max);
    expect(withVoiceDefaults({ pitch: -3 }).pitch).toBe(VOICE_PITCH.min);
  });

  test('withVoiceDefaults coerces non-numeric values to defaults', () => {
    expect(withVoiceDefaults({ rate: 'fast', pitch: null }).rate).toBe(VOICE_RATE.default);
    expect(withVoiceDefaults({ pitch: 'high' }).pitch).toBe(VOICE_PITCH.default);
  });

  test('withVoiceDefaults preserves the rest of the profile', () => {
    const out = withVoiceDefaults({ id: 'x', name: 'Ana', level: 'B1', interests: 'pools' });
    expect(out).toMatchObject({ id: 'x', name: 'Ana', level: 'B1', interests: 'pools' });
  });
});
