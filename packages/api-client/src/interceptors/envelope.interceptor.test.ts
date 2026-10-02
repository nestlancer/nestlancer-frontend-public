import { describe, expect, it } from 'vitest';

import { unwrapSuccessResponseData } from './envelope.interceptor';

describe('unwrapSuccessResponseData', () => {
  it('preserves pagination when success data is a list', () => {
    const payload = {
      status: 'success',
      data: [{ id: 'm1', content: 'hello' }],
      pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
    };
    expect(unwrapSuccessResponseData(payload)).toEqual({
      data: [{ id: 'm1', content: 'hello' }],
      pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
  });

  it('preserves empty list + zero pagination (moderation queue)', () => {
    const payload = {
      status: 'success',
      data: [],
      pagination: { page: 1, limit: 100, total: 0, totalPages: 1 },
    };
    expect(unwrapSuccessResponseData(payload)).toEqual({
      data: [],
      pagination: { page: 1, limit: 100, total: 0, totalPages: 1 },
    });
  });

  it('still unwraps object payloads to the inner data', () => {
    expect(
      unwrapSuccessResponseData({
        status: 'success',
        data: { id: 'u1', email: 'a@b.com' },
      })
    ).toEqual({ id: 'u1', email: 'a@b.com' });
  });

  it('still unwraps bare arrays without pagination siblings', () => {
    expect(unwrapSuccessResponseData({ status: 'success', data: [1, 2, 3] })).toEqual([1, 2, 3]);
  });

  it('rejects nested gateway business errors', () => {
    expect(() =>
      unwrapSuccessResponseData({
        status: 'success',
        data: { status: 'error', error: { code: 'X', message: 'Nope' } },
      })
    ).toThrow('Nope');
  });
});
