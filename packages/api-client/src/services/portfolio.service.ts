import type {
  PortfolioListResult,
  PortfolioTimelineResult,
  PublicPortfolioItem,
} from '@nestlancer/types';
import type { AxiosInstance } from 'axios';

import { BaseService } from './base.service';
import { peelSuccessEnvelope } from '../utils/peel-success-envelope';
import { unwrapGatewayBody } from '../utils/unwrap-gateway-body';

export type PortfolioLikeResult = { liked?: boolean; likeCount?: number };
export type PortfolioViewResult = { recorded?: boolean; viewCount?: number; success?: boolean };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function asLikeResult(raw: unknown): PortfolioLikeResult {
  const peeled = peelSuccessEnvelope(raw);
  return isRecord(peeled) ? (peeled as PortfolioLikeResult) : {};
}

function asViewResult(raw: unknown): PortfolioViewResult {
  const peeled = peelSuccessEnvelope(raw);
  return isRecord(peeled) ? (peeled as PortfolioViewResult) : {};
}

export class PortfolioService extends BaseService {
  constructor(client: AxiosInstance) {
    super(client);
  }

  async listPublished(params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
  }): Promise<PortfolioListResult> {
    const { data } = await this.client.get<unknown>('/portfolio', { params });
    return unwrapGatewayBody<PortfolioListResult>(data);
  }

  async getTimeline(): Promise<PortfolioTimelineResult> {
    const { data } = await this.client.get<unknown>('/portfolio/timeline');
    return unwrapGatewayBody<PortfolioTimelineResult>(data);
  }

  async search(params: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.get<unknown>('/portfolio/search', { params });
    return peelSuccessEnvelope(data);
  }

  async getFeatured(): Promise<PublicPortfolioItem[]> {
    const { data } = await this.client.get<unknown>('/portfolio/featured');
    return unwrapGatewayBody<PublicPortfolioItem[]>(data);
  }

  async listCategories(): Promise<unknown> {
    const { data } = await this.client.get<unknown>('/portfolio/categories');
    return peelSuccessEnvelope(data);
  }

  async listTags(): Promise<unknown> {
    const { data } = await this.client.get<unknown>('/portfolio/tags');
    return peelSuccessEnvelope(data);
  }

  async getByIdOrSlug(idOrSlug: string): Promise<PublicPortfolioItem> {
    const { data } = await this.client.get<unknown>(`/portfolio/${encodeURIComponent(idOrSlug)}`);
    return unwrapGatewayBody<PublicPortfolioItem>(data);
  }

  async recordView(idOrSlug: string): Promise<PortfolioViewResult> {
    const { data } = await this.client.post<unknown>(
      `/portfolio/${encodeURIComponent(idOrSlug)}/view`
    );
    return asViewResult(data);
  }

  async like(idOrSlug: string): Promise<PortfolioLikeResult> {
    const { data } = await this.client.post<unknown>(
      `/portfolio/${encodeURIComponent(idOrSlug)}/like`
    );
    return asLikeResult(data);
  }
}
