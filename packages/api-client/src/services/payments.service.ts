import type { PaginatedResponse, Payment, UserPaymentStats } from '@nestlancer/types';
import type { AxiosInstance } from 'axios';

import { BaseService } from './base.service';
import { extractDocumentUrl } from '../utils/extract-document-url';
import { parsePaymentIntentResult } from '../utils/parse-payment-intent';
import { asPaginated, peelSuccessEnvelope } from '../utils/peel-success-envelope';
import { unwrapGatewayBody } from '../utils/unwrap-gateway-body';

export class PaymentsService extends BaseService {
  constructor(client: AxiosInstance) {
    super(client);
  }

  async getStats(): Promise<UserPaymentStats> {
    const { data } = await this.client.get<unknown>('/payments/stats');
    return unwrapGatewayBody<UserPaymentStats>(data);
  }

  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<Payment>> {
    const { data } = await this.client.get<unknown>('/payments', { params });
    return asPaginated<Payment>(data);
  }

  async getById(id: string): Promise<Payment> {
    const { data } = await this.client.get<unknown>(`/payments/${encodeURIComponent(id)}`);
    return unwrapGatewayBody<Payment>(data);
  }

  async getStatus(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/payments/${encodeURIComponent(id)}/status`);
    return peelSuccessEnvelope(data);
  }

  async listByProject(projectId: string): Promise<Payment[]> {
    const { data } = await this.client.get<unknown>(
      `/payments/projects/${encodeURIComponent(projectId)}`
    );
    const peeled = peelSuccessEnvelope(data);
    if (Array.isArray(peeled)) return peeled as Payment[];
    if (peeled && typeof peeled === 'object') {
      const o = peeled as Record<string, unknown>;
      if (Array.isArray(o.data)) return o.data as Payment[];
      if (Array.isArray(o.items)) return o.items as Payment[];
    }
    return [];
  }

  async listMilestonesByProject(projectId: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/payments/projects/${encodeURIComponent(projectId)}/milestones`
    );
    return peelSuccessEnvelope(data);
  }

  async listMethods(): Promise<unknown[]> {
    const { data } = await this.client.get<unknown>('/payments/methods');
    const inner = peelSuccessEnvelope(data);
    return Array.isArray(inner) ? inner : [];
  }

  async addMethod(payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>('/payments/methods', payload);
    return peelSuccessEnvelope(data);
  }

  async deleteMethod(id: string): Promise<void> {
    await this.client.delete(`/payments/methods/${encodeURIComponent(id)}`);
  }

  async setDefaultMethod(id: string): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/payments/methods/${encodeURIComponent(id)}/default`
    );
    return peelSuccessEnvelope(data);
  }

  async updateMethodNickname(id: string, nickname: string): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/payments/methods/${encodeURIComponent(id)}/nickname`,
      { nickname }
    );
    return peelSuccessEnvelope(data);
  }

  async createIntent(payload: Record<string, unknown>) {
    const { data } = await this.client.post<unknown>('/payments/create-intent', payload);
    return parsePaymentIntentResult(data);
  }

  async listPlatformAccounts(): Promise<
    Array<{
      id: string;
      label: string;
      type: string;
      accountHolderName?: string | null;
      bankName?: string | null;
      accountNumber?: string | null;
      ifsc?: string | null;
      accountType?: string | null;
      upiVpa?: string | null;
      instructions?: string | null;
      currency?: string;
      isPrimary?: boolean;
      sortOrder?: number;
    }>
  > {
    const { data } = await this.client.get<unknown>('/payments/platform-accounts');
    const inner = peelSuccessEnvelope(data);
    if (Array.isArray(inner)) return inner as never;
    if (inner && typeof inner === 'object' && Array.isArray((inner as { data?: unknown }).data)) {
      return (inner as { data: never[] }).data;
    }
    return [];
  }

  async submitBankTransfer(payload: {
    projectId: string;
    milestoneId: string;
    amount: number;
    platformAccountId: string;
    transferReference: string;
    transferPaidAt?: string;
    mediaIds: string[];
    notes?: string;
  }): Promise<unknown> {
    const { data } = await this.client.post<unknown>('/payments/bank-transfer/submit', payload);
    return peelSuccessEnvelope(data);
  }

  async initiate(payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>('/payments/initiate', payload);
    return peelSuccessEnvelope(data);
  }

  async confirm(payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>('/payments/confirm', payload);
    return peelSuccessEnvelope(data);
  }

  async cancel(id: string): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/payments/${encodeURIComponent(id)}/cancel`);
    return peelSuccessEnvelope(data);
  }

  async fileDispute(id: string, body: { reason: string; description: string }): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/payments/${encodeURIComponent(id)}/dispute`,
      body
    );
    return peelSuccessEnvelope(data);
  }

  async getReceiptUrl(id: string): Promise<string | null> {
    const { data } = await this.client.get<unknown>(`/payments/${encodeURIComponent(id)}/receipt`);
    return extractDocumentUrl(data);
  }

  async getInvoiceUrl(id: string): Promise<string | null> {
    const { data } = await this.client.get<unknown>(`/payments/${encodeURIComponent(id)}/invoice`);
    return extractDocumentUrl(data);
  }
}
