import { LEVELS, redact, isDebugEnabled, createLogger } from '../../public/js/log.js';

describe('redact', () => {
  test('scrubs sk-ant-… tokens inside strings', () => {
    expect(redact('key is sk-ant-api03-AbC_def-123 ok')).toBe('key is sk-ant-*** ok');
  });

  test('masks secret-named keys (case-insensitive), keeps normal data', () => {
    const out = redact({
      'x-app-pin': 'hunter2',
      'X-API-Key': 'sk-ant-abc',
      Authorization: 'Bearer z',
      token: 't',
      password: 'p',
      name: 'Josipa',
      level: 'B1',
    });
    expect(out['x-app-pin']).toBe('***');
    expect(out['X-API-Key']).toBe('***');
    expect(out.Authorization).toBe('***');
    expect(out.token).toBe('***');
    expect(out.password).toBe('***');
    expect(out.name).toBe('Josipa');
    expect(out.level).toBe('B1');
  });

  test('recurses into nested objects/arrays', () => {
    const out = redact({ headers: { 'x-app-pin': 'p' }, msgs: ['hi', { token: 't' }] });
    expect(out.headers['x-app-pin']).toBe('***');
    expect(out.msgs[1].token).toBe('***');
    expect(out.msgs[0]).toBe('hi');
  });
});

describe('isDebugEnabled', () => {
  const winWith = (search, ls) => ({ location: { search }, localStorage: { getItem: () => ls } });
  test('true via ?debug=1 / ?debug=true', () => {
    expect(isDebugEnabled(winWith('?debug=1', null))).toBe(true);
    expect(isDebugEnabled(winWith('?x=1&debug=true', null))).toBe(true);
  });
  test('true via localStorage flag', () => {
    expect(isDebugEnabled(winWith('', '1'))).toBe(true);
    expect(isDebugEnabled(winWith('', 'true'))).toBe(true);
  });
  test('false otherwise', () => {
    expect(isDebugEnabled(winWith('', null))).toBe(false);
    expect(isDebugEnabled(winWith('?debug=0', '0'))).toBe(false);
  });
});

describe('createLogger', () => {
  function capturing() {
    const lines = [];
    return { lines, sink: (level, args) => lines.push({ level, args }) };
  }

  test('filters messages below the level threshold', () => {
    const { lines, sink } = capturing();
    const logger = createLogger({ level: LEVELS.WARN, sinks: [sink] });
    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');
    expect(lines.map((l) => l.level)).toEqual(['WARN', 'ERROR']);
  });

  test('passes everything at DEBUG level', () => {
    const { lines, sink } = capturing();
    const logger = createLogger({ level: LEVELS.DEBUG, sinks: [sink] });
    logger.debug('d');
    logger.info('i');
    expect(lines.map((l) => l.level)).toEqual(['DEBUG', 'INFO']);
  });

  test('redacts args before the sink sees them', () => {
    const { lines, sink } = capturing();
    const logger = createLogger({ level: LEVELS.DEBUG, sinks: [sink] });
    logger.info('req', { headers: { 'x-app-pin': 'secret' }, key: 'sk-ant-zzz' });
    expect(lines[0].args[1].headers['x-app-pin']).toBe('***');
    expect(lines[0].args[1].key).toBe('sk-ant-***');
  });

  test('a throwing sink does not break logging', () => {
    const { lines, sink } = capturing();
    const bad = () => { throw new Error('boom'); };
    const logger = createLogger({ level: LEVELS.DEBUG, sinks: [bad, sink] });
    expect(() => logger.error('still works')).not.toThrow();
    expect(lines).toHaveLength(1);
  });
});
