import { jest } from '@jest/globals';
import {
  createMic,
  isRecognitionSupported,
  isSynthesisSupported,
  speak,
  getVoices,
  rankVoice,
  listEnglishVoices,
  pickVoice,
} from '../../public/js/speech.js';

// A single-slot fake scheduler. createMic only ever keeps one silence timer at a
// time (it clears before re-arming), so one pending slot models it faithfully.
function fakeTimers() {
  let pending = null;
  let sets = 0;
  let clears = 0;
  return {
    set: (fn) => {
      pending = fn;
      sets += 1;
      return sets;
    },
    clear: () => {
      if (pending != null) clears += 1;
      pending = null;
    },
    flush() {
      const fn = pending;
      pending = null;
      if (fn) fn();
    },
    isPending: () => pending != null,
    stats: () => ({ sets, clears }),
  };
}

// Minimal SpeechRecognition stub; stop() fires onend like the real API does.
function RecognitionFactory() {
  function Fake() {
    this.start = jest.fn();
    this.stop = jest.fn(() => {
      if (this.onend) this.onend();
    });
    Fake.last = this;
    Fake.instances.push(this);
  }
  Fake.instances = [];
  return Fake;
}

// Result-list builders mirroring the cumulative shape of SpeechRecognitionResultList.
const final = (t, confidence) => {
  const alt = confidence === undefined ? { transcript: t } : { transcript: t, confidence };
  const r = [alt];
  r.isFinal = true;
  return r;
};
const partial = (t) => {
  const r = [{ transcript: t }];
  r.isFinal = false;
  return r;
};
// Emit an onresult event whose newly-changed results begin at `from`.
const emit = (rec, from, results) => rec.onresult({ resultIndex: from, results });

describe('createMic — continuous capture + silence timeout', () => {
  test('unsupported when no Recognition constructor', () => {
    const mic = createMic({});
    expect(mic.supported).toBe(false);
    mic.start();
    expect(mic.getState()).toBe('idle');
  });

  test('start enters listening with continuous + interim recognition', () => {
    const Fake = RecognitionFactory();
    const states = [];
    const mic = createMic({ Recognition: Fake, timers: fakeTimers(), onStateChange: (s) => states.push(s) });
    mic.start();
    expect(mic.getState()).toBe('listening');
    expect(states).toContain('listening');
    expect(Fake.last.continuous).toBe(true);
    expect(Fake.last.interimResults).toBe(true);
    expect(Fake.last.start).toHaveBeenCalled();
  });

  test('merges interim into one utterance; delivers only after the silence timeout', () => {
    const Fake = RecognitionFactory();
    const timers = fakeTimers();
    const results = [];
    const interims = [];
    const mic = createMic({
      Recognition: Fake,
      timers,
      onResult: (t) => results.push(t),
      onInterim: (t) => interims.push(t),
    });
    mic.start();
    emit(Fake.last, 0, [partial('hel')]);
    emit(Fake.last, 0, [partial('hello the')]);
    emit(Fake.last, 0, [final('hello there')]);

    expect(results).toEqual([]); // nothing sent while the user is still talking
    expect(interims[interims.length - 1]).toBe('hello there');
    expect(timers.isPending()).toBe(true);

    timers.flush(); // the quiet period elapses
    expect(results).toEqual(['hello there']);
    expect(mic.getState()).toBe('idle');
  });

  test('merges finals captured across pauses', () => {
    const Fake = RecognitionFactory();
    const timers = fakeTimers();
    const results = [];
    const mic = createMic({ Recognition: Fake, timers, onResult: (t) => results.push(t) });
    mic.start();
    emit(Fake.last, 0, [final('hello')]);
    emit(Fake.last, 1, [final('hello'), final('there')]); // next phrase at the next index
    timers.flush();
    expect(results).toEqual(['hello there']);
  });

  test('re-arms (clears then sets) the silence timer on every result', () => {
    const Fake = RecognitionFactory();
    const timers = fakeTimers();
    const mic = createMic({ Recognition: Fake, timers });
    mic.start();
    emit(Fake.last, 0, [partial('a')]);
    emit(Fake.last, 0, [partial('ab')]);
    const { sets, clears } = timers.stats();
    expect(sets).toBe(2);
    expect(clears).toBeGreaterThanOrEqual(1); // prior timer cleared before re-arming
  });

  test('auto-restarts on an involuntary onend while a turn is in progress', () => {
    const Fake = RecognitionFactory();
    const timers = fakeTimers();
    const results = [];
    const mic = createMic({ Recognition: Fake, timers, onResult: (t) => results.push(t) });
    mic.start();
    const first = Fake.last;
    emit(first, 0, [final('hello')]); // captured; silence armed
    first.onend(); // involuntary end mid-turn (e.g. Android 60s cap)

    expect(Fake.instances).toHaveLength(2); // restarted with a fresh recognizer
    expect(Fake.last).not.toBe(first);
    expect(Fake.last.start).toHaveBeenCalled();
    expect(mic.getState()).toBe('listening'); // never dropped out of listening

    timers.flush(); // silence finally elapses on the restarted recognizer
    expect(results).toEqual(['hello']);
    expect(mic.getState()).toBe('idle');
  });

  test('ends idle (no restart) when recognition ends before any speech', () => {
    const Fake = RecognitionFactory();
    const mic = createMic({ Recognition: Fake, timers: fakeTimers() });
    mic.start();
    Fake.last.onend(); // no results captured (no-speech)
    expect(mic.getState()).toBe('idle');
    expect(Fake.instances).toHaveLength(1); // did not restart into a silent loop
  });

  test('explicit stop finalizes immediately, sending the partial transcript', () => {
    const Fake = RecognitionFactory();
    const results = [];
    const mic = createMic({ Recognition: Fake, timers: fakeTimers(), onResult: (t) => results.push(t) });
    mic.start();
    emit(Fake.last, 0, [partial('half a sentence')]); // interim only, never final
    mic.stop();
    expect(results).toEqual(['half a sentence']);
    expect(mic.getState()).toBe('idle');
  });

  test('stop with no speech goes idle and sends nothing', () => {
    const Fake = RecognitionFactory();
    const results = [];
    const mic = createMic({ Recognition: Fake, timers: fakeTimers(), onResult: (t) => results.push(t) });
    mic.start();
    mic.stop();
    expect(results).toEqual([]);
    expect(mic.getState()).toBe('idle');
  });

  test('forwards recognition errors', () => {
    const Fake = RecognitionFactory();
    const errors = [];
    const mic = createMic({ Recognition: Fake, timers: fakeTimers(), onError: (e) => errors.push(e) });
    mic.start();
    Fake.last.onerror({ error: 'no-speech' });
    expect(errors).toEqual(['no-speech']);
  });

  test('toggle starts then stops', () => {
    const Fake = RecognitionFactory();
    const mic = createMic({ Recognition: Fake, timers: fakeTimers() });
    mic.toggle();
    expect(mic.getState()).toBe('listening');
    mic.toggle();
    expect(mic.getState()).toBe('idle');
  });
});

