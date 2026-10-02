import type { AxiosInstance } from 'axios';

import { BaseService } from './base.service';
import { peelSuccessEnvelope } from '../utils/peel-success-envelope';
import { unwrapGatewayBody } from '../utils/unwrap-gateway-body';

export class ProgressService extends BaseService {
  constructor(client: AxiosInstance) {
    super(client);
  }

  async getProjectTimeline(projectId: string, params?: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/progress/projects/${encodeURIComponent(projectId)}`, {
      params,
    });
    return peelSuccessEnvelope(data);
  }

  async createProjectEntry(projectId: string, body: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/progress/projects/${encodeURIComponent(projectId)}`,
      body
    );
    return peelSuccessEnvelope(data);
  }

  async getProjectStatus(projectId: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/progress/projects/${encodeURIComponent(projectId)}/status`
    );
    return unwrapGatewayBody(data);
  }

  async getProjectMilestones(projectId: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/progress/projects/${encodeURIComponent(projectId)}/milestones`
    );
    return unwrapGatewayBody(data);
  }

  async requestProjectChanges(projectId: string, body: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/progress/projects/${encodeURIComponent(projectId)}/request-changes`,
      body
    );
    return peelSuccessEnvelope(data);
  }

  async getEntry(projectId: string, entryId: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/progress/projects/${encodeURIComponent(projectId)}/${encodeURIComponent(entryId)}`
    );
    return unwrapGatewayBody(data);
  }

  async approveMilestone(milestoneId: string, body?: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/progress/milestones/${encodeURIComponent(milestoneId)}/approve`,
      body ?? {},
    );
    return peelSuccessEnvelope(data);
  }

  async requestMilestoneRevision(
    milestoneId: string,
    body: { reason: string },
  ): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/progress/milestones/${encodeURIComponent(milestoneId)}/request-revision`,
      body,
    );
    return peelSuccessEnvelope(data);
  }

  async approveDeliverable(
    deliverableId: string,
    body: Record<string, unknown> = {},
  ): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/progress/deliverables/${encodeURIComponent(deliverableId)}/approve`,
      body,
    );
    return peelSuccessEnvelope(data);
  }

  async rejectDeliverable(
    deliverableId: string,
    body: { reason: string },
  ): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/progress/deliverables/${encodeURIComponent(deliverableId)}/reject`,
      body,
    );
    return peelSuccessEnvelope(data);
  }
}
