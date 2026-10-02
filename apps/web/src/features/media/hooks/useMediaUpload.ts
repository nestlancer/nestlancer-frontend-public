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

export function useMediaUpload(options?: { onSuccess?: (result: UploadMediaFileResult) => void }) {
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
      toast.success('File uploaded');
      options?.onSuccess?.(result);
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Upload failed')),
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
