import { jest } from '@jest/globals';
import {
  createMic,
  isRecognitionSupported,
  isSynthesisSupported,
  speak,
} from '../../public/js/speech.js';

function FakeRecognitionFactory() {
  function Fake() {
    this.start = jest.fn();
    this.stop = jest.fn(() => {
      if (this.onend) this.onend();
    });
    Fake.last = this;
  }
  return Fake;
}

describe('createMic state machine', () => {
  test('unsupported when no Recognition constructor', () => {
    const mic = createMic({});
    expect(mic.supported).toBe(false);
    mic.start();
    expect(mic.getState()).toBe('idle');
  });

  test('start moves to listening and calls recognition.start()', () => {
    const Fake = FakeRecognitionFactory();
    const states = [];
    const mic = createMic({ Recognition: Fake, onStateChange: (s) => states.push(s) });
    mic.start();
    expect(mic.getState()).toBe('listening');
    expect(states).toContain('listening');
    expect(Fake.last.start).toHaveBeenCalled();
  });

  test('onresult delivers a trimmed transcript', () => {
    const Fake = FakeRecognitionFactory();
    const results = [];
    const mic = createMic({ Recognition: Fake, onResult: (t) => results.push(t) });
    mic.start();
    Fake.last.onresult({ results: [[{ transcript: '  Hello there ' }]] });
    expect(results).toEqual(['Hello there']);
  });

  test('onend returns to idle', () => {
    const Fake = FakeRecognitionFactory();
    const mic = createMic({ Recognition: Fake });
    mic.start();
    Fake.last.onend();
    expect(mic.getState()).toBe('idle');
  });

  test('onerror is surfaced and the session ends idle (no crash)', () => {
    const Fake = FakeRecognitionFactory();
    const errors = [];
    const mic = createMic({ Recognition: Fake, onError: (e) => errors.push(e) });
    mic.start();
    Fake.last.onerror({ error: 'no-speech' });
    Fake.last.onend();
    expect(errors).toEqual(['no-speech']);
    expect(mic.getState()).toBe('idle');
  });

  test('toggle starts then stops', () => {
    const Fake = FakeRecognitionFactory();
    const mic = createMic({ Recognition: Fake });
    mic.toggle();
    expect(mic.getState()).toBe('listening');
    mic.toggle();
    expect(mic.getState()).toBe('idle');
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

describe('speak', () => {
  test('returns false without synthesis support', () => {
    expect(speak({ text: 'hi' })).toBe(false);
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
