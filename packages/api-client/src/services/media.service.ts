import type { AxiosInstance } from 'axios';

import { BaseService } from './base.service';
import { peelSuccessEnvelope } from '../utils/peel-success-envelope';
import { unwrapGatewayBody } from '../utils/unwrap-gateway-body';

export class MediaService extends BaseService {
  constructor(client: AxiosInstance) {
    super(client);
  }

  async list(params?: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.get<unknown>('/media', { params });
    return peelSuccessEnvelope(data);
  }

  async requestUpload(payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>('/media/upload/request', payload);
    return peelSuccessEnvelope(data);
  }

  async confirmUpload(payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>('/media/upload/confirm', payload);
    return peelSuccessEnvelope(data);
  }

  async directUpload(
    file: File,
    options?: { fileType?: string; projectId?: string; threadId?: string; messageId?: string }
  ): Promise<unknown> {
    const form = new FormData();
    form.append('file', file);
    if (options?.fileType) form.append('fileType', options.fileType);
    if (options?.projectId) form.append('projectId', options.projectId);
    if (options?.threadId) form.append('threadId', options.threadId);
    if (options?.messageId) form.append('messageId', options.messageId);
    const { data } = await this.client.post<unknown>('/media/upload/direct', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return peelSuccessEnvelope(data);
  }

  async storageStats(): Promise<unknown> {
    const { data } = await this.client.get<unknown>('/media/storage-usage');
    return unwrapGatewayBody(data);
  }

  async initChunkedUpload(payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>('/media/upload/chunked/init', payload);
    return peelSuccessEnvelope(data);
  }

  async uploadChunk(
    uploadId: string,
    chunk: FormData | Blob,
    headers?: Record<string, string>
  ): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/media/upload/chunked/${encodeURIComponent(uploadId)}/part`,
      chunk,
      { headers }
    );
    return peelSuccessEnvelope(data);
  }

  async completeChunkedUpload(
    uploadId: string,
    payload?: Record<string, unknown>
  ): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/media/upload/chunked/${encodeURIComponent(uploadId)}/complete`,
      payload ?? {}
    );
    return peelSuccessEnvelope(data);
  }

  async getById(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/media/${encodeURIComponent(id)}`);
    return unwrapGatewayBody(data);
  }

  async patch(id: string, payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.patch<unknown>(`/media/${encodeURIComponent(id)}`, payload);
    return peelSuccessEnvelope(data);
  }

  async remove(id: string): Promise<void> {
    await this.client.delete(`/media/${encodeURIComponent(id)}`);
  }

  async downloadUrl(id: string): Promise<string | null> {
    const { data } = await this.client.get<unknown>(`/media/${encodeURIComponent(id)}/download`);
    const inner = unwrapGatewayBody<{ downloadUrl?: string; url?: string }>(data);
    return inner?.downloadUrl ?? inner?.url ?? null;
  }

  async copy(id: string, payload?: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/media/${encodeURIComponent(id)}/copy`,
      payload ?? {}
    );
    return peelSuccessEnvelope(data);
  }

  async move(id: string, payload: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/media/${encodeURIComponent(id)}/move`,
      payload
    );
    return peelSuccessEnvelope(data);
  }

  async regenerateThumbnail(id: string): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/media/${encodeURIComponent(id)}/regenerate-thumbnail`
    );
    return peelSuccessEnvelope(data);
  }

  async versions(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/media/${encodeURIComponent(id)}/versions`);
    return peelSuccessEnvelope(data);
  }

  async share(
    id: string,
    payload: {
      purpose: string;
      expiresInSeconds: number;
      password?: string;
      allowedEmails?: string[];
    }
  ): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/media/${encodeURIComponent(id)}/share`,
      payload
    );
    return peelSuccessEnvelope(data);
  }

  async revokeShare(id: string): Promise<unknown> {
    const { data } = await this.client.delete<unknown>(`/media/${encodeURIComponent(id)}/share`);
    return peelSuccessEnvelope(data);
  }

  async revokeShareById(mediaId: string, shareLinkId: string): Promise<unknown> {
    const { data } = await this.client.delete<unknown>(
      `/media/${encodeURIComponent(mediaId)}/shares/${encodeURIComponent(shareLinkId)}`
    );
    return peelSuccessEnvelope(data);
  }

  async shares(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/media/${encodeURIComponent(id)}/shares`);
    return peelSuccessEnvelope(data);
  }

  async listShared(): Promise<unknown> {
    const { data } = await this.client.get<unknown>('/media/shared');
    return peelSuccessEnvelope(data);
  }

  async getProcessingStatus(id: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(`/media/${encodeURIComponent(id)}/status`);
    return unwrapGatewayBody(data);
  }

  async recordChunkPart(
    uploadId: string,
    payload: { partNumber: number; etag: string }
  ): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/media/upload/chunked/${encodeURIComponent(uploadId)}/part`,
      payload
    );
    return peelSuccessEnvelope(data);
  }

  async getChunkedUploadStatus(uploadId: string): Promise<unknown> {
    const { data } = await this.client.get<unknown>(
      `/media/upload/chunked/${encodeURIComponent(uploadId)}/status`
    );
    return peelSuccessEnvelope(data);
  }

  async abortChunkedUpload(uploadId: string): Promise<void> {
    await this.client.post(`/media/upload/chunked/${encodeURIComponent(uploadId)}/abort`, {});
  }
}
