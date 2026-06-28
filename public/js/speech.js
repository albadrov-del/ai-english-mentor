// Thin wrapper around the Web Speech API. Browser globals are injected so the
// mic state machine + support detection are unit-testable with stubs (no real speech).
// Continuous capture with a silence-timeout finalize (Sprint 2 / #22) — see docs/ARCHITECTURE.md.

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
 * Mic controller with an idle ↔ listening state machine and continuous capture.
 *
 * Recognition runs in `continuous` mode with interim results: a turn is assembled
 * from many result events and is only finalized — delivered via onResult — after
 * `silenceMs` of quiet, or when the user taps Stop. While listening, an involuntary
 * `onend` mid-turn (Android's ~60s cap, a transient no-speech) auto-restarts so a
 * natural pause never cuts the user off. Supersedes the Sprint-1 discrete-utterance
 * decision; see docs/ARCHITECTURE.md.
 *
 * @param {object}   opts
 * @param {Function} opts.Recognition      SpeechRecognition constructor (undefined → unsupported)
 * @param {string}   [opts.lang]
 * @param {number}   [opts.silenceMs]      quiet time before a turn is finalized (default 3000)
 * @param {Function} [opts.onResult]       (transcript) => void  — final, merged transcript
 * @param {Function} [opts.onInterim]      (partial) => void     — live partial while listening
 * @param {Function} [opts.onStateChange]  (state) => void       — 'idle' | 'listening'
 * @param {Function} [opts.onError]        (errorType) => void
 * @param {object}   [opts.timers]         { set, clear } — injectable for deterministic tests
 */
export function createMic({
  Recognition,
  lang = 'en-US',
  silenceMs = 3000,
  onResult = () => {},
  onInterim = () => {},
  onStateChange = () => {},
  onError = () => {},
  timers = { set: (fn, ms) => globalThis.setTimeout(fn, ms), clear: (id) => globalThis.clearTimeout(id) },
} = {}) {
  const supported = typeof Recognition === 'function';
  let state = 'idle';
  let recognition = null;
  let finalized = ''; // committed text for this turn (persists across auto-restarts)
  let interim = ''; // latest partial from the current recognition instance
  let silenceTimer = null;
  let stopping = false; // true → this onend is intentional (finalize/stop), don't restart

  function setState(next) {
    if (next !== state) {
      state = next;
      onStateChange(state);
    }
  }

  const combined = () => `${finalized} ${interim}`.replace(/\s+/g, ' ').trim();

  function clearSilence() {
    if (silenceTimer != null) {
      timers.clear(silenceTimer);
      silenceTimer = null;
    }
  }

  function armSilence() {
    clearSilence();
    silenceTimer = timers.set(() => finalizeTurn(), silenceMs);
  }

  function setIdle() {
    clearSilence();
    stopping = false;
    recognition = null;
    finalized = '';
    interim = '';
    setState('idle');
  }

  // Send the assembled turn (if any) and return to idle — used by the silence
  // timeout and by an explicit Stop.
  function finalizeTurn() {
    if (state !== 'listening') return;
    clearSilence();
    stopping = true;
    const text = combined(); // capture before stop()/onend can reset it
    try {
      recognition?.stop();
    } catch {
      /* ignore — fall through to idle */
    }
    if (text) {
      log.debug('mic.finalize', { chars: text.length });
      onResult(text);
    }
    if (state === 'listening') setIdle(); // real browsers end async; force bookkeeping
  }

  function restart() {
    interim = '';
    log.debug('mic.restart');
    try {
      recognition = build();
      recognition.start();
    } catch {
      setIdle();
    }
  }

  function build() {
    const rec = new Recognition();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      const results = event?.results ?? [];
      const from = Number.isInteger(event?.resultIndex) ? event.resultIndex : 0;
      let live = '';
      for (let i = from; i < results.length; i++) {
        const r = results[i];
        const text = String(r?.[0]?.transcript ?? '');
        if (r?.isFinal) finalized = `${finalized} ${text}`.replace(/\s+/g, ' ').trim();
        else live += text;
      }
      interim = live.trim();
      log.debug('mic.result', { final: finalized.length, interim: interim.length });
      onInterim(combined());
      armSilence(); // speech arrived → restart the quiet countdown
    };
    rec.onerror = (event) => onError(event?.error ?? 'error');
    rec.onend = () => {
      log.debug('mic.end', { stopping });
      if (stopping) {
        setIdle();
        return;
      }
      // Involuntary end mid-turn (text already captured) → keep the turn alive.
      if (state === 'listening' && combined().length > 0) restart();
      else setIdle();
    };
    return rec;
  }

  const api = {
    supported,
    getState: () => state,
    start() {
      if (!supported || state === 'listening') return;
      log.debug('mic.start');
      stopping = false;
      finalized = '';
      interim = '';
      recognition = build();
      setState('listening');
      try {
        recognition.start();
      } catch {
        setIdle();
      }
    },
    stop() {
      // Explicit Stop: send whatever we have so far, then go idle.
      if (state !== 'listening') return;
      finalizeTurn();
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
