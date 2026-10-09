import { describe, expect, it } from 'vitest';

import {
  isAuthGuestOnlyPath,
  resolvePostLoginRedirect,
  resolveTurnstileToken,
} from '@nestlancer/constants';
import { openSafeHttpUrl, safeHttpUrl, safeInAppPath, safeNavigationUrl } from '@nestlancer/utils';

describe('safe urls', () => {
  it('allows https and mailto links', () => {
    expect(safeHttpUrl('https://cdn.nestlancer.com/file.pdf')).toBe(
      'https://cdn.nestlancer.com/file.pdf'
    );
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpUrl('//evil.example/phish')).toBeNull();
    expect(safeNavigationUrl('mailto:contact@nestlancer.com', { mailto: true })).toBe(
      'mailto:contact@nestlancer.com'
    );
  });

  it('rejects protocol-relative and control-character paths', () => {
    expect(safeInAppPath('//evil.example')).toBeNull();
    expect(safeInAppPath('/\\evil.example')).toBeNull();
    expect(safeInAppPath('/projects/1?tab=files')).toBe('/projects/1?tab=files');
    expect(safeInAppPath(`/${String.fromCharCode(9)}/evil.example`)).toBeNull();
    expect(safeNavigationUrl('//evil.example')).toBeNull();
    expect(safeNavigationUrl('docs/guide.md')).toBe('docs/guide.md');
  });

  it('does not open unsafe urls', () => {
    expect(openSafeHttpUrl('javascript:alert(1)')).toBe(false);
  });
});

describe('post-login redirect', () => {
  it('rejects control characters and protocol-relative return paths', () => {
    expect(isAuthGuestOnlyPath('//evil.example')).toBe(true);
    expect(isAuthGuestOnlyPath(`/${String.fromCharCode(9)}evil`)).toBe(true);
    expect(resolvePostLoginRedirect('//evil.example')).toBe('/dashboard');
    expect(resolvePostLoginRedirect('/projects/42')).toBe('/projects/42');
  });
});

describe('turnstile bypass', () => {
  it('does not use the public bypass token in production', () => {
    const env = process.env as Record<string, string | undefined>;
    const previousNodeEnv = env.NODE_ENV;
    const previousBypass = env.NEXT_PUBLIC_TURNSTILE_BYPASS_TOKEN;
    const previousSiteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    env.NODE_ENV = 'production';
    env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'site-key';
    env.NEXT_PUBLIC_TURNSTILE_BYPASS_TOKEN = 'should-not-ship';
    expect(() => resolveTurnstileToken(null)).toThrow(/Security verification/);
    env.NODE_ENV = previousNodeEnv;
    env.NEXT_PUBLIC_TURNSTILE_BYPASS_TOKEN = previousBypass;
    env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = previousSiteKey;
  });
});
