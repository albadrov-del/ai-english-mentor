// Lightweight leveled logger with secret redaction.
// Verbose only when debug is on (?debug=1 or localStorage 'aem.debug'); otherwise warnings+errors.
// NEVER logs secrets — values of secret-named keys and any sk-ant-… token are masked (spec §4).

export const LEVELS = { DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40 };

const SECRET_KEY_RE = /^(authorization|x-api-key|x-app-pin|api[_-]?key|apikey|token|secret|password|pin)$/i;
const ANTHROPIC_KEY_RE = /sk-ant-[A-Za-z0-9_-]+/g;

/** Recursively redact secrets: mask secret-named keys, scrub sk-ant-… tokens in strings. Pure. */
export function redact(value) {
  if (typeof value === 'string') return value.replace(ANTHROPIC_KEY_RE, 'sk-ant-***');
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SECRET_KEY_RE.test(k) ? '***' : redact(v);
    }
    return out;
  }
  return value;
}

/** Debug enabled via ?debug=1|true or localStorage 'aem.debug' = '1'|'true'. */
export function isDebugEnabled(win = globalThis) {
  try {
    const qs = win.location && win.location.search ? win.location.search : '';
    if (/[?&]debug=(1|true)\b/.test(qs)) return true;
    const ls = win.localStorage ? win.localStorage.getItem('aem.debug') : null;
    return ls === '1' || ls === 'true';
  } catch {
    return false;
  }
}

const METHOD = { DEBUG: 'debug', INFO: 'info', WARN: 'warn', ERROR: 'error' };

/** Default sink → the browser console. */
export function consoleSink(levelName, args, c = console) {
  const fn = c[METHOD[levelName]] || c.log;
  fn.call(c, `[aem ${levelName}]`, ...args);
}

/**
 * Create a logger. `level` is the threshold; messages below it are dropped.
 * `sinks` receive (levelName, redactedArgs). All args are redacted before sinks see them.
 */
export function createLogger({ level = LEVELS.WARN, sinks = [consoleSink] } = {}) {
  const all = [...sinks];
  const emit = (levelName, levelVal) => (...args) => {
    if (levelVal < level) return;
    const red = args.map(redact);
    for (const s of all) {
      try { s(levelName, red); } catch { /* a broken sink must not break the app */ }
    }
  };
  return {
    level,
    addSink: (s) => all.push(s),
    debug: emit('DEBUG', LEVELS.DEBUG),
    info: emit('INFO', LEVELS.INFO),
    warn: emit('WARN', LEVELS.WARN),
    error: emit('ERROR', LEVELS.ERROR),
  };
}

/** App-wide logger: verbose when debug is on, else warnings+errors only. */
export const log = createLogger({ level: isDebugEnabled() ? LEVELS.DEBUG : LEVELS.WARN });

/** Mount a small on-screen debug panel (only when debug is on); pipes logs into it. */
export function mountDebugPanel(win = globalThis, logger = log) {
  if (!isDebugEnabled(win) || !win.document || !win.document.body) return null;
  const doc = win.document;
  const panel = doc.createElement('pre');
  panel.dataset.testid = 'debug-panel';
  panel.className = 'debug-panel';
  doc.body.appendChild(panel);
  logger.addSink((levelName, args) => {
    const text = args
      .map((a) => (typeof a === 'string' ? a : (() => { try { return JSON.stringify(a); } catch { return String(a); } })()))
      .join(' ');
    panel.textContent += `${levelName}: ${text}\n`;
    panel.scrollTop = panel.scrollHeight;
  });
  return panel;
}
