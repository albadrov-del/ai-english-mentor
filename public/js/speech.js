// Thin wrapper around the Web Speech API. Browser globals are injected so the
// mic state machine + support detection are unit-testable with stubs (no real speech).
// Recognition is used as discrete utterances (continuous mode is unreliable — see docs/ARCHITECTURE.md).

import { log } from './log.js';

export function getSpeechRecognition(win = globalThis) {
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export function isRecognitionSupported(win = globalThis) {
  return getSpeechRecognition(win) != null;
}

export function isSynthesisSupported(win = globalThis) {
  return typeof win.speechSynthesis !== 'undefined' && typeof win.SpeechSynthesisUtterance === 'function';
}

/**
 * Mic controller with an idle ↔ listening state machine.
 * @param {object} opts
 * @param {Function} opts.Recognition   SpeechRecognition constructor (undefined → unsupported)
 * @param {string}   [opts.lang]
 * @param {Function} [opts.onResult]     (transcript) => void  — final transcript
 * @param {Function} [opts.onStateChange] (state) => void       — 'idle' | 'listening'
 * @param {Function} [opts.onError]      (errorType) => void
 */
export function createMic({
  Recognition,
  lang = 'en-US',
  onResult = () => {},
  onStateChange = () => {},
  onError = () => {},
} = {}) {
  const supported = typeof Recognition === 'function';
  let state = 'idle';
  let recognition = null;

  function setState(next) {
    if (next !== state) {
      state = next;
      onStateChange(state);
    }
  }

  function build() {
    const rec = new Recognition();
    rec.lang = lang;
    rec.interimResults = false;
    rec.continuous = false; // discrete utterances
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      const transcript = event?.results?.[0]?.[0]?.transcript ?? '';
      const trimmed = String(transcript).trim();
      log.debug('mic.result', { chars: trimmed.length });
      if (trimmed) onResult(trimmed);
    };
    rec.onerror = (event) => onError(event?.error ?? 'error');
    rec.onend = () => {
      log.debug('mic.end');
      setState('idle');
    };
    return rec;
  }

  const api = {
    supported,
    getState: () => state,
    start() {
      if (!supported || state === 'listening') return;
      log.debug('mic.start');
      recognition = build();
      setState('listening');
      try {
        recognition.start();
      } catch {
        setState('idle');
      }
    },
    stop() {
      if (state !== 'listening' || !recognition) return;
      try {
        recognition.stop();
      } catch {
        setState('idle');
      }
    },
    toggle() {
      if (state === 'listening') api.stop();
      else api.start();
    },
  };
  return api;
}

/**
 * Speak text via SpeechSynthesis. Returns true if it was dispatched.
 * onStart/onEnd fire on the utterance lifecycle (used to animate the avatar).
 */
export function speak({ text, speechSynthesis, Utterance, lang = 'en-US', onStart, onEnd } = {}) {
  if (!text || !speechSynthesis || typeof Utterance !== 'function') return false;
  try {
    speechSynthesis.cancel();
    const utterance = new Utterance(text);
    utterance.lang = lang;
    if (typeof onStart === 'function') utterance.onstart = () => onStart();
    if (typeof onEnd === 'function') {
      const done = () => onEnd();
      utterance.onend = done;
      utterance.onerror = done; // never get stuck "speaking" if it errors
    }
    speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}
