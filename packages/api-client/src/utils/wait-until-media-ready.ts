import type { MediaService } from '../services/media.service';

/**
 * Poll media processing until READY (or fail). Used after confirm/direct/chunked upload
 * so message attach never binds a PROCESSING/FAILED asset (NL-MEDIA-001/002).
 */
export async function waitUntilMediaReady(
  media: MediaService,
  mediaId: string,
  options?: { timeoutMs?: number }
): Promise<void> {
  const deadline = Date.now() + (options?.timeoutMs ?? 60_000);
  let delayMs = 400;
  while (Date.now() < deadline) {
    const statusPayload = (await media.getProcessingStatus(mediaId)) as Record<string, unknown>;
    const status = String(
      statusPayload.status ?? statusPayload.state ?? statusPayload.processingStatus ?? ''
    ).toUpperCase();
    if (status === 'READY') return;
    if (status === 'FAILED' || status === 'QUARANTINED') {
      throw new Error(
        status === 'QUARANTINED'
          ? 'Upload was quarantined by virus scanning'
          : 'Media processing failed after upload'
      );
    }
    await new Promise((r) => setTimeout(r, delayMs));
    delayMs = Math.min(delayMs * 1.4, 2500);
  }
  throw new Error('Timed out waiting for media processing to finish');
}
