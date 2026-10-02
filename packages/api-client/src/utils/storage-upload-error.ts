/**
 * User-facing message when a presigned PUT to object storage fails.
 */
export function formatStorageUploadError(error: unknown, httpStatus?: number): string {
  if (httpStatus === 403) {
    return 'Storage upload was denied. The upload link may have expired — try again.';
  }
  if (httpStatus === 404) {
    return 'Storage bucket not found. Contact support if this persists.';
  }
  if (typeof httpStatus === 'number' && httpStatus >= 500) {
    return `Storage server error (${httpStatus}). Try again in a few minutes.`;
  }
  if (typeof httpStatus === 'number' && httpStatus >= 400) {
    return `Storage upload failed (${httpStatus}). Try again or use a smaller file.`;
  }

  if (error instanceof TypeError) {
    return 'File storage blocked browser upload (CORS). Retrying through the API usually fixes this — try again.';
  }

  if (error instanceof Error && error.message) {
    if (/failed to fetch|network|load failed|cors/i.test(error.message)) {
      return 'File storage blocked browser upload (CORS). Retrying through the API usually fixes this — try again.';
    }
    return error.message;
  }

  return 'Storage upload failed. Try again or contact support.';
}
