import { dedupeTranscript, isJunk } from '../../public/js/transcript.js';

describe('dedupeTranscript', () => {
  test('collapses a consecutively repeated multi-word phrase', () => {
    expect(dedupeTranscript('scream to filter scream to filter scream to filter')).toBe('scream to filter');
  });

  test('collapses repeated single words', () => {
    expect(dedupeTranscript('the the the cat')).toBe('the cat');
    expect(dedupeTranscript('hello hello world')).toBe('hello world');
  });

  test('is case-insensitive when matching but preserves the kept casing', () => {
    expect(dedupeTranscript('Hello hello there')).toBe('Hello there');
  });

  test('leaves clean text untouched', () => {
    expect(dedupeTranscript('how was your last trip')).toBe('how was your last trip');
  });

  test('normalizes whitespace and tolerates empty input', () => {
    expect(dedupeTranscript('  spaced   out  text ')).toBe('spaced out text');
    expect(dedupeTranscript('')).toBe('');
    expect(dedupeTranscript(null)).toBe('');
  });

  test('does not collapse non-adjacent repeats', () => {
    expect(dedupeTranscript('cat dog cat')).toBe('cat dog cat');
  });
});

describe('isJunk', () => {
  test('flags empty / whitespace', () => {
    expect(isJunk('')).toBe(true);
    expect(isJunk('   ')).toBe(true);
    expect(isJunk(null)).toBe(true);
  });

  test('flags punctuation- / digit-only and stray single letters', () => {
    expect(isJunk('...')).toBe(true);
    expect(isJunk('!!')).toBe(true);
    expect(isJunk('123')).toBe(true);
    expect(isJunk('s')).toBe(true);
  });

  test('keeps real words, including short ones', () => {
    expect(isJunk('hi')).toBe(false);
    expect(isJunk('ok')).toBe(false);
    expect(isJunk('no')).toBe(false);
    expect(isJunk('I')).toBe(false);
    expect(isJunk('a')).toBe(false);
    expect(isJunk('hello there')).toBe(false);
  });
});
