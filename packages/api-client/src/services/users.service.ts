import type {
  ApiUserProfile,
  UnreadMessageCount,
  UserPaymentStats,
  UserProjectStats,
  UserRequestStats,
} from '@nestlancer/types';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { AxiosHeaders } from 'axios';

import { BaseService } from './base.service';
import { asPaginated, peelSuccessEnvelope } from '../utils/peel-success-envelope';
import { unwrapGatewayBody } from '../utils/unwrap-gateway-body';

export interface UserDashboardSummary {
  projects: UserProjectStats | null;
  requests: UserRequestStats | null;
  messages: UnreadMessageCount | null;
  payments: UserPaymentStats | null;
  notifications: {
    items: unknown[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  } | null;
  activity: {
    items: unknown[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  } | null;
  quotes: Record<string, unknown> | null;
  notificationsUnread: { unread: number } | null;
}

export class UsersService extends BaseService {
  constructor(client: AxiosInstance) {
    super(client);
  }

  async getProfile(options?: { accessToken?: string }): Promise<ApiUserProfile> {
    const bearer =
      options?.accessToken && options.accessToken.length > 0
        ? `Bearer ${options.accessToken}`
        : undefined;
    if (bearer) {
      const headers = new AxiosHeaders();
      headers.set('Authorization', bearer);
      const { data } = await this.client.get<unknown>('/users/profile', {
        headers,
        skipAuth: true,
      } as InternalAxiosRequestConfig & { skipAuth?: boolean });
      return unwrapGatewayBody<ApiUserProfile>(data);
    }
    const { data } = await this.client.get<unknown>('/users/profile');
    return unwrapGatewayBody<ApiUserProfile>(data);
  }

  async updateProfile(payload: Record<string, unknown>): Promise<ApiUserProfile> {
    const { data } = await this.client.patch<unknown>('/users/profile', payload);
    return unwrapGatewayBody<ApiUserProfile>(data);
  }

  async uploadAvatar(file: File): Promise<unknown> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await this.client.post<unknown>('/users/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return peelSuccessEnvelope(data);
  }

  async removeAvatar(): Promise<unknown> {
    const { data } = await this.client.delete<unknown>('/users/avatar');
    return peelSuccessEnvelope(data);
  }

  async getPreferences(): Promise<Record<string, unknown>> {
    const { data } = await this.client.get<unknown>('/users/preferences');
    return unwrapGatewayBody<Record<string, unknown>>(data);
  }

  async updatePreferences(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data } = await this.client.patch<unknown>('/users/preferences', payload);
    return unwrapGatewayBody<Record<string, unknown>>(data);
  }

  async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<unknown> {
    const { data } = await this.client.post<unknown>('/users/change-password', payload);
    return peelSuccessEnvelope(data);
  }

  async enable2FA(payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>('/users/2fa/enable', payload);
    return peelSuccessEnvelope(data);
  }

  async verify2FASetup(payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>('/users/2fa/verify', payload);
    return peelSuccessEnvelope(data);
  }

  async disable2FA(payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>('/users/2fa/disable', payload);
    return peelSuccessEnvelope(data);
  }

  async get2FAStatus(): Promise<unknown> {
    const { data } = await this.client.get<unknown>('/users/2fa/status');
    return peelSuccessEnvelope(data);
  }

  async getBackupCodes(): Promise<unknown> {
    const { data } = await this.client.get<unknown>('/users/2fa/backup-codes');
    return peelSuccessEnvelope(data);
  }

  async regenerateBackupCodes(payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>('/users/2fa/regenerate-codes', payload);
    return peelSuccessEnvelope(data);
  }

  async listSessions(): Promise<unknown> {
    const { data } = await this.client.get<unknown>('/users/sessions');
    return peelSuccessEnvelope(data);
  }

  async getSession(sessionId: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/users/sessions/${encodeURIComponent(sessionId)}`
    );
    return peelSuccessEnvelope(data);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.client.delete(`/users/sessions/${encodeURIComponent(sessionId)}`);
  }

  async terminateOtherSessions(): Promise<unknown> {
    const { data } = await this.client.post<unknown>('/users/sessions/terminate-others');
    return peelSuccessEnvelope(data);
  }

  async requestAccountDeletion(payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>('/users/delete-account', payload);
    return peelSuccessEnvelope(data);
  }

  async cancelDeletion(): Promise<unknown> {
    const { data } = await this.client.post<unknown>('/users/cancel-deletion');
    return peelSuccessEnvelope(data);
  }

  async getDashboardSummary(): Promise<UserDashboardSummary> {
    const { data } = await this.client.get<unknown>('/users/dashboard-summary');
    return unwrapGatewayBody<UserDashboardSummary>(data);
  }

  async getActivity(params?: { page?: number; limit?: number }): Promise<{
    items: unknown[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  }> {
    const { data } = await this.client.get<unknown>('/users/activity', { params });
    return asPaginated(data);
  }

  async requestDataExport(): Promise<unknown> {
    const { data } = await this.client.get<unknown>('/users/data-export');
    return peelSuccessEnvelope(data);
  }

  async requestDataExportAlias(): Promise<unknown> {
    const { data } = await this.client.get<unknown>('/users/export');
    return peelSuccessEnvelope(data);
  }

  async downloadDataExport(exportId: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/users/export/${encodeURIComponent(exportId)}`
    );
    return peelSuccessEnvelope(data);
  }
}
