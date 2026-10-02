import type { PaginatedResponse } from '@nestlancer/types';
import type { AxiosInstance } from 'axios';

import { BaseService } from './base.service';
import { extractDocumentUrl } from '../utils/extract-document-url';
import { asPaginated, peelSuccessEnvelope } from '../utils/peel-success-envelope';
import { unwrapGatewayBody } from '../utils/unwrap-gateway-body';

export type InvoiceSummary = {
  id: string;
  invoiceNumber?: string | null;
  documentNumber?: string | null;
  amount?: number;
  currency?: string;
  status?: string;
  /** True when installment is due under milestone payment rules (NL-PAY-010). */
  canPay?: boolean;
  issuedAt?: string;
  paymentId?: string;
  projectTitle?: string;
};

export class InvoicesService extends BaseService {
  constructor(client: AxiosInstance) {
    super(client);
  }

  async list(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<InvoiceSummary>> {
    const { data } = await this.client.get<unknown>('/invoices', {
      params: {
        page: params?.page,
        limit: params?.limit,
        status: params?.status,
      },
    });
    return asPaginated<InvoiceSummary>(unwrapGatewayBody(data));
  }

  async getById(id: string): Promise<InvoiceSummary> {
    const { data } = await this.client.get<unknown>(`/invoices/${encodeURIComponent(id)}`);
    return unwrapGatewayBody<InvoiceSummary>(data);
  }

  async getDownloadUrl(id: string): Promise<string | null> {
    const { data } = await this.client.get<unknown>(`/invoices/${encodeURIComponent(id)}/download`);
    return extractDocumentUrl(data);
  }

  async getDetailRaw(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/invoices/${encodeURIComponent(id)}`);
    return peelSuccessEnvelope(data);
  }
}
