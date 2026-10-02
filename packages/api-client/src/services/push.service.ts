import type { AxiosInstance } from 'axios';

import { BaseService } from './base.service';
import { peelSuccessEnvelope } from '../utils/peel-success-envelope';

export class PushService extends BaseService {
  constructor(client: AxiosInstance) {
    super(client);
  }

  /** @deprecated Use registerWebPushSubscription for browser Web Push. */
  async register(payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>('/push/register', payload);
    return peelSuccessEnvelope(data);
  }

  async registerWebPushSubscription(payload: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    expirationTime?: number | null;
  }): Promise<unknown> {
    const { data } = await this.client.post<unknown>('/push-subscription', payload);
    return peelSuccessEnvelope(data);
  }

  async removeWebPushSubscription(endpoint: string): Promise<void> {
    await this.client.delete('/push-subscription', { data: { endpoint } });
  }

  async unregister(deviceId: string): Promise<void> {
    await this.client.delete(`/push/unregister/${encodeURIComponent(deviceId)}`);
  }
}
