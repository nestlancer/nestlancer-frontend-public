import type { Project, ProjectSummary, UserProjectStats } from '@nestlancer/types';
import type { AxiosInstance } from 'axios';

import { BaseService } from './base.service';
import { asArray, peelSuccessEnvelope } from '../utils/peel-success-envelope';
import { unwrapGatewayBody } from '../utils/unwrap-gateway-body';

export class ProjectsService extends BaseService {
  constructor(client: AxiosInstance) {
    super(client);
  }

  async getStats(): Promise<UserProjectStats> {
    const { data } = await this.client.get<unknown>('/projects/stats');
    return unwrapGatewayBody<UserProjectStats>(data);
  }

  async list(): Promise<ProjectSummary[]> {
    const { data } = await this.client.get<unknown>('/projects');
    return asArray<ProjectSummary>(data);
  }

  async getById(id: string): Promise<Project> {
    const { data } = await this.client.get<unknown>(`/projects/${encodeURIComponent(id)}`);
    return unwrapGatewayBody<Project>(data);
  }

  /** Poll after quote accept until async project creation completes. */
  async getByQuoteId(quoteId: string): Promise<{ projectId: string; status: string } | null> {
    try {
      const { data } = await this.client.get<unknown>(
        `/projects/by-quote/${encodeURIComponent(quoteId)}`
      );
      const body = unwrapGatewayBody<{ projectId?: string; status?: string; error?: unknown }>(
        data
      );
      if (body && typeof body === 'object' && 'error' in body && body.error) return null;
      if (body?.projectId) return { projectId: body.projectId, status: String(body.status ?? '') };
      return null;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) return null;
      throw err;
    }
  }

  async getTimeline(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/projects/${encodeURIComponent(id)}/timeline`);
    return peelSuccessEnvelope(data);
  }

  async getDeliverables(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/projects/${encodeURIComponent(id)}/deliverables`
    );
    return peelSuccessEnvelope(data);
  }

  async getPayments(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/projects/${encodeURIComponent(id)}/payments`);
    return peelSuccessEnvelope(data);
  }

  async getProgress(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/projects/${encodeURIComponent(id)}/progress`);
    return peelSuccessEnvelope(data);
  }

  async getMilestones(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/projects/${encodeURIComponent(id)}/milestones`
    );
    return peelSuccessEnvelope(data);
  }

  async getMessages(id: string, params?: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/projects/${encodeURIComponent(id)}/messages`,
      {
        params,
      }
    );
    return peelSuccessEnvelope(data);
  }

  async sendProjectScopedMessage(id: string, payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/projects/${encodeURIComponent(id)}/messages`,
      payload
    );
    return peelSuccessEnvelope(data);
  }

  async approve(id: string, payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/projects/${encodeURIComponent(id)}/approve`,
      payload
    );
    return peelSuccessEnvelope(data);
  }

  async requestRevision(id: string, payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/projects/${encodeURIComponent(id)}/request-revision`,
      payload
    );
    return peelSuccessEnvelope(data);
  }

  async submitFeedback(id: string, payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/projects/${encodeURIComponent(id)}/feedback`,
      payload
    );
    return peelSuccessEnvelope(data);
  }

  async getFeedback(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/projects/${encodeURIComponent(id)}/feedback`);
    return peelSuccessEnvelope(data);
  }

  async listPublic(params?: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.get<unknown>('/projects/public', { params });
    return peelSuccessEnvelope(data);
  }

  async getPublicDetails(publicId: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/projects/public/${encodeURIComponent(publicId)}`
    );
    return peelSuccessEnvelope(data);
  }
}
