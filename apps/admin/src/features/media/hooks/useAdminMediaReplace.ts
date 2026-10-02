'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';

import { apiServices } from '@/lib/axios';

export function useAdminMediaReplace(mediaId: string | null) {
  const qc = useQueryClient();
  const [progress, setProgress] = useState<number | null>(null);

  const replace = useMutation({
    mutationFn: async ({ file, force }: { file: File; force?: boolean }) => {
      if (!mediaId) throw new Error('Missing media id');
      setProgress(0);
      return apiServices.mediaAdmin.replace(mediaId, file, {
        force,
        onUploadProgress: setProgress,
      });
    },
    onSuccess: () => {
      toast.success('File replaced');
      setProgress(null);
      void qc.invalidateQueries({ queryKey: ['admin', 'media'] });
      if (mediaId) {
        void qc.invalidateQueries({ queryKey: ['admin', 'media', 'detail', mediaId] });
      }
    },
    onError: (e) => {
      setProgress(null);
      toast.error(getApiErrorMessage(e, 'Replace failed'));
    },
  });

  return {
    replace,
    progress,
    isReplacing: replace.isPending,
    resetProgress: () => setProgress(null),
  };
}
