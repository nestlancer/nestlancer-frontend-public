'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import {
  buildEodTemplateTitle,
  EOD_DESCRIPTION_TEMPLATE,
  formatIsoDate,
  hasProgressEntryToday,
  isInternalProgressType,
  PROGRESS_ENTRY_TYPES,
  progressEntryTypeLabel,
  visibilityForEntryType,
  type ProgressEntryTypeValue,
} from '@nestlancer/utils';
import { FormFieldLabel } from '@nestlancer/field-help';
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from '@nestlancer/ui';

import { useMediaUpload } from '@/hooks/useMediaUpload';
import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog';
import { AdminQueryState, AdminSection } from '@/components/admin/AdminConsolePrimitives';
import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminRows } from '@/lib/admin-response';
import { apiServices } from '@/lib/axios';

function parseMediaIds(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function extractEntryDetails(row: Record<string, unknown>) {
  const details =
    row.details && typeof row.details === 'object' && !Array.isArray(row.details)
      ? (row.details as Record<string, unknown>)
      : {};
  const attachmentIds = Array.isArray(details.attachmentIds)
    ? details.attachmentIds.map((id) => String(id))
    : [];
  return { attachmentIds };
}

type ProgressFormState = {
  entryType: ProgressEntryTypeValue;
  entryTitle: string;
  entryDescription: string;
  entryMilestoneId: string;
  entryAttachmentIds: string;
  notifyClient: boolean;
};

function defaultProgressForm(milestones: { id: string; name: string }[]): ProgressFormState {
  return {
    entryType: 'UPDATE',
    entryTitle: '',
    entryDescription: '',
    entryMilestoneId: milestones[0]?.id ?? '',
    entryAttachmentIds: '',
    notifyClient: true,
  };
}

export function AdminProgressUpdateSection({
  projectId,
  milestones,
  projectStatus,
}: {
  projectId: string;
  milestones: { id: string; name: string }[];
  projectStatus?: string;
}) {
  const qc = useQueryClient();
  const { confirm } = useAdminConfirm();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [form, setForm] = useState<ProgressFormState>(() => defaultProgressForm(milestones));

  const progressQ = useQuery({
    queryKey: [...adminKeys.root, 'project', projectId, 'admin-progress'],
    queryFn: () => apiServices.admin.listAdminProgressEntries(projectId, { limit: 20 }),
  });

  const progressRows = pickAdminRows(progressQ.data);
  const showDailyReminder = useMemo(() => {
    const active = ['IN_PROGRESS', 'REVIEW', 'REVISION_REQUESTED'].includes(
      String(projectStatus ?? '').toUpperCase()
    );
    return active && !hasProgressEntryToday(progressRows);
  }, [progressRows, projectStatus]);

  const { upload: uploadAttachment, isUploading: attachmentUploading } = useMediaUpload({
    onSuccess: ({ mediaId }) => {
      setForm((prev) => {
        const ids = parseMediaIds(prev.entryAttachmentIds);
        if (ids.includes(mediaId)) return prev;
        return {
          ...prev,
          entryAttachmentIds: [...ids, mediaId].join(', '),
        };
      });
    },
  });

  const buildEntryPayload = (state: ProgressFormState) => {
    const attachmentIds = parseMediaIds(state.entryAttachmentIds);
    const visibility = visibilityForEntryType(state.entryType);
    const title = state.entryTitle.trim();
    const rawDescription = state.entryDescription.trim();
    // NL-UI-005: never send description that duplicates the title.
    const description = rawDescription && rawDescription !== title ? rawDescription : '';
    return {
      type: state.entryType,
      title,
      description,
      visibility,
      notifyClient: visibility === 'CLIENT_VISIBLE' ? state.notifyClient : false,
      ...(state.entryMilestoneId ? { milestoneId: state.entryMilestoneId } : {}),
      ...(attachmentIds.length > 0 ? { attachmentIds } : {}),
    };
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingEntryId(null);
    setForm(defaultProgressForm(milestones));
  };

  const openCreateDialog = (opts?: { withEodTemplate?: boolean; internal?: boolean }) => {
    const next = defaultProgressForm(milestones);
    if (opts?.internal) {
      next.entryType = 'INTERNAL_NOTE';
      next.notifyClient = false;
    } else if (opts?.withEodTemplate) {
      next.entryTitle = buildEodTemplateTitle();
      next.entryDescription = EOD_DESCRIPTION_TEMPLATE;
      next.entryType = 'UPDATE';
    }
    setEditingEntryId(null);
    setForm(next);
    setDialogOpen(true);
  };

  const openEditDialog = (row: Record<string, unknown>) => {
    const entryId = String(row.id ?? '');
    if (!entryId) return;
    const { attachmentIds } = extractEntryDetails(row);
    setEditingEntryId(entryId);
    setForm({
      entryType: (String(row.type ?? 'UPDATE') as ProgressEntryTypeValue) || 'UPDATE',
      entryTitle: String(row.title ?? ''),
      entryDescription: String(row.description ?? ''),
      entryMilestoneId: row.milestoneId != null ? String(row.milestoneId) : '',
      entryAttachmentIds: attachmentIds.join(', '),
      notifyClient: Boolean(row.clientNotified ?? true),
    });
    setDialogOpen(true);
  };

  const saveEntryM = useMutation({
    mutationFn: () => {
      const payload = buildEntryPayload(form);
      if (editingEntryId) {
        return apiServices.admin.updateAdminProgressEntry(editingEntryId, payload);
      }
      return apiServices.admin.createAdminProgressEntry(projectId, payload);
    },
    onSuccess: () => {
      toast.success(editingEntryId ? 'Progress entry updated' : 'Progress entry posted');
      closeDialog();
      void qc.invalidateQueries({
        queryKey: [...adminKeys.root, 'project', projectId, 'admin-progress'],
      });
    },
    onError: (e) =>
      toast.error(
        getApiErrorMessage(e, editingEntryId ? 'Could not update entry' : 'Could not create entry')
      ),
  });

  const deleteEntryM = useMutation({
    mutationFn: (entryId: string) => apiServices.admin.deleteAdminProgressEntry(entryId),
    onSuccess: () => {
      toast.success('Progress entry deleted');
      void qc.invalidateQueries({
        queryKey: [...adminKeys.root, 'project', projectId, 'admin-progress'],
      });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not delete entry')),
  });

  const milestoneNameById = useMemo(
    () => Object.fromEntries(milestones.map((m) => [m.id, m.name])),
    [milestones]
  );

  const isEditMode = editingEntryId != null;

  return (
    <>
      <AdminSection
        title="Daily progress"
        description="Post client-visible updates and internal notes on the project timeline."
      >
        {showDailyReminder ? (
          <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
            No progress update posted today. Post what the team completed before end of day.
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => openCreateDialog()}>
            Post today&apos;s update
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openCreateDialog({ withEodTemplate: true })}
          >
            Use daily template
          </Button>
          <Button size="sm" variant="outline" onClick={() => openCreateDialog({ internal: true })}>
            Post internal note
          </Button>
        </div>

        <AdminQueryState isLoading={progressQ.isLoading} error={progressQ.error}>
          {progressRows.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {progressRows.map((row, i) => {
                const r = row as Record<string, unknown>;
                const entryId = String(r.id ?? '');
                const { attachmentIds } = extractEntryDetails(r);
                const milestoneId = r.milestoneId != null ? String(r.milestoneId) : '';
                const visibility = String(r.visibility ?? 'CLIENT_VISIBLE');
                return (
                  <li
                    key={String(r.id ?? i)}
                    className="rounded-lg border border-border/60 px-3 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{String(r.title ?? '—')}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                        {progressEntryTypeLabel(String(r.type ?? 'UPDATE'))}
                      </span>
                      {visibility === 'INTERNAL' ? (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-200">
                          Internal
                        </span>
                      ) : null}
                    </div>
                    {r.description ? (
                      <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground line-clamp-4">
                        {String(r.description)}
                      </p>
                    ) : null}
                    {milestoneId && milestoneNameById[milestoneId] ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Milestone: {milestoneNameById[milestoneId]}
                      </p>
                    ) : null}
                    {attachmentIds.length > 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {attachmentIds.length} attachment{attachmentIds.length === 1 ? '' : 's'}
                      </p>
                    ) : null}
                    {r.createdAt ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatIsoDate(String(r.createdAt), 'PPp')}
                      </p>
                    ) : null}
                    {entryId ? (
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(r)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deleteEntryM.isPending}
                          onClick={async () => {
                            const { confirmed } = await confirm({
                              title: 'Delete progress entry',
                              description: 'Remove this update from the project timeline?',
                              destructive: true,
                            });
                            if (!confirmed) return;
                            deleteEntryM.mutate(entryId);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No progress entries yet.</p>
          )}
        </AdminQueryState>
      </AdminSection>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogTitle>
            {isEditMode
              ? 'Edit progress entry'
              : isInternalProgressType(form.entryType)
                ? 'Post internal note'
                : "Post today's update"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? isInternalProgressType(form.entryType)
                ? 'Update this internal note. Clients never see internal entries.'
                : 'Update this entry on the client timeline.'
              : isInternalProgressType(form.entryType)
                ? 'Internal note — visible to operators only. Not shown to the client.'
                : 'Share what the team completed today. The client sees this on their Progress tab.'}
          </DialogDescription>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <FormFieldLabel fieldKey="projects.progressType" label="Entry type">
                Type
              </FormFieldLabel>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={form.entryType}
                onChange={(e) => {
                  const next = e.target.value as ProgressEntryTypeValue;
                  setForm((prev) => ({
                    ...prev,
                    entryType: next,
                    notifyClient: isInternalProgressType(next) ? false : prev.notifyClient,
                  }));
                }}
              >
                {PROGRESS_ENTRY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <FormFieldLabel fieldKey="projects.progressMilestone" label="Milestone">
                Milestone (optional)
              </FormFieldLabel>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={form.entryMilestoneId}
                onChange={(e) => setForm((prev) => ({ ...prev, entryMilestoneId: e.target.value }))}
              >
                <option value="">No milestone</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <FormFieldLabel fieldKey="projects.progressTitle" label="Progress title">
                Title
              </FormFieldLabel>
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Homepage wireframes in review"
                spellCheck
                value={form.entryTitle}
                onChange={(e) => setForm((prev) => ({ ...prev, entryTitle: e.target.value }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <FormFieldLabel fieldKey="projects.progressDescription" label="Progress description">
                Description
              </FormFieldLabel>
              <textarea
                className="min-h-[140px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder={
                  isInternalProgressType(form.entryType)
                    ? 'Internal note (not visible to client)'
                    : 'What was done today (visible to client — required, must differ from title)'
                }
                spellCheck
                value={form.entryDescription}
                onChange={(e) => setForm((prev) => ({ ...prev, entryDescription: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <FormFieldLabel fieldKey="projects.progressAttachments" label="Attachments">
                Attachments (optional)
              </FormFieldLabel>
              <label className="flex cursor-pointer flex-col gap-1 rounded-lg border border-dashed border-border px-3 py-2 text-sm">
                <span className="text-xs text-muted-foreground">Upload file to attach</span>
                <input
                  type="file"
                  className="text-xs"
                  disabled={attachmentUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadAttachment({ file: f, projectId });
                    e.target.value = '';
                  }}
                />
              </label>
              {form.entryAttachmentIds.trim() ? (
                <p className="text-xs text-muted-foreground">
                  Media IDs: <span className="font-mono">{form.entryAttachmentIds}</span>
                </p>
              ) : null}
            </div>
            {!isInternalProgressType(form.entryType) ? (
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.notifyClient}
                  onChange={(e) => setForm((prev) => ({ ...prev, notifyClient: e.target.checked }))}
                />
                Notify client when posted
              </label>
            ) : (
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Internal notes are never shown to the client and do not trigger notifications.
              </p>
            )}
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                !form.entryTitle.trim() ||
                saveEntryM.isPending ||
                // NL-UI-005: client-visible posts need a real description distinct from the title.
                (!isInternalProgressType(form.entryType) &&
                  (!form.entryDescription.trim() ||
                    form.entryDescription.trim() === form.entryTitle.trim()))
              }
              onClick={() => saveEntryM.mutate()}
            >
              {saveEntryM.isPending
                ? 'Saving…'
                : isEditMode
                  ? 'Save changes'
                  : isInternalProgressType(form.entryType)
                    ? 'Post note'
                    : 'Post update'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
