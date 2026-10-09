import type { PaginatedResponse, Quote } from '@nestlancer/types';
import type { AxiosInstance } from 'axios';

import { BaseService } from './base.service';
import { extractDocumentUrl } from '../utils/extract-document-url';
import { withIdempotencyHeaders } from '../utils/idempotency-key';
import { asPaginated, peelSuccessEnvelope } from '../utils/peel-success-envelope';
import { unwrapGatewayBody } from '../utils/unwrap-gateway-body';

export type QuotePdfDownload = {
  quoteId: string;
  documentNumber: string;
  version: number;
  downloadUrl: string;
  expiresIn?: number;
};

/**
 * @deprecated Prefer Orval hooks from `@nestlancer/api-client` (see `apps/web/src/features/quotes/hooks/useQuotesApi.ts`).
 */
export class QuotesService extends BaseService {
  constructor(client: AxiosInstance) {
    super(client);
  }

  async list(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<Quote>> {
    const { data } = await this.client.get<unknown>('/quotes', { params });
    return asPaginated<Quote>(unwrapGatewayBody(data));
  }

  async getStats(): Promise<Record<string, unknown>> {
    const { data } = await this.client.get<unknown>('/quotes/stats');
    return unwrapGatewayBody<Record<string, unknown>>(data);
  }

  async getById(id: string): Promise<Quote> {
    const { data } = await this.client.get<unknown>(`/quotes/${encodeURIComponent(id)}`);
    return unwrapGatewayBody<Quote>(data);
  }

  async accept(id: string, body?: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/quotes/${encodeURIComponent(id)}/accept`,
      body ?? {},
      withIdempotencyHeaders(`quote-accept-${id}`)
    );
    return peelSuccessEnvelope(data);
  }

  async decline(id: string, body?: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/quotes/${encodeURIComponent(id)}/decline`,
      body ?? {},
      withIdempotencyHeaders(`quote-decline-${id}`)
    );
    return peelSuccessEnvelope(data);
  }

  async requestChanges(id: string, body: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/quotes/${encodeURIComponent(id)}/request-changes`,
      body
    );
    return peelSuccessEnvelope(data);
  }

  async getPdfDownloadUrl(id: string): Promise<QuotePdfDownload | null> {
    const { data } = await this.client.get<unknown>(`/quotes/${encodeURIComponent(id)}/pdf`);
    const inner = unwrapGatewayBody<QuotePdfDownload>(data);
    if (inner?.downloadUrl) return inner;
    const url = extractDocumentUrl(data);
    if (!url) return null;
    return {
      quoteId: id,
      documentNumber: String((inner as QuotePdfDownload | undefined)?.documentNumber ?? ''),
      version: Number((inner as QuotePdfDownload | undefined)?.version ?? 1),
      downloadUrl: url,
    };
  }

  /** @deprecated Quote PDFs are presigned URLs — use getPdfDownloadUrl(). */
  async getPdfBlob(id: string): Promise<Blob> {
    const meta = await this.getPdfDownloadUrl(id);
    if (!meta?.downloadUrl) throw new Error('PDF not available');
    const res = await fetch(meta.downloadUrl);
    if (!res.ok) throw new Error('PDF download failed');
    return res.blob();
  }

  /** @deprecated Use list() directly — it now returns a PaginatedResponse. */
  async listPaginated(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Quote>> {
    return this.list(params);
  }
}
