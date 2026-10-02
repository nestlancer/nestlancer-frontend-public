import type { BlogListResult, PublicBlogPost } from '@nestlancer/types';
import type { AxiosInstance } from 'axios';
import { isAxiosError } from 'axios';

import { BaseService } from './base.service';
import { peelSuccessEnvelope } from '../utils/peel-success-envelope';
import { unwrapGatewayBody } from '../utils/unwrap-gateway-body';

export type BlogLikeResult = { liked?: boolean; likeCount?: number };
export type BlogViewResult = { recorded?: boolean; viewCount?: number; success?: boolean };
export type BlogEngagementResult = {
  liked: boolean;
  bookmarked: boolean;
  likeCount: number;
  viewCount: number;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function asLikeResult(raw: unknown): BlogLikeResult {
  const peeled = peelSuccessEnvelope(raw);
  return isRecord(peeled) ? (peeled as BlogLikeResult) : {};
}

function asViewResult(raw: unknown): BlogViewResult {
  const peeled = peelSuccessEnvelope(raw);
  return isRecord(peeled) ? (peeled as BlogViewResult) : {};
}

export class BlogService extends BaseService {
  constructor(client: AxiosInstance) {
    super(client);
  }

  async listPosts(params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    tag?: string;
  }): Promise<BlogListResult> {
    const { data } = await this.client.get<unknown>('/blog/posts', { params });
    return unwrapGatewayBody<BlogListResult>(data);
  }

  async searchPosts(params: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.get<unknown>('/blog/posts/search', { params });
    return peelSuccessEnvelope(data);
  }

  async getPostBySlug(slug: string): Promise<PublicBlogPost> {
    const { data } = await this.client.get<unknown>(`/blog/posts/${encodeURIComponent(slug)}`);
    return unwrapGatewayBody<PublicBlogPost>(data);
  }

  async getRelatedPosts(
    slug: string,
    limit = 5
  ): Promise<Pick<PublicBlogPost, 'id' | 'title' | 'slug' | 'excerpt' | 'publishedAt'>[]> {
    const { data } = await this.client.get<unknown>(
      `/blog/posts/${encodeURIComponent(slug)}/related`,
      {
        params: { limit },
      }
    );
    const inner = unwrapGatewayBody<{ data?: unknown } | unknown[]>(data);
    if (Array.isArray(inner))
      return inner as Pick<PublicBlogPost, 'id' | 'title' | 'slug' | 'excerpt' | 'publishedAt'>[];
    if (
      inner &&
      typeof inner === 'object' &&
      'data' in inner &&
      Array.isArray((inner as { data: unknown }).data)
    ) {
      return (
        inner as {
          data: Pick<PublicBlogPost, 'id' | 'title' | 'slug' | 'excerpt' | 'publishedAt'>[];
        }
      ).data;
    }
    return [];
  }

  async recordView(slug: string): Promise<BlogViewResult> {
    const { data } = await this.client.post<unknown>(
      `/blog/posts/${encodeURIComponent(slug)}/view`
    );
    return asViewResult(data);
  }

  /** Returns null when the engagement route is not deployed (404). */
  async getPostEngagement(slug: string): Promise<BlogEngagementResult | null> {
    try {
      const { data } = await this.client.get<unknown>(
        `/blog/posts/${encodeURIComponent(slug)}/engagement`
      );
      const peeled = peelSuccessEnvelope(data);
      if (!isRecord(peeled)) return null;
      return {
        liked: Boolean(peeled.liked),
        bookmarked: Boolean(peeled.bookmarked),
        likeCount: typeof peeled.likeCount === 'number' ? peeled.likeCount : 0,
        viewCount: typeof peeled.viewCount === 'number' ? peeled.viewCount : 0,
      };
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async listComments(slug: string, params?: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/blog/posts/${encodeURIComponent(slug)}/comments`,
      { params }
    );
    return peelSuccessEnvelope(data);
  }

  async postComment(slug: string, body: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/blog/posts/${encodeURIComponent(slug)}/comments`,
      body
    );
    return peelSuccessEnvelope(data);
  }

  async patchComment(
    slug: string,
    commentId: string,
    body: Record<string, unknown>
  ): Promise<unknown> {
    const path = `/blog/posts/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}`;
    try {
      const { data } = await this.client.put<unknown>(path, body);
      return peelSuccessEnvelope(data);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        const { data } = await this.client.patch<unknown>(path, body);
        return peelSuccessEnvelope(data);
      }
      throw error;
    }
  }

  async deleteComment(slug: string, commentId: string): Promise<void> {
    await this.client.delete(
      `/blog/posts/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}`
    );
  }

  async likePost(slug: string): Promise<BlogLikeResult> {
    const { data } = await this.client.post<unknown>(
      `/blog/posts/${encodeURIComponent(slug)}/like`
    );
    return asLikeResult(data);
  }

  async bookmarkPost(slug: string): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/blog/posts/${encodeURIComponent(slug)}/bookmark`
    );
    return peelSuccessEnvelope(data);
  }

  async getBookmarks(): Promise<unknown> {
    const { data } = await this.client.get<unknown>('/blog/bookmarks');
    return peelSuccessEnvelope(data);
  }

  async unbookmarkPost(slug: string): Promise<void> {
    await this.client.delete(`/blog/posts/${encodeURIComponent(slug)}/bookmark`);
  }

  async listCategories(): Promise<unknown> {
    const { data } = await this.client.get<unknown>('/blog/categories');
    return peelSuccessEnvelope(data);
  }
}
