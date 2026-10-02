import type { MediaService } from '../services/media.service';
import { inferMediaFileType } from './infer-media-file-type';
import type { UploadMediaFileResult } from './upload-media-file';
import { waitUntilMediaReady } from './wait-until-media-ready';

function resolveMediaId(payload: unknown): string {
  const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const nested =
    record.data && typeof record.data === 'object'
      ? (record.data as Record<string, unknown>)
      : record;
  return String(nested.id ?? nested.mediaId ?? '');
}

/**
 * Server-mediated upload — avoids browser CORS on presigned PUT to object storage.
 */
export async function uploadMediaFileDirect(
  media: MediaService,
  file: File,
  options?: {
    projectId?: string;
    threadId?: string;
  }
): Promise<UploadMediaFileResult> {
  const fileType = inferMediaFileType(file.type, file.name);
  const result = await media.directUpload(file, {
    fileType,
    projectId: options?.projectId,
    threadId: options?.threadId,
  });
  const mediaId = resolveMediaId(result);
  if (!mediaId) {
    throw new Error('Direct upload did not return a media id');
  }
  await waitUntilMediaReady(media, mediaId);
  return { mediaId };
}
