import { isAxiosError } from 'axios';

import { isMaintenanceError } from './maintenance';

export { isAxiosError };

export function getApiErrorCode(error: unknown): string | null {
  // Prefer the business error code from the API envelope. Axios also sets
  // `error.code` to transport codes like ERR_BAD_REQUEST — those must not win
  // over PROJECT_001 / QUOTE_001 (NL-BUG-UI-015).
  if (isAxiosError(error)) {
    const data = error.response?.data as unknown;
    if (typeof data === 'object' && data !== null) {
      const nested = (data as { error?: { code?: unknown } }).error;
      if (nested && typeof nested.code === 'string' && nested.code.trim()) {
        return nested.code.trim();
      }
      if ('code' in data && typeof (data as { code?: unknown }).code === 'string') {
        const top = (data as { code: string }).code.trim();
        if (top) return top;
      }
    }
    // Bare Nest NotFoundException / lost envelope — map status for soft 404s.
    if (error.response?.status === 404) {
      return 'HTTP_404';
    }
  }
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string' && code.trim()) {
      const trimmed = code.trim();
      // Ignore Axios transport codes when no API envelope was present.
      if (!trimmed.startsWith('ERR_') && trimmed !== 'ECONNABORTED') {
        return trimmed;
      }
    }
  }
  return null;
}

/** True when an API error should render Next.js `notFound()` (NL-BUG-UI-015). */
export function isNotFoundApiError(error: unknown): boolean {
  const code = getApiErrorCode(error);
  if (
    code === 'HTTP_404' ||
    code === 'PROJECT_001' ||
    code === 'QUOTE_001' ||
    code === 'PAYMENT_001' ||
    code === 'REQUEST_001'
  ) {
    return true;
  }
  if (isAxiosError(error) && error.response?.status === 404) {
    return true;
  }
  return false;
}

/** Retry-After seconds from BFF/gateway rate-limit responses. */
export function getApiRetryAfterSeconds(error: unknown): number | null {
  if (error && typeof error === 'object' && 'retryAfterSeconds' in error) {
    const seconds = (error as { retryAfterSeconds?: unknown }).retryAfterSeconds;
    if (typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0) {
      return Math.ceil(seconds);
    }
  }
  if (isAxiosError(error)) {
    const header = error.response?.headers?.['retry-after'];
    const parsed = typeof header === 'string' ? Number.parseInt(header, 10) : NaN;
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (isMaintenanceError(error)) {
    if (isAxiosError(error)) {
      const data = error.response?.data as unknown;
      if (typeof data === 'object' && data !== null) {
        const nested = (data as { error?: { message?: unknown } }).error;
        if (nested && typeof nested.message === 'string') return nested.message;
      }
    }
    return 'The platform is temporarily under maintenance. Please try again shortly.';
  }
  if (isAxiosError(error)) {
    const data = error.response?.data as unknown;
    if (typeof data === 'object' && data !== null) {
      const nested = (data as { error?: { message?: unknown } }).error;
      if (nested && typeof nested.message === 'string') return nested.message;
      if ('message' in data) {
        const m = (data as { message?: unknown }).message;
        if (typeof m === 'string') return m;
      }
    }
    if (typeof error.message === 'string' && error.message !== 'Network Error') {
      return error.message;
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
