import type { AxiosInstance } from 'axios';

import { BaseService } from './base.service';
import { peelSuccessEnvelope } from '../utils/peel-success-envelope';
import { unwrapGatewayBody } from '../utils/unwrap-gateway-body';

export type AdminMediaListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  fileType?: string;
  uploaderId?: string;
  relatedToUserId?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
  contextType?: string;
  sort?: string;
  /** When true, fetches presigned S3 URLs (expensive). Default false in storage browser. */
  includeUrls?: boolean;
};

export type AdminMediaBrowseFolder = {
  id: string;
  type: 'bucket' | 'user' | 'category' | 'context';
  label: string;
  description?: string;
  count: number;
  totalSize: number;
  fileType?: string;
  contextType?: string;
};

export type AdminMediaBrowseResponse = {
  scope: Record<string, unknown>;
  breadcrumbs: Array<{ id: string; label: string; path: string }>;
  folders: AdminMediaBrowseFolder[];
};

export type AdminMediaMetadataPatch = {
  filename?: string;
  description?: string;
  customMetadata?: Record<string, string>;
  visibility?: 'PRIVATE' | 'PUBLIC';
  originalFilename?: string;
  metadataPatch?: Record<string, unknown>;
};

export class MediaAdminService extends BaseService {
  constructor(client: AxiosInstance) {
    super(client);
  }

  async list(params?: AdminMediaListParams): Promise<unknown> {
    const { includeUrls, ...rest } = params ?? {};
    const { data } = await this.client.get<unknown>('/admin/media', {
      params: {
        ...rest,
        ...(includeUrls ? { includeUrls: 'true' } : {}),
      },
    });
    return peelSuccessEnvelope(data);
  }

  async browse(params?: {
    visibility?: 'PUBLIC' | 'PRIVATE';
    uploaderId?: string;
    search?: string;
  }): Promise<AdminMediaBrowseResponse> {
    const { data } = await this.client.get<unknown>('/admin/media/browse', { params });
    return unwrapGatewayBody<AdminMediaBrowseResponse>(data);
  }

  async listQuarantined(params?: AdminMediaListParams): Promise<unknown> {
    try {
      const { data } = await this.client.get<unknown>('/admin/media/quarantine', { params });
      return peelSuccessEnvelope(data);
    } catch (error: unknown) {
      const status =
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'status' in error.response
          ? (error.response as { status?: number }).status
          : undefined;
      if (status !== 404) {
        throw error;
      }
      const { data } = await this.client.get<unknown>('/admin/media', {
        params: { ...params, status: 'QUARANTINED' },
      });
      return peelSuccessEnvelope(data);
    }
  }

  async getById(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/admin/media/${encodeURIComponent(id)}`);
    return unwrapGatewayBody(data);
  }

  async getReferences(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/media/${encodeURIComponent(id)}/references`
    );
    return unwrapGatewayBody(data);
  }

  async getShares(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/admin/media/${encodeURIComponent(id)}/shares`
    );
    return peelSuccessEnvelope(data);
  }

  async patchMetadata(id: string, payload: AdminMediaMetadataPatch): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(
      `/admin/media/${encodeURIComponent(id)}`,
      payload
    );
    return peelSuccessEnvelope(data);
  }

  async replace(
    id: string,
    file: File,
    options?: { onUploadProgress?: (percent: number) => void; force?: boolean }
  ): Promise<unknown> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await this.client.post<unknown>(
      `/admin/media/${encodeURIComponent(id)}/replace`,
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: options?.force ? { force: true } : undefined,
        onUploadProgress: options?.onUploadProgress
          ? (event) => {
              const total = event.total ?? file.size;
              if (total > 0) {
                options.onUploadProgress!(Math.round((event.loaded * 100) / total));
              }
            }
          : undefined,
      }
    );
    return peelSuccessEnvelope(data);
  }

  async bulkDelete(ids: string[], force?: boolean): Promise<unknown> {
    const { data } = await this.client.post<unknown>('/admin/media/bulk-delete', {
      ids,
      ...(force ? { force: true } : {}),
    });
    return peelSuccessEnvelope(data);
  }

  async cleanup(dryRun = false): Promise<unknown> {
    const { data } = await this.client.post<unknown>('/admin/media/cleanup', null, {
      params: { dryRun: dryRun ? 'true' : 'false' },
    });
    return peelSuccessEnvelope(data);
  }

  async backfillContext(): Promise<{ updated?: number }> {
    const { data } = await this.client.post<unknown>('/admin/media/backfill-context', {});
    return peelSuccessEnvelope(data) as { updated?: number };
  }

  async reprocess(id: string): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/media/${encodeURIComponent(id)}/reprocess`,
      {}
    );
    return peelSuccessEnvelope(data);
  }

  async releaseQuarantined(id: string): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/media/quarantine/${encodeURIComponent(id)}/release`,
      {}
    );
    return peelSuccessEnvelope(data);
  }

  async deleteQuarantined(id: string): Promise<void> {
    await this.client.delete(`/admin/media/quarantine/${encodeURIComponent(id)}`);
  }

  async deleteMedia(id: string, force?: boolean): Promise<void> {
    await this.client.delete(`/admin/media/${encodeURIComponent(id)}`, {
      params: force ? { force: 'true' } : undefined,
    });
  }

  async getAnalytics(): Promise<unknown> {
    const { data } = await this.client.get<unknown>('/admin/media/analytics');
    return unwrapGatewayBody(data);
  }

  async downloadUrl(id: string): Promise<string | null> {
    const { data } = await this.client.get<unknown>(
      `/admin/media/${encodeURIComponent(id)}/download`
    );
    const inner = unwrapGatewayBody<{ downloadUrl?: string; url?: string }>(data);
    return inner?.downloadUrl ?? inner?.url ?? null;
  }

  async createShare(
    id: string,
    payload: {
      purpose: string;
      expiresInSeconds: number;
      password?: string;
      allowedEmails?: string[];
    }
  ): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/admin/media/${encodeURIComponent(id)}/share`,
      payload
    );
    return peelSuccessEnvelope(data);
  }

  async revokeShare(id: string): Promise<unknown> {
    const { data } = await this.client.delete<unknown>(
      `/admin/media/${encodeURIComponent(id)}/share`
    );
    return peelSuccessEnvelope(data);
  }

  async revokeShareById(mediaId: string, shareLinkId: string): Promise<unknown> {
    const { data } = await this.client.delete<unknown>(
      `/admin/media/${encodeURIComponent(mediaId)}/shares/${encodeURIComponent(shareLinkId)}`
    );
    return peelSuccessEnvelope(data);
  }
}
