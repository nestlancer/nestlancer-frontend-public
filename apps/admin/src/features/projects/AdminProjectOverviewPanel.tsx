'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { formatIsoDate } from '@nestlancer/utils';
import { FormFieldLabel } from '@nestlancer/field-help';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  StatusBadge,
} from '@nestlancer/ui';

import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog';
import { AdminSection } from '@/components/admin/AdminConsolePrimitives';
import { UserSearchCombobox } from '@/components/admin/UserSearchCombobox';
import { adminKeys } from '@/lib/admin-query-keys';
import { clientEmailFromRow, formatAdminStatus, projectStatusTone } from '@/lib/admin-response';
import { apiServices } from '@/lib/axios';
import { AdminProjectPortfolioBridge } from './AdminProjectPortfolioBridge';

function operatorDisplayLabel(source: Record<string, unknown> | null | undefined): string | null {
  if (!source) return null;
  const admin = source.admin;
  if (admin && typeof admin === 'object') {
    const a = admin as Record<string, unknown>;
    const email = typeof a.email === 'string' ? a.email.trim() : '';
    const name = [a.firstName, a.lastName]
      .filter((p) => typeof p === 'string' && p.trim())
      .join(' ')
      .trim();
    if (email && name) return `${name} · ${email}`;
    if (email) return email;
    if (name) return name;
  }
  return null;
}
const PROJECT_STATUSES = [
  'CREATED',
  'PENDING_PAYMENT',
  'IN_PROGRESS',
  'REVIEW',
  'COMPLETED',
  'ARCHIVED',
  'CANCELLED',
  'REVISION_REQUESTED',
  'ON_HOLD',
] as const;

function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1.5 text-sm text-foreground">{children}</div>
    </div>
  );
}

function normalizeProjectStatus(s: string) {
  const raw = String(s ?? '').trim();
  if (!raw) return 'IN_PROGRESS';
  // Already SCREAMING_SNAKE or single-token UPPER (e.g. COMPLETED)
  if (raw.includes('_') || raw === raw.toUpperCase()) {
    return raw.toUpperCase();
  }
  // camelCase → SCREAMING_SNAKE (e.g. inProgress → IN_PROGRESS)
  return raw
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase()
    .replace(/^_/, '');
}