describe('transcript cleanup (#33)', () => {
  function micWith(extra = {}) {
    const Fake = RecognitionFactory();
    const timers = fakeTimers();
    const results = [];
    const mic = createMic({ Recognition: Fake, timers, onResult: (t) => results.push(t), ...extra });
    return { Fake, timers, results, mic };
  }

  test('drops a low-confidence final result (noise)', () => {
    const { Fake, timers, results, mic } = micWith();
    mic.start();
    emit(Fake.last, 0, [final('mumble noise', 0.2)]);
    timers.flush();
    expect(results).toEqual([]);
    expect(mic.getState()).toBe('idle');
  });

  test('keeps a confident final, and one with no confidence reported', () => {
    const a = micWith();
    a.mic.start();
    emit(a.Fake.last, 0, [final('hello there', 0.9)]);
    a.timers.flush();
    expect(a.results).toEqual(['hello there']);

    const b = micWith();
    b.mic.start();
    emit(b.Fake.last, 0, [final('hello there')]); // confidence omitted → kept
    b.timers.flush();
    expect(b.results).toEqual(['hello there']);
  });

  test('drops junk (punctuation-only) before sending', () => {
    const { Fake, timers, results, mic } = micWith();
    mic.start();
    emit(Fake.last, 0, [final('...', 0.95)]);
    timers.flush();
    expect(results).toEqual([]);
  });

  test('de-duplicates a repeated phrase before sending', () => {
    const { Fake, timers, results, mic } = micWith();
    mic.start();
    emit(Fake.last, 0, [final('scream to filter', 0.9)]);
    emit(Fake.last, 1, [final('scream to filter', 0.9), final('scream to filter', 0.9)]);
    timers.flush();
    expect(results).toEqual(['scream to filter']);
  });
});

