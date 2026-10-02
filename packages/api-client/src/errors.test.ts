import { describe, expect, it } from 'vitest';
import axios from 'axios';

import { getApiErrorCode, isNotFoundApiError } from './errors';

describe('getApiErrorCode', () => {
  it('prefers API envelope code over Axios ERR_* transport code (NL-BUG-UI-015)', () => {
    const error = new axios.AxiosError(
      'Request failed with status code 422',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: {},
        config: {} as never,
        data: {
          status: 'error',
          error: { code: 'PROJECT_001', message: 'Project not found' },
        },
      }
    );

    expect(error.code).toBe('ERR_BAD_REQUEST');
    expect(getApiErrorCode(error)).toBe('PROJECT_001');
    expect(isNotFoundApiError(error)).toBe(true);
  });

  it('returns QUOTE_001 from nested envelope', () => {
    const error = new axios.AxiosError(
      'Request failed with status code 404',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config: {} as never,
        data: {
          status: 'error',
          error: { code: 'QUOTE_001', message: 'Quote not found' },
        },
      }
    );

    expect(getApiErrorCode(error)).toBe('QUOTE_001');
    expect(isNotFoundApiError(error)).toBe(true);
  });

  it('maps bare HTTP 404 status to HTTP_404 when envelope is missing', () => {
    const error = new axios.AxiosError(
      'Request failed with status code 404',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config: {} as never,
        data: { message: 'Not Found' },
      }
    );

    expect(getApiErrorCode(error)).toBe('HTTP_404');
    expect(isNotFoundApiError(error)).toBe(true);
  });
});
