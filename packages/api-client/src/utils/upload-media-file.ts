import type { MediaService } from '../services/media.service';
import { inferMediaFileType } from './infer-media-file-type';
import { formatStorageUploadError } from './storage-upload-error';
import { CHUNKED_UPLOAD_THRESHOLD_BYTES, uploadMediaFileChunked } from './upload-media-chunked';
import { uploadMediaFileDirect } from './upload-media-file-direct';
import { waitUntilMediaReady } from './wait-until-media-ready';

function isPresignedStorageFailure(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (error instanceof Error && /failed to fetch|network|load failed|cors/i.test(error.message)) {
    return true;
  }
  return false;
}

export type UploadMediaFileResult = {
  mediaId: string;
  uploadUrl?: string;
};

/**
 * Presigned upload flow: request → PUT to storage → confirm → wait READY.
 * On browser CORS/network failure after requestUpload, delete the PENDING stub
 * before falling back to direct upload so libraries never keep a duplicate row.
 */
export async function uploadMediaFile(
  media: MediaService,
  file: File,
  options?: {
    onProgress?: (percent: number) => void;
    projectId?: string;
    threadId?: string;
  }
): Promise<UploadMediaFileResult> {
  if (file.size > CHUNKED_UPLOAD_THRESHOLD_BYTES) {
    return uploadMediaFileChunked(media, file, options);
  }
  const fileType = inferMediaFileType(file.type, file.name);
  const req = (await media.requestUpload({
    filename: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    fileType,
    ...(options?.projectId ? { projectId: options.projectId } : {}),
    ...(options?.threadId ? { threadId: options.threadId } : {}),
  })) as Record<string, unknown>;

  const mediaId = String(req.mediaId ?? req.uploadId ?? req.id ?? '');
  if (!mediaId) {
    throw new Error('Upload request did not return a media id');
  }

  const uploadUrl = String(req.uploadUrl ?? req.url ?? '');
  if (uploadUrl) {
    let putRes: Response;
    try {
      putRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
    } catch (err) {
      if (isPresignedStorageFailure(err)) {
        await discardPendingUpload(media, mediaId);
        return uploadMediaFileDirect(media, file, options);
      }
      throw new Error(formatStorageUploadError(err));
    }
    if (!putRes.ok) {
      // Some environments fail CORS with opaque status; fall back the same way.
      if (putRes.status === 0 || putRes.type === 'opaque') {
        await discardPendingUpload(media, mediaId);
        return uploadMediaFileDirect(media, file, options);
      }
      await discardPendingUpload(media, mediaId);
      throw new Error(formatStorageUploadError(undefined, putRes.status));
    }
  }

  await media.confirmUpload({ uploadId: mediaId });
  await waitUntilMediaReady(media, mediaId);
  return { mediaId, uploadUrl: uploadUrl || undefined };
}

async function discardPendingUpload(media: MediaService, mediaId: string): Promise<void> {
  try {
    await media.remove(mediaId);
  } catch {
    /* best-effort — library filters also hide stale PENDING rows */
  }
}
