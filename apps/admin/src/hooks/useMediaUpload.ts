'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import {
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
    error: mutation.error,
    reset: mutation.reset,
  };
}
