'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import {
  CHUNKED_UPLOAD_THRESHOLD_BYTES,
  getApiErrorMessage,
  uploadMediaFile,
  type UploadMediaFileResult,
} from '@nestlancer/api-client';

import { apiServices } from '@/lib/axios';

export function useMediaUpload(options?: {
  onSuccess?: (result: UploadMediaFileResult) => void;
  /** When false, skip the default success toast (e.g. messaging still needs a send POST). */
  successToast?: boolean;
}) {
  const showSuccessToast = options?.successToast !== false;
  const mutation = useMutation({
    mutationFn: async ({
      file,
      onProgress,
      projectId,
      threadId,
    }: {
      file: File;
      onProgress?: (percent: number) => void;
      projectId?: string;
      threadId?: string;
    }) => uploadMediaFile(apiServices.media, file, { onProgress, projectId, threadId }),
    onSuccess: (result) => {
      if (showSuccessToast) toast.success('File uploaded');
      options?.onSuccess?.(result);
    },
    // When successToast is suppressed, caller owns all toasts (upload + follow-up send).
    onError: (e) => {
      if (showSuccessToast) toast.error(getApiErrorMessage(e, 'Upload failed'));
    },
  });

  return {
    upload: mutation.mutate,
    uploadAsync: mutation.mutateAsync,
    isUploading: mutation.isPending,
    progress: mutation.variables?.onProgress,
    chunkedThresholdBytes: CHUNKED_UPLOAD_THRESHOLD_BYTES,
    error: mutation.error,
    reset: mutation.reset,
  };
}
