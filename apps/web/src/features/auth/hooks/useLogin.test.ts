import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@nestlancer/ui', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@nestlancer/auth', () => ({
  setTokens: vi.fn(),
  useAuth: () => ({ setUser: vi.fn(), markHydrated: vi.fn() }),
}));

vi.mock('../store/authStore', () => ({
  useAuthUiStore: (selector: (s: { setLoginRedirect: () => void }) => unknown) =>
    selector({ setLoginRedirect: vi.fn() }),
}));

vi.mock('@/lib/axios', () => ({
  apiServices: {
    auth: { login: vi.fn() },
    users: { getProfile: vi.fn() },
  },
}));

import { isLoginTokens } from '@nestlancer/api-client';

describe('useLogin helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('isLoginTokens identifies token response', () => {
    expect(
      isLoginTokens({
        accessToken: 'tok',
        expiresIn: 3600,
        tokenType: 'Bearer',
        user: { id: '1', email: 'a@b.com', role: 'user' },
      })
    ).toBe(true);
  });

  it('isLoginTokens rejects 2FA challenge', () => {
    expect(
      isLoginTokens({
        requires2FA: true,
        authSessionId: 'session-1',
        methodsAvailable: ['totp'],
      })
    ).toBe(false);
  });
});
