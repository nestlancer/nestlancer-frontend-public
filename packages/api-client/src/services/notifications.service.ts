import type { NotificationItem, PaginatedResponse } from '@nestlancer/types';
import type { AxiosInstance } from 'axios';

import { BaseService } from './base.service';
import { asPaginated, peelSuccessEnvelope } from '../utils/peel-success-envelope';
import { normalizeNotificationItem } from '../utils/normalize-notification';
import { unwrapGatewayBody } from '../utils/unwrap-gateway-body';

export class NotificationsService extends BaseService {
  constructor(client: AxiosInstance) {
    super(client);
  }

  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<NotificationItem>> {
    const { data } = await this.client.get<unknown>('/notifications', { params });
    const page = asPaginated<unknown>(data);
    return { ...page, items: page.items.map(normalizeNotificationItem) };
  }

  async unreadCount(): Promise<{ unread: number }> {
    const { data } = await this.client.get<unknown>('/notifications/unread-count');
    const inner = peelSuccessEnvelope(data) as Record<string, unknown>;
    const unread =
      typeof inner.unread === 'number'
        ? inner.unread
        : typeof inner.count === 'number'
          ? inner.count
          : typeof inner.totalUnread === 'number'
            ? inner.totalUnread
            : 0;
    return { unread };
  }

  async history(params?: Record<string, unknown>): Promise<PaginatedResponse<NotificationItem>> {
    const { data } = await this.client.get<unknown>('/notifications/history', { params });
    const page = asPaginated<unknown>(data);
    return { ...page, items: page.items.map(normalizeNotificationItem) };
  }

  async getPreferences(): Promise<Record<string, unknown>> {
    const { data } = await this.client.get<unknown>('/notifications/preferences');
    return unwrapGatewayBody<Record<string, unknown>>(data);
  }

  async patchPreferences(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data } = await this.client.patch<unknown>('/notifications/preferences', payload);
    return unwrapGatewayBody<Record<string, unknown>>(data);
  }

  async getById(id: string): Promise<NotificationItem> {
    const { data } = await this.client.get<unknown>(`/notifications/${encodeURIComponent(id)}`);
    return normalizeNotificationItem(unwrapGatewayBody<unknown>(data));
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(`/notifications/${encodeURIComponent(id)}`);
  }

  async markRead(id: string, read = true): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/notifications/${encodeURIComponent(id)}/read`,
      { read }
    );
    return peelSuccessEnvelope(data);
  }

  async markUnread(id: string): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/notifications/${encodeURIComponent(id)}/unread`
    );
    return peelSuccessEnvelope(data);
  }

  async readAll(): Promise<unknown> {
    const { data } = await this.client.post<unknown>('/notifications/read-all');
    return peelSuccessEnvelope(data);
  }

  async readSelected(notificationIds: string[]): Promise<unknown> {
    const { data } = await this.client.post<unknown>('/notifications/read-selected', {
      notificationIds,
    });
    return peelSuccessEnvelope(data);
  }

  async clearRead(): Promise<unknown> {
    const { data } = await this.client.delete<unknown>('/notifications/clear-read');
    return peelSuccessEnvelope(data);
  }

  async getChannels(): Promise<unknown> {
    const { data } = await this.client.get<unknown>('/notifications/channels');
    return unwrapGatewayBody(data);
  }

  async getPreferenceChannels(): Promise<unknown> {
    const { data } = await this.client.get<unknown>('/notifications/preferences/channels');
    return unwrapGatewayBody(data);
  }

  async patchChannelPreference(channel: string, enabled: boolean): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/notifications/preferences/channel/${encodeURIComponent(channel)}`,
      { enabled }
    );
    return unwrapGatewayBody(data);
  }
}
