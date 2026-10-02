'use client';

import { openSafeHttpUrl } from '@nestlancer/utils';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';

import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog';
import { apiServices } from '@/lib/axios';

import {
  parseAdminMediaRecord,
  parseAdminMediaReferences,
  parseAdminMediaShares,
  type AdminMediaMetadataPatch,
  type AdminMediaRecord,
} from '../types';

const detailKey = (id: string) => ['admin', 'media', 'detail', id] as const;

export function useAdminMediaDetail(mediaId: string | null, enabled = true) {
  const qc = useQueryClient();
  const { confirm } = useAdminConfirm();
  const active = Boolean(mediaId) && enabled;

  const detailQ = useQuery({
    queryKey: mediaId ? detailKey(mediaId) : ['admin', 'media', 'detail', 'none'],
    queryFn: () => apiServices.mediaAdmin.getById(mediaId!),
    enabled: active,
  });

  const referencesQ = useQuery({
    queryKey: mediaId
      ? [...detailKey(mediaId), 'references']
      : ['admin', 'media', 'references', 'none'],
    queryFn: () => apiServices.mediaAdmin.getReferences(mediaId!),
    enabled: active,
  });

  const sharesQ = useQuery({
    queryKey: mediaId ? [...detailKey(mediaId), 'shares'] : ['admin', 'media', 'shares', 'none'],
    queryFn: () => apiServices.mediaAdmin.getShares(mediaId!),
    enabled: active,
  });

  const invalidateMedia = () => {
    void qc.invalidateQueries({ queryKey: ['admin', 'media'] });
    if (mediaId) {
      void qc.invalidateQueries({ queryKey: detailKey(mediaId) });
    }
  };

  const record: AdminMediaRecord | null = detailQ.data ? parseAdminMediaRecord(detailQ.data) : null;
  const references = parseAdminMediaReferences(referencesQ.data);
  const shares = parseAdminMediaShares(sharesQ.data);

  const patchMetadata = useMutation({
    mutationFn: (payload: AdminMediaMetadataPatch) =>
      apiServices.mediaAdmin.patchMetadata(mediaId!, payload),
    onSuccess: () => {
      toast.success('Metadata updated');
      invalidateMedia();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Update failed')),
  });

  const reprocess = useMutation({
    mutationFn: () => apiServices.mediaAdmin.reprocess(mediaId!),
    onSuccess: () => {
      toast.success('Reprocess queued');
      invalidateMedia();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Reprocess failed')),
  });

  const release = useMutation({
    mutationFn: () => apiServices.mediaAdmin.releaseQuarantined(mediaId!),
    onSuccess: () => {
      toast.success('Released from quarantine');
      invalidateMedia();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Release failed')),
  });

  const download = useMutation({
    mutationFn: () => apiServices.mediaAdmin.downloadUrl(mediaId!),
    onSuccess: (url) => {
      if (url) openSafeHttpUrl(url);
      else toast.error('Download URL not available');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Download failed')),
  });

  const deleteMedia = useMutation({
    mutationFn: (force?: boolean) => apiServices.mediaAdmin.deleteMedia(mediaId!, force),
    onSuccess: () => {
      toast.success('File deleted');
      invalidateMedia();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Delete failed')),
  });

  const deleteQuarantined = useMutation({
    mutationFn: () => apiServices.mediaAdmin.deleteQuarantined(mediaId!),
    onSuccess: () => {
      toast.success('Quarantined file deleted');
      invalidateMedia();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Delete failed')),
  });

  const createShare = useMutation({
    mutationFn: (options: { purpose: string; expiresInSeconds: number; password?: string }) =>
      apiServices.mediaAdmin.createShare(mediaId!, options),
    onSuccess: (data) => {
      if (
        data &&
        typeof data === 'object' &&
        'status' in data &&
        (data as { status?: string }).status === 'error'
      ) {
        toast.error(getApiErrorMessage(data, 'Share failed'));
        return;
      }
      toast.success('Share link created');
      void qc.invalidateQueries({ queryKey: [...detailKey(mediaId!), 'shares'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Share failed')),
  });

  const revokeShare = useMutation({
    mutationFn: () => apiServices.mediaAdmin.revokeShare(mediaId!),
    onSuccess: () => {
      toast.success('All share links revoked');
      void qc.invalidateQueries({ queryKey: [...detailKey(mediaId!), 'shares'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Revoke failed')),
  });

  const revokeShareById = useMutation({
    mutationFn: (shareLinkId: string) =>
      apiServices.mediaAdmin.revokeShareById(mediaId!, shareLinkId),
    onSuccess: () => {
      toast.success('Share link revoked');
      void qc.invalidateQueries({ queryKey: [...detailKey(mediaId!), 'shares'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Revoke failed')),
  });

  const confirmDelete = async (options?: { quarantined?: boolean; referenceCount?: number }) => {
    const hasRefs = (options?.referenceCount ?? references.referenceCount) > 0;
    const firstPass = await confirm({
      title: options?.quarantined ? 'Delete quarantined file' : 'Delete file',
      description: hasRefs
        ? 'This file is referenced elsewhere. Deleting may break links. Use force delete to proceed anyway.'
        : 'Permanently delete this file? This cannot be undone.',
      destructive: true,
      confirmLabel: hasRefs ? 'Try delete' : 'Delete',
    });
    if (!firstPass.confirmed) return false;

    try {
      if (options?.quarantined) {
        await deleteQuarantined.mutateAsync();
      } else {
        await deleteMedia.mutateAsync(false);
      }
      return true;
    } catch (error: unknown) {
      const status =
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'status' in error.response
          ? (error.response as { status?: number }).status
          : undefined;
      if (status !== 409) return false;
      const forcePass = await confirm({
        title: 'Force delete',
        description:
          'The file is still referenced in the platform. Force delete will remove it anyway.',
        destructive: true,
        confirmLabel: 'Force delete',
      });
      if (!forcePass.confirmed) return false;
      if (options?.quarantined) {
        await deleteQuarantined.mutateAsync();
      } else {
        await deleteMedia.mutateAsync(true);
      }
      return true;
    }
  };

  return {
    record,
    references,
    shares,
    detailQ,
    referencesQ,
    sharesQ,
    patchMetadata,
    reprocess,
    release,
    download,
    deleteMedia,
    deleteQuarantined,
    createShare,
    revokeShare,
    revokeShareById,
    confirmDelete,
    invalidateMedia,
  };
}
