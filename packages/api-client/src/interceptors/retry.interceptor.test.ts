import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { attachRetryInterceptor } from './retry.interceptor';

vi.mock('../maintenance', () => ({
  isMaintenanceError: () => false,
  notifyMaintenanceFromError: () => undefined,
}));

function makeClient(): AxiosInstance {
  const client = axios.create({ baseURL: 'http://example.test' });
  attachRetryInterceptor(client);
  return client;
}

describe('attachRetryInterceptor', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('retries GET on 503', async () => {
    vi.useFakeTimers();
    const client = makeClient();
    let calls = 0;
    client.defaults.adapter = async (config) => {
      calls += 1;
      if (calls === 1) {
        const error = new Error('Service Unavailable') as AxiosError;
        error.isAxiosError = true;
        error.config = config;
        error.code = 'ERR_BAD_RESPONSE';
        error.response = {
          data: null,
          status: 503,
          statusText: 'Service Unavailable',
          headers: {},
          config,
        };
        throw error;
      }
      return {
        data: { ok: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    const promise = client.get('/items');
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(res.status).toBe(200);
    expect(calls).toBe(2);
  });

  it('does not retry POST without idempotency key', async () => {
    const client = makeClient();
    let calls = 0;
    client.defaults.adapter = async (config) => {
      calls += 1;
      const error = new Error('Service Unavailable') as AxiosError;
      error.isAxiosError = true;
      error.config = config;
      error.response = {
        data: null,
        status: 503,
        statusText: 'Service Unavailable',
        headers: {},
        config,
      };
      throw error;
    };

    await expect(client.post('/orders', { a: 1 })).rejects.toMatchObject({
      response: { status: 503 },
    });
    expect(calls).toBe(1);
  });

  it('retries POST when Idempotency-Key is set', async () => {
    vi.useFakeTimers();
    const client = makeClient();
    let calls = 0;
    client.defaults.adapter = async (config) => {
      calls += 1;
      if (calls === 1) {
        const error = new Error('Bad Gateway') as AxiosError;
        error.isAxiosError = true;
        error.config = config;
        error.response = {
          data: null,
          status: 502,
          statusText: 'Bad Gateway',
          headers: {},
          config,
        };
        throw error;
      }
      return {
        data: { ok: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    const promise = client.post('/orders', { a: 1 }, { headers: { 'Idempotency-Key': 'pay-1' } });
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(res.status).toBe(200);
    expect(calls).toBe(2);
  });
});
