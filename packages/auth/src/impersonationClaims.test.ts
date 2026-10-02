import { describe, expect, it } from 'vitest';

import { readImpersonationClaims } from './impersonationClaims';

function token(payload: Record<string, unknown>): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'RS256' })}.${encode(payload)}.sig`;
}

describe('readImpersonationClaims', () => {
  it('accepts a client-portal support access token', () => {
    const claims = readImpersonationClaims(
      token({
        sub: 'user-1',
        email: 'client@example.com',
        type: 'access',
        portal: 'client',
        isImpersonated: true,
        impersonationSessionId: 'session-1',
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
      })
    );
    expect(claims).toEqual({
      sub: 'user-1',
      email: 'client@example.com',
      sessionId: 'session-1',
      exp: expect.any(Number),
    });
  });

  it('rejects a normal client token and an expired support token', () => {
    expect(
      readImpersonationClaims(
        token({
          sub: 'user-1',
          type: 'access',
          portal: 'client',
          exp: Math.floor(Date.now() / 1000) + 60,
        })
      )
    ).toBeNull();
    expect(
      readImpersonationClaims(
        token({
          sub: 'user-1',
          type: 'access',
          portal: 'client',
          isImpersonated: true,
          impersonationSessionId: 'session-1',
          exp: Math.floor(Date.now() / 1000) - 10,
        })
      )
    ).toBeNull();
  });
});