export function AdminProjectOverviewPanel({
  projectId,
  record,
  currentStatus,
}: {
  projectId: string;
  record: Record<string, unknown>;
  currentStatus: string;
}) {
  const qc = useQueryClient();
  const { confirm } = useAdminConfirm();
  const statusLabel = formatAdminStatus(record.status);
  const deadline = record.targetEndDate ?? record.deadline;
  const normalizedStatus = normalizeProjectStatus(currentStatus);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [operatorDialogOpen, setOperatorDialogOpen] = useState(false);
  const [statusValue, setStatusValue] = useState(normalizeProjectStatus(currentStatus));
  const [statusReason, setStatusReason] = useState('');
  const [teamMemberId, setTeamMemberId] = useState('');

  const projectQ = useQuery({
    queryKey: [...adminKeys.root, 'project', projectId, 'ops-meta'],
    queryFn: () => apiServices.admin.getAdminProject(projectId),
  });
  const statusHistoryQ = useQuery({
    queryKey: [...adminKeys.root, 'project', projectId, 'status-history'],
    queryFn: () => apiServices.admin.getAdminProjectStatusHistory(projectId),
    enabled: statusDialogOpen,
  });
  const statusHistoryItems = (() => {
    const raw = statusHistoryQ.data;
    if (!raw || typeof raw !== 'object') return [];
    const rec = raw as Record<string, unknown>;
    const inner =
      rec.data && typeof rec.data === 'object' ? (rec.data as Record<string, unknown>) : rec;
    const list = Array.isArray(inner.history) ? inner.history : [];
    return list as Array<Record<string, unknown>>;
  })();
  const projectRecord =
    projectQ.data && typeof projectQ.data === 'object'
      ? ((projectQ.data as { data?: unknown }).data ?? projectQ.data)
      : null;
  const assignedAdminId =
    projectRecord && typeof projectRecord === 'object'
      ? String((projectRecord as Record<string, unknown>).adminId ?? '')
      : String(record.adminId ?? '');
  const operatorLabel =
    operatorDisplayLabel(
      projectRecord && typeof projectRecord === 'object'
        ? (projectRecord as Record<string, unknown>)
        : null
    ) ||
    operatorDisplayLabel(record) ||
    (assignedAdminId ? assignedAdminId : null);

  const openStatusDialog = () => {
    setStatusValue(normalizeProjectStatus(currentStatus));
    setStatusReason('');
    setStatusDialogOpen(true);
  };

  const openOperatorDialog = () => {
    setTeamMemberId('');
    setOperatorDialogOpen(true);
  };

  const statusM = useMutation({
    mutationFn: () =>
      apiServices.admin.updateProjectStatus(projectId, {
        status: statusValue,
        reason: statusReason.trim() || 'Admin status update',
        notifyClient: true,
      }),
    onSuccess: () => {
      toast.success('Project status updated');
      setStatusDialogOpen(false);
      setStatusReason('');
      void qc.invalidateQueries({ queryKey: [...adminKeys.root, 'project', projectId] });
      void qc.invalidateQueries({
        queryKey: [...adminKeys.root, 'project', projectId, 'status-history'],
      });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update status')),
  });

  const completeProjectM = useMutation({
    mutationFn: () => apiServices.admin.markProjectComplete(projectId, {}),
    onSuccess: () => {
      toast.success('Project marked complete');
      void qc.invalidateQueries({ queryKey: [...adminKeys.root, 'project', projectId] });
      void qc.invalidateQueries({
        queryKey: [...adminKeys.root, 'project', projectId, 'status-history'],
      });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not complete project')),
  });

  const addTeamM = useMutation({
    mutationFn: () =>
      apiServices.admin.addProjectTeamMember(projectId, { memberId: teamMemberId.trim() }),
    onSuccess: () => {
      toast.success('Operator assigned');
      setOperatorDialogOpen(false);
      setTeamMemberId('');
      void qc.invalidateQueries({ queryKey: [...adminKeys.root, 'project', projectId] });
      void qc.invalidateQueries({
        queryKey: [...adminKeys.root, 'project', projectId, 'ops-meta'],
      });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not assign operator')),
  });

  const removeTeamM = useMutation({
    mutationFn: (memberId: string) =>
      apiServices.admin.removeProjectTeamMember(projectId, memberId),
    onSuccess: () => {
      toast.success('Operator removed');
      void qc.invalidateQueries({ queryKey: [...adminKeys.root, 'project', projectId] });
      void qc.invalidateQueries({
        queryKey: [...adminKeys.root, 'project', projectId, 'ops-meta'],
      });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not remove operator')),
  });

  return (
    <>
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <AdminSection
            title="Project details"
            description="Core metadata and timeline for this engagement."
          >
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailBlock label="Current status">
                <StatusBadge variant={projectStatusTone(record.status)}>{statusLabel}</StatusBadge>
              </DetailBlock>
              <DetailBlock label="Project ID">
                <span className="font-mono text-xs break-all">{String(record.id ?? '—')}</span>
              </DetailBlock>
              {record.createdAt ? (
                <DetailBlock label="Created">
                  {formatIsoDate(String(record.createdAt), 'PPp')}
                </DetailBlock>
              ) : null}
              {record.updatedAt ? (
                <DetailBlock label="Last updated">
                  {formatIsoDate(String(record.updatedAt), 'PPp')}
                </DetailBlock>
              ) : null}
              {deadline ? (
                <DetailBlock label="Target end">
                  {formatIsoDate(String(deadline), 'PP')}
                </DetailBlock>
              ) : null}
              {record.overallProgress != null ? (
                <DetailBlock label="Overall progress">
                  {String(record.overallProgress)}%
                </DetailBlock>
              ) : null}
            </dl>
            {record.description ? (
              <div className="mt-5 border-t border-border/50 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Description
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {String(record.description)}
                </p>
              </div>
            ) : null}
          </AdminSection>

          <AdminSection title="Client" description="Client contact linked to this project.">
            <dl className="grid gap-4">
              {record.client || record.user ? (
                <DetailBlock label="Email">{clientEmailFromRow(record)}</DetailBlock>
              ) : record.clientId ? (
                <DetailBlock label="Client ID">
                  <span className="font-mono text-xs break-all">{String(record.clientId)}</span>
                </DetailBlock>
              ) : (
                <DetailBlock label="Client">—</DetailBlock>
              )}
              {record.quoteId ? (
                <DetailBlock label="Quote ID">
                  <span className="font-mono text-xs break-all">{String(record.quoteId)}</span>
                </DetailBlock>
              ) : null}
            </dl>
          </AdminSection>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <AdminSection title="Project status" description="Lifecycle state visible to the client.">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge variant={projectStatusTone(record.status)}>{statusLabel}</StatusBadge>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={openStatusDialog}>
                  Update status
                </Button>
                {normalizedStatus === 'REVIEW' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={completeProjectM.isPending}
                    onClick={async () => {
                      const { confirmed } = await confirm({
                        title: 'Complete project',
                        description:
                          'This is only available in Review. It marks the project completed for the client.',
                        confirmLabel: 'Mark complete',
                      });
                      if (!confirmed) return;
                      completeProjectM.mutate();
                    }}
                  >
                    Mark complete
                  </Button>
                ) : null}
              </div>
            </div>
          </AdminSection>

          <AdminSection
            title="Operator assignment"
            description="Internal admin responsible for day-to-day delivery."
          >
            {assignedAdminId ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium">
                  {operatorLabel}
                </span>
                <Button size="sm" variant="outline" onClick={openOperatorDialog}>
                  Change operator
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={removeTeamM.isPending}
                  onClick={async () => {
                    const { confirmed } = await confirm({
                      title: 'Remove operator',
                      description: 'Unassign the current admin from this project?',
                      destructive: true,
                    });
                    if (!confirmed) return;
                    removeTeamM.mutate(assignedAdminId);
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-muted-foreground">No operator assigned yet.</p>
                <Button size="sm" onClick={openOperatorDialog}>
                  Assign operator
                </Button>
              </div>
            )}
          </AdminSection>
        </div>

        <AdminProjectPortfolioBridge
          projectId={projectId}
          projectStatus={normalizeProjectStatus(currentStatus)}
        />
      </div>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Update project status</DialogTitle>
          <DialogDescription>
            Change lifecycle state. The client can be notified automatically.
          </DialogDescription>
          <div className="mt-4 grid gap-3">
            <div className="space-y-1">
              <FormFieldLabel fieldKey="projects.status" label="Status">
                Status
              </FormFieldLabel>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={statusValue}
                onChange={(e) => setStatusValue(e.target.value)}
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {formatAdminStatus(s)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <FormFieldLabel fieldKey="projects.statusReason" label="Reason">
                Reason
              </FormFieldLabel>
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Why this change?"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
              />
            </div>
            <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Status history
              </p>
              {statusHistoryQ.isLoading ? (
                <p className="text-xs text-muted-foreground">Loading history…</p>
              ) : statusHistoryItems.length === 0 ? (
                <p className="text-xs text-muted-foreground">No status changes recorded yet.</p>
              ) : (
                <ol className="max-h-40 space-y-2 overflow-y-auto">
                  {statusHistoryItems.map((entry, idx) => {
                    const from = entry.from != null ? formatAdminStatus(String(entry.from)) : null;
                    const to = entry.to != null ? formatAdminStatus(String(entry.to)) : null;
                    const when = entry.at != null ? String(entry.at) : '';
                    const reason = entry.reason != null ? String(entry.reason) : '';
                    const typeLabel = formatAdminStatus(String(entry.type ?? 'Change'));
                    const headline =
                      from && to ? `${from} → ${to}` : to ? `Created as ${to}` : typeLabel;
                    return (
                      <li key={String(entry.id ?? idx)} className="text-xs">
                        <p className="font-medium text-foreground">{headline}</p>
                        {when ? (
                          <p className="text-muted-foreground">{formatIsoDate(when, 'PPp')}</p>
                        ) : null}
                        {reason ? <p className="text-muted-foreground">{reason}</p> : null}
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={statusM.isPending} onClick={() => statusM.mutate()}>
              {statusM.isPending ? 'Updating…' : 'Update status'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={operatorDialogOpen} onOpenChange={setOperatorDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>{assignedAdminId ? 'Change operator' : 'Assign operator'}</DialogTitle>
          <DialogDescription>Search for the admin responsible for this project.</DialogDescription>
          <div className="mt-4 space-y-1">
            <FormFieldLabel fieldKey="projects.teamMemberId" label="Operator">
              Operator
            </FormFieldLabel>
            <UserSearchCombobox
              roleFilter="ADMIN"
              value={teamMemberId}
              placeholder="Search admin by name or email…"
              onChange={(userId) => setTeamMemberId(userId)}
            />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOperatorDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!teamMemberId.trim() || addTeamM.isPending}
              onClick={() => addTeamM.mutate()}
            >
              {addTeamM.isPending ? 'Assigning…' : 'Assign operator'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
