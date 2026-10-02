import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import { clearTokens } from '@nestlancer/auth';

import { BaseService } from './base.service';

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
  turnstileToken?: string;
  portal?: 'client' | 'admin';
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  /** Acceptance of platform terms — backend rejects without this. */
  acceptTerms: boolean;
  /** Cloudflare Turnstile token. Use the dev bypass token in non-prod. */
  turnstileToken: string;
  phone?: string;
  marketingConsent?: boolean;
}

export interface AuthUserSummary {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role?: string;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
}

export interface AuthLoginTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  user: AuthUserSummary;
}

export interface Auth2FAChallenge {
  requires2FA: true;
  authSessionId: string;
  methodsAvailable: string[];
}

export type AuthLoginResult = AuthLoginTokens | Auth2FAChallenge;

export interface RegisterResult {
  userId: string;
  email: string;
  emailVerificationSent: boolean;
  emailVerificationExpiresAt?: string;
}

export interface ForgotPasswordPayload {
  email: string;
  turnstileToken: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  turnstileToken?: string;
}

export interface VerifyEmailPayload {
  token: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface CheckEmailPayload {
  email: string;
  turnstileToken: string;
}

/** Success payload for `POST /auth/logout-all` after gateway envelope unwrap. */
export interface LogoutAllResult {
  revokedCount: number;
}

export function isLoginTokens(result: AuthLoginResult): result is AuthLoginTokens {
  return (
    (result as AuthLoginTokens).accessToken !== undefined &&
    typeof (result as Auth2FAChallenge).authSessionId !== 'string'
  );
}

type GatewayEnvelope<T> = { status?: string; data?: T; message?: string };

async function postSameOriginAuth<T>(path: string, body: unknown): Promise<T> {
  if (typeof window === 'undefined') {
    throw new Error('Same-origin auth routes require a browser context');
  }
  const res = await fetch(`${window.location.origin}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const payload = (await res.json().catch(() => ({}))) as GatewayEnvelope<T> & {
    message?: string;
    error?: { message?: string; code?: string };
  };
  if (!res.ok) {
    const nested =
      typeof payload.error?.message === 'string' && payload.error.message.trim()
        ? payload.error.message
        : null;
    const code =
      typeof payload.error?.code === 'string' && payload.error.code.trim()
        ? payload.error.code.trim()
        : undefined;
    const retryAfterHeader = res.headers.get('Retry-After');
    const retryAfterSeconds = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : undefined;
    const err = new Error(
      nested ?? payload.message ?? `Auth request failed (${res.status})`
    ) as Error & {
      code?: string;
      status?: number;
      retryAfterSeconds?: number;
    };
    if (code) err.code = code;
    err.status = res.status;
    if (Number.isFinite(retryAfterSeconds) && (retryAfterSeconds as number) > 0) {
      err.retryAfterSeconds = retryAfterSeconds as number;
    }
    throw err;
  }
  if (payload.data === undefined) {
    throw new Error('Invalid auth response');
  }
  const gatewayError = extractGatewayNestedError(payload.data);
  if (gatewayError) {
    const nestedCode = extractGatewayNestedErrorCode(payload.data);
    const err = new Error(gatewayError) as Error & { code?: string };
    if (nestedCode) err.code = nestedCode;
    throw err;
  }
  return payload.data;
}

function extractGatewayNestedError(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  if (record.status !== 'error') return null;
  const err = record.error;
  if (!err || typeof err !== 'object') return null;
  const message = (err as Record<string, unknown>).message;
  return typeof message === 'string' ? message : null;
}

function extractGatewayNestedErrorCode(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  if (record.status !== 'error') return null;
  const err = record.error;
  if (!err || typeof err !== 'object') return null;
  const code = (err as Record<string, unknown>).code;
  return typeof code === 'string' ? code : null;
}

export class AuthService extends BaseService {
  constructor(client: AxiosInstance) {
    super(client);
  }

  async login(payload: LoginPayload): Promise<AuthLoginResult> {
    if (typeof window !== 'undefined') {
      return postSameOriginAuth<AuthLoginResult>('/api/auth/login', payload);
    }
    const { data } = await this.client.post<AuthLoginResult>('/auth/login', payload);
    return data;
  }

  async register(payload: RegisterPayload): Promise<RegisterResult> {
    const { data } = await this.client.post<RegisterResult>('/auth/register', payload);
    return data;
  }

  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      await fetch(`${window.location.origin}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }).catch(() => undefined);
      clearTokens();
      return;
    }
    await this.client.post('/auth/logout', {}, { skipAuth: true } as InternalAxiosRequestConfig & {
      skipAuth?: boolean;
    });
  }

  async logoutAll(): Promise<LogoutAllResult> {
    const { data } = await this.client.post<LogoutAllResult>('/auth/logout-all');
    return data;
  }

  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    await this.client.post('/auth/forgot-password', payload);
  }

  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    await this.client.post('/auth/reset-password', payload);
  }

  async verifyEmail(payload: VerifyEmailPayload): Promise<void> {
    await this.client.post('/auth/verify-email', payload);
  }

  async resendVerification(payload: ResendVerificationPayload): Promise<void> {
    await this.client.post('/auth/resend-verification', payload);
  }

  async checkEmail(payload: CheckEmailPayload): Promise<{ available: boolean; valid?: boolean }> {
    const { data } = await this.client.post<{ available?: boolean; valid?: boolean }>(
      '/auth/check-email',
      payload
    );
    // Backend returns `valid` (format ok / historically "can register"). Prefer `available`.
    const available =
      typeof data?.available === 'boolean'
        ? data.available
        : typeof data?.valid === 'boolean'
          ? data.valid
          : true;
    return { available, valid: data?.valid };
  }

  async verify2FA(payload: {
    authSessionId: string;
    code: string;
    method?: 'totp' | 'backupCode';
    rememberMe?: boolean;
  }): Promise<AuthLoginTokens> {
    if (typeof window !== 'undefined') {
      return postSameOriginAuth<AuthLoginTokens>('/api/auth/verify-2fa', {
        authSessionId: payload.authSessionId,
        code: payload.code,
        method: payload.method ?? (payload.code.length > 6 ? 'backupCode' : 'totp'),
        rememberMe: payload.rememberMe,
      });
    }
    const { data } = await this.client.post<AuthLoginTokens>('/auth/verify-2fa', {
      authSessionId: payload.authSessionId,
      code: payload.code,
      method: payload.method ?? (payload.code.length > 6 ? 'backupCode' : 'totp'),
      rememberMe: payload.rememberMe,
    });
    return data;
  }
}
