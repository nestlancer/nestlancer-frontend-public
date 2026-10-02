import type { AxiosInstance } from 'axios';

import { BaseService } from './base.service';
import { peelSuccessEnvelope } from '../utils/peel-success-envelope';
import {
  extractDocumentUrl,
  extractDocumentVerify,
  extractDocumentVersions,
  type DocumentVerifyResult,
  type DocumentVersionRow,
} from '../utils/extract-document-url';

export class DocumentsService extends BaseService {
  constructor(client: AxiosInstance) {
    super(client);
  }

  /** Public — requires HMAC `t` query from the PDF verification URL. */
  async verify(documentNumber: string, token?: string): Promise<DocumentVerifyResult | null> {
    const { data } = await this.client.get<unknown>(
      `/documents/verify/${encodeURIComponent(documentNumber)}`,
      token ? { params: { t: token } } : undefined
    );
    return extractDocumentVerify(data);
  }

  async listQuoteVersions(quoteId: string): Promise<DocumentVersionRow[]> {
    const { data } = await this.client.get<unknown>(
      `/quotes/${encodeURIComponent(quoteId)}/documents/versions`
    );
    return extractDocumentVersions(data);
  }

  async getQuoteContractUrl(quoteId: string): Promise<string | null> {
    const { data } = await this.client.get<unknown>(
      `/quotes/${encodeURIComponent(quoteId)}/contract`
    );
    return extractDocumentUrl(data);
  }

  async getQuoteContractPreviewUrl(quoteId: string): Promise<string | null> {
    const { data } = await this.client.get<unknown>(
      `/quotes/${encodeURIComponent(quoteId)}/contract/preview`
    );
    return extractDocumentUrl(data);
  }

  async listPaymentVersions(paymentId: string): Promise<DocumentVersionRow[]> {
    const { data } = await this.client.get<unknown>(
      `/payments/${encodeURIComponent(paymentId)}/documents/versions`
    );
    return extractDocumentVersions(data);
  }

  async listAdminQuoteVersions(quoteId: string): Promise<DocumentVersionRow[]> {
    const { data } = await this.client.get<unknown>(
      `/admin/quotes/${encodeURIComponent(quoteId)}/documents/versions`
    );
    return extractDocumentVersions(data);
  }

  async listAdminPaymentVersions(paymentId: string): Promise<DocumentVersionRow[]> {
    const { data } = await this.client.get<unknown>(
      `/admin/payments/${encodeURIComponent(paymentId)}/documents/versions`
    );
    return extractDocumentVersions(data);
  }

  async getAdminDocumentDownloadUrl(documentId: string): Promise<string | null> {
    const { data } = await this.client.get<unknown>(
      `/admin/documents/${encodeURIComponent(documentId)}/download`
    );
    return extractDocumentUrl(data);
  }

  async listMine(params?: {
    page?: number;
    limit?: number;
    latestOnly?: boolean;
  }): Promise<unknown> {
    const { data } = await this.client.get<unknown>('/documents/mine', { params });
    return peelSuccessEnvelope(data);
  }

  async downloadMine(documentId: string): Promise<string | null> {
    const { data } = await this.client.get<unknown>(
      `/documents/mine/${encodeURIComponent(documentId)}/download`
    );
    return extractDocumentUrl(data);
  }

  async listForUser(
    userId: string,
    params?: { page?: number; limit?: number; latestOnly?: boolean }
  ): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/documents/users/${encodeURIComponent(userId)}`,
      { params }
    );
    return peelSuccessEnvelope(data);
  }
}