describe('support detection', () => {
  test('isRecognitionSupported reads standard or webkit prefix', () => {
    expect(isRecognitionSupported({})).toBe(false);
    expect(isRecognitionSupported({ SpeechRecognition: function () {} })).toBe(true);
    expect(isRecognitionSupported({ webkitSpeechRecognition: function () {} })).toBe(true);
  });

  test('isSynthesisSupported requires speechSynthesis + SpeechSynthesisUtterance', () => {
    expect(isSynthesisSupported({})).toBe(false);
    expect(isSynthesisSupported({ speechSynthesis: {}, SpeechSynthesisUtterance: function () {} })).toBe(true);
  });
});

describe('voice selection (#23)', () => {
  const V = (name, lang, extra = {}) => ({
    name,
    lang,
    voiceURI: extra.voiceURI ?? `${name}:${lang}`,
    default: !!extra.default,
  });
  const voices = [
    V('Google US English', 'en-US'),
    V('Microsoft Aria Online (Natural)', 'en-US'),
    V('Daniel', 'en-GB'),
    V('Google français', 'fr-FR'),
    V('Basic', 'en-US', { default: true }),
  ];

  test('getVoices returns [] when synthesis is unavailable', () => {
    expect(getVoices({})).toEqual([]);
    expect(getVoices({ speechSynthesis: {} })).toEqual([]);
  });

  test('rankVoice scores a natural/branded voice above a basic one', () => {
    expect(rankVoice(V('Microsoft Aria Online (Natural)', 'en-US'), 'en-US')).toBeGreaterThan(
      rankVoice(V('Basic', 'en-US'), 'en-US'),
    );
  });

  test('listEnglishVoices keeps only en* voices, best-ranked first', () => {
    const en = listEnglishVoices(voices, 'en-US');
    expect(en.every((v) => /^en/i.test(v.lang))).toBe(true);
    expect(en.some((v) => v.lang === 'fr-FR')).toBe(false);
    expect(en[0].name).toMatch(/Natural/);
  });

  test('pickVoice honors a saved voiceURI when still present', () => {
    expect(pickVoice(voices, { voiceURI: 'Daniel:en-GB', lang: 'en-US' }).name).toBe('Daniel');
  });

  test('pickVoice falls back to the best English voice when the saved one is gone', () => {
    expect(pickVoice(voices, { voiceURI: 'not-on-this-device', lang: 'en-US' }).name).toMatch(/Natural/);
  });

  test('pickVoice returns null with no voices (use the browser default)', () => {
    expect(pickVoice([], { voiceURI: 'x' })).toBeNull();
  });
});

describe('speak', () => {
  test('returns false without synthesis support', () => {
    expect(speak({ text: 'hi' })).toBe(false);
  });

  test('applies the chosen voice, rate and pitch to the utterance', () => {
    let utter;
    const synth = { cancel() {}, speak: (u) => { utter = u; } };
    function Utterance(text) {
      this.text = text;
    }
    const voice = { name: 'Aria', voiceURI: 'aria' };
    speak({ text: 'hi', speechSynthesis: synth, Utterance, voice, rate: 1.4, pitch: 0.7 });
    expect(utter.voice).toBe(voice);
    expect(utter.rate).toBeCloseTo(1.4);
    expect(utter.pitch).toBeCloseTo(0.7);
  });

  test('dispatches via the injected synthesis', () => {
    const spoken = [];
    const synth = { cancel: jest.fn(), speak: jest.fn((u) => spoken.push(u.text)) };
    function Utterance(text) {
      this.text = text;
      this.lang = '';
    }
    const ok = speak({ text: 'hello', speechSynthesis: synth, Utterance });
    expect(ok).toBe(true);
    expect(synth.cancel).toHaveBeenCalled();
    expect(spoken).toEqual(['hello']);
  });

  test('wires onStart/onEnd to the utterance lifecycle', () => {
    let utter;
    const synth = { cancel() {}, speak: (u) => { utter = u; } };
    function Utterance(text) {
      this.text = text;
    }
    const events = [];
    speak({
      text: 'hi',
      speechSynthesis: synth,
      Utterance,
      onStart: () => events.push('start'),
      onEnd: () => events.push('end'),
    });
    utter.onstart();
    utter.onend();
    expect(events).toEqual(['start', 'end']);
  });

  test('an utterance error also ends the speaking state', () => {
    let utter;
    const synth = { cancel() {}, speak: (u) => { utter = u; } };
    function Utterance(text) {
      this.text = text;
    }
    const events = [];
    speak({ text: 'hi', speechSynthesis: synth, Utterance, onEnd: () => events.push('end') });
    utter.onerror();
    expect(events).toEqual(['end']);
  });
});
