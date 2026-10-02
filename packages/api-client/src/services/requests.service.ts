import type {
  CreateRequestPayload,
  PaginatedResponse,
  ProjectRequestSummary,
  RequestDetail,
  UserRequestStats,
} from '@nestlancer/types';
import type { AxiosInstance } from 'axios';

import { BaseService } from './base.service';
import { asPaginated, peelSuccessEnvelope } from '../utils/peel-success-envelope';
import { unwrapGatewayBody } from '../utils/unwrap-gateway-body';

/**
 * @deprecated Prefer Orval hooks from `@nestlancer/api-client` (see `apps/web/src/features/requests/hooks/useRequestsApi.ts`).
 */
export class RequestsService extends BaseService {
  constructor(client: AxiosInstance) {
    super(client);
  }

  async getStats(): Promise<UserRequestStats> {
    const { data } = await this.client.get<unknown>('/requests/stats');
    return unwrapGatewayBody<UserRequestStats>(data);
  }

  async list(params?: {
    page?: number;
    limit?: number;
    status?: string;
    q?: string;
  }): Promise<PaginatedResponse<ProjectRequestSummary>> {
    const { data } = await this.client.get<unknown>('/requests', { params });
    return asPaginated<ProjectRequestSummary>(unwrapGatewayBody(data));
  }

  async create(payload: CreateRequestPayload): Promise<unknown> {
    const { data } = await this.client.post<unknown>('/requests', payload);
    return peelSuccessEnvelope(data);
  }

  async getById(id: string): Promise<RequestDetail> {
    const { data } = await this.client.get<unknown>(`/requests/${encodeURIComponent(id)}`);
    return unwrapGatewayBody<RequestDetail>(data);
  }

  async update(id: string, payload: Partial<CreateRequestPayload>): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/requests/${encodeURIComponent(id)}`,
      payload
    );
    return peelSuccessEnvelope(data);
  }

  async remove(id: string): Promise<void> {
    await this.client.delete(`/requests/${encodeURIComponent(id)}`);
  }

  async submit(id: string): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/requests/${encodeURIComponent(id)}/submit`);
    return peelSuccessEnvelope(data);
  }

  async getStatusTimeline(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/requests/${encodeURIComponent(id)}/status`);
    return peelSuccessEnvelope(data);
  }

  async getQuotesForRequest(id: string): Promise<{ requestId: string; quotes: unknown[] }> {
    const { data } = await this.client.get<unknown>(`/requests/${encodeURIComponent(id)}/quotes`);
    const peeled = peelSuccessEnvelope(data) as { requestId?: string; quotes?: unknown[] };
    return {
      requestId: String(peeled.requestId ?? id),
      quotes: Array.isArray(peeled.quotes) ? peeled.quotes : [],
    };
  }

  async getAttachments(id: string): Promise<unknown[]> {
    const { data } = await this.client.get<unknown>(
      `/requests/${encodeURIComponent(id)}/attachments`
    );
    const inner = peelSuccessEnvelope(data);
    return Array.isArray(inner) ? inner : [];
  }

  async addAttachment(id: string, file: File): Promise<unknown> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await this.client.post<unknown>(
      `/requests/${encodeURIComponent(id)}/attachments`,
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return peelSuccessEnvelope(data);
  }

  async removeAttachment(id: string, attachmentId: string): Promise<void> {
    await this.client.delete(
      `/requests/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attachmentId)}`
    );
  }

  async getAttachmentDownloadUrl(requestId: string, attachmentId: string): Promise<string | null> {
    const { data } = await this.client.get<unknown>(
      `/requests/${encodeURIComponent(requestId)}/attachments/${encodeURIComponent(attachmentId)}/download`
    );
    const inner = unwrapGatewayBody<{ downloadUrl?: string; url?: string }>(data);
    return inner?.downloadUrl ?? inner?.url ?? null;
  }

  async getAdminAttachmentDownloadUrl(
    requestId: string,
    attachmentId: string
  ): Promise<string | null> {
    const { data } = await this.client.get<unknown>(
      `/admin/requests/${encodeURIComponent(requestId)}/attachments/${encodeURIComponent(attachmentId)}/download`
    );
    const inner = unwrapGatewayBody<{ downloadUrl?: string; url?: string }>(data);
    return inner?.downloadUrl ?? inner?.url ?? null;
  }
}
