import type { MediaService } from '../services/media.service';
import { inferMediaFileType } from './infer-media-file-type';
import { formatStorageUploadError } from './storage-upload-error';
import type { UploadMediaFileResult } from './upload-media-file';
import { waitUntilMediaReady } from './wait-until-media-ready';

export const CHUNKED_UPLOAD_THRESHOLD_BYTES = 20 * 1024 * 1024;

type ChunkPart = { partNumber: number; uploadUrl: string };

function etagFromResponse(res: Response): string {
  const raw = res.headers.get('etag') ?? res.headers.get('ETag') ?? '';
  return raw.replace(/"/g, '');
}

/**
 * S3 multipart flow: init → PUT each presigned part → record etag → complete.
 */
export async function uploadMediaFileChunked(
  media: MediaService,
  file: File,
  options?: {
    onProgress?: (percent: number) => void;
    projectId?: string;
    threadId?: string;
  }
): Promise<UploadMediaFileResult> {
  const fileType = inferMediaFileType(file.type, file.name);
  const init = (await media.initChunkedUpload({
    filename: file.name,
    mimeType: file.type || 'application/octet-stream',
    totalSize: file.size,
    fileType,
    ...(options?.projectId ? { projectId: options.projectId } : {}),
    ...(options?.threadId ? { threadId: options.threadId } : {}),
  })) as Record<string, unknown>;

  const uploadId = String(init.uploadId ?? init.mediaId ?? '');
  if (!uploadId) throw new Error('Chunked init did not return uploadId');

  const parts = Array.isArray(init.parts) ? (init.parts as ChunkPart[]) : [];
  if (parts.length === 0) throw new Error('Chunked init did not return part URLs');

  const recorded: { partNumber: number; etag: string }[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;
    const start =
      (part.partNumber - 1) * (Number(init.chunkSize) || CHUNKED_UPLOAD_THRESHOLD_BYTES);
    const end = Math.min(
      start + (Number(init.chunkSize) || CHUNKED_UPLOAD_THRESHOLD_BYTES),
      file.size
    );
    const blob = file.slice(start, end);

    let putRes: Response;
    try {
      putRes = await fetch(part.uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
    } catch (err) {
      try {
        await media.abortChunkedUpload(uploadId);
      } catch {
        /* best-effort cleanup */
      }
      throw new Error(formatStorageUploadError(err));
    }
    if (!putRes.ok) {
      try {
        await media.abortChunkedUpload(uploadId);
      } catch {
        /* best-effort cleanup */
      }
      throw new Error(formatStorageUploadError(undefined, putRes.status));
    }

    const etag = etagFromResponse(putRes);
    if (!etag) throw new Error(`Chunk ${part.partNumber} missing ETag header`);

    recorded.push({ partNumber: part.partNumber, etag });
    await media.recordChunkPart(uploadId, { partNumber: part.partNumber, etag });

    if (options?.onProgress) {
      options.onProgress(Math.round(((i + 1) / parts.length) * 100));
    }
  }

  await media.completeChunkedUpload(uploadId, { parts: recorded });
  await waitUntilMediaReady(media, uploadId);
  return { mediaId: uploadId };
}
