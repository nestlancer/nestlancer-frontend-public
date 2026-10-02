import type { AxiosInstance } from 'axios';

import { BaseService } from './base.service';
import { peelSuccessEnvelope } from '../utils/peel-success-envelope';

export class ContactService extends BaseService {
  constructor(client: AxiosInstance) {
    super(client);
  }

  async submit(payload: { name: string; email: string; message: string }): Promise<void> {
    await this.client.post('/contact', payload);
  }

  async createInquiry(payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>('/contact/inquiries', payload);
    return peelSuccessEnvelope(data);
  }

  async listInquiries(params?: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.get<unknown>('/contact/inquiries', { params });
    return peelSuccessEnvelope(data);
  }

  async getInquiry(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/contact/inquiries/${encodeURIComponent(id)}`);
    return peelSuccessEnvelope(data);
  }

  async patchInquiry(id: string, payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(`/contact/inquiries/${encodeURIComponent(id)}`, payload);
    return peelSuccessEnvelope(data);
  }

  async deleteInquiry(id: string): Promise<void> {
    await this.client.delete(`/contact/inquiries/${encodeURIComponent(id)}`);
  }

  async respondInquiry(id: string, payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>(`/contact/inquiries/${encodeURIComponent(id)}/respond`, payload);
    return peelSuccessEnvelope(data);
  }
}
