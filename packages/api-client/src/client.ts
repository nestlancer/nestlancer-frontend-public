import axios, { type AxiosInstance } from 'axios';

import { resolvePublicApiUrl } from '@nestlancer/config';

export interface CreateApiClientOptions {
  baseURL?: string;
}

function resolveBaseURL(override?: string): string {
  return resolvePublicApiUrl(override);
}

export function createApiClient(options: CreateApiClientOptions = {}): AxiosInstance {
  const baseURL = resolveBaseURL(options.baseURL);

  return axios.create({
    baseURL: `${baseURL}/api/v1`,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30_000,
  });
}
