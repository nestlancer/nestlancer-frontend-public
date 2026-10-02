import { afterEach, describe, expect, it, vi } from 'vitest';

import { createLogger, redactSecrets, resolveLogLevel, resolveServiceName } from '../logger.mjs';

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.restoreAllMocks();
});

describe('resolveLogLevel', () => {
  it('defaults to info in production', () => {
    delete process.env.LOG_LEVEL;
    process.env.NODE_ENV = 'production';
    expect(resolveLogLevel()).toBe('info');
  });

  it('defaults to debug outside production', () => {
    delete process.env.LOG_LEVEL;
    process.env.NODE_ENV = 'development';
    expect(resolveLogLevel()).toBe('debug');
  });

  it('honors LOG_LEVEL', () => {
    process.env.LOG_LEVEL = 'warn';
    expect(resolveLogLevel()).toBe('warn');
  });
});

describe('resolveServiceName', () => {
  it('prefers NESTLANCER_SERVICE', () => {
    process.env.NESTLANCER_SERVICE = 'nl-prod-frontend-web';
    expect(resolveServiceName('fallback')).toBe('nl-prod-frontend-web');
  });

  it('uses fallback when unset', () => {
    delete process.env.NESTLANCER_SERVICE;
    expect(resolveServiceName('nl-prod-frontend-web')).toBe('nl-prod-frontend-web');
  });
});

describe('redactSecrets', () => {
  it('redacts secret-looking keys', () => {
    expect(
      redactSecrets({
        password: 'secret',
        refreshToken: 'tok',
        email: 'a@b.com',
        nested: { authorization: 'Bearer x', ok: 1 },
      })
    ).toEqual({
      password: '[REDACTED]',
      refreshToken: '[REDACTED]',
      email: 'a@b.com',
      nested: { authorization: '[REDACTED]', ok: 1 },
    });
  });
});

describe('createLogger', () => {
  it('writes JSON to stdout at info and gates debug when LOG_LEVEL=info', () => {
    process.env.LOG_LEVEL = 'info';
    process.env.NESTLANCER_SERVICE = 'test-svc';
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const log = createLogger({ service: 'test-svc' });
    log.debug('hidden');
    log.info('visible', { event: 'app.start', correlationId: 'cid-1' });
    log.warn('caution', { event: 'auth.login' });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const infoRaw = logSpy.mock.calls[0]?.[0];
    if (infoRaw == null) throw new Error('expected info log');
    const infoLine = JSON.parse(String(infoRaw));
    expect(infoLine).toMatchObject({
      level: 'info',
      message: 'visible',
      service: 'test-svc',
      event: 'app.start',
      correlationId: 'cid-1',
    });
    expect(typeof infoLine.timestamp).toBe('string');

    expect(errSpy).toHaveBeenCalledTimes(1);
    const warnRaw = errSpy.mock.calls[0]?.[0];
    if (warnRaw == null) throw new Error('expected warn log');
    const warnLine = JSON.parse(String(warnRaw));
    expect(warnLine.level).toBe('warn');
    expect(warnLine.message).toBe('caution');
  });

  it('redacts secrets in field payloads', () => {
    process.env.LOG_LEVEL = 'info';
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const log = createLogger({ service: 'test-svc' });
    log.info('login', { password: 'nope', email: 'a@b.com' });
    const raw = logSpy.mock.calls[0]?.[0];
    if (raw == null) throw new Error('expected log line');
    const line = JSON.parse(String(raw));
    expect(line.password).toBe('[REDACTED]');
    expect(line.email).toBe('a@b.com');
  });
});
