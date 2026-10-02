'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { safeHttpUrl } from '@nestlancer/utils';
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from '@nestlancer/ui';

import { AdminSection } from '@/components/admin/AdminConsolePrimitives';
import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminRecord } from '@/lib/admin-response';
import { apiServices } from '@/lib/axios';

type EligibleMedia = {
  mediaId: string;
  filename: string;
  deliverableName: string;
  milestoneName: string;
};

function normalizeStatus(status?: string) {
  return String(status ?? '').toUpperCase();
}

export function AdminProjectPortfolioBridge({
  projectId,
  projectStatus,
}: {
  projectId: string;
  projectStatus: string;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);

  const isCompleted = normalizeStatus(projectStatus) === 'COMPLETED';

  const linkQ = useQuery({
    queryKey: [...adminKeys.root, 'project', projectId, 'portfolio-link'],
    queryFn: () => apiServices.admin.getProjectPortfolioLink(projectId),
    enabled: isCompleted,
  });

  const previewQ = useQuery({
    queryKey: [...adminKeys.root, 'project', projectId, 'portfolio-preview'],
    queryFn: () => apiServices.admin.getProjectPortfolioPreview(projectId),
    enabled: wizardOpen && isCompleted,
  });

  const link = pickAdminRecord(linkQ.data) as Record<string, unknown> | null;
  const publicHref = safeHttpUrl(link?.publicUrl != null ? String(link.publicUrl) : null);
  const preview = pickAdminRecord(previewQ.data) as Record<string, unknown> | null;
  const suggested = (preview?.suggested ?? {}) as Record<string, unknown>;
  const eligibleMedia = (preview?.eligibleMedia ?? []) as EligibleMedia[];
  const blockers = (preview?.blockers ?? []) as string[];

  const createM = useMutation({
    mutationFn: () =>
      apiServices.admin.createPortfolioDraftFromProject(projectId, {
        promoteMediaIds: selectedMedia,
      }),
    onSuccess: (res) => {
      const row = pickAdminRecord(res) as Record<string, unknown> | null;
      const portfolioItemId = String(row?.portfolioItemId ?? '');
      toast.success('Portfolio draft created');
      setWizardOpen(false);
      setSelectedMedia([]);
      void qc.invalidateQueries({
        queryKey: [...adminKeys.root, 'project', projectId, 'portfolio-link'],
      });
      if (portfolioItemId) {
        router.push(`/portfolio/${portfolioItemId}/edit?fromProject=${projectId}`);
      }
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not create portfolio draft')),
  });

  const statusLabel = useMemo(() => {
    if (!link?.linked) return 'Not linked';
    const status = normalizeStatus(String(link.status ?? ''));
    if (status === 'PUBLISHED') return 'Published';
    if (status === 'DRAFT') return 'Draft';
    return status || 'Linked';
  }, [link]);

  if (!isCompleted) {
    return (
      <AdminSection
        title="Public showcase"
        description="Mark the project complete before creating a public portfolio case study."
      >
        <p className="text-sm text-muted-foreground">
          Portfolio drafts can only be created from completed projects.
        </p>
      </AdminSection>
    );
  }

  return (
    <>
      <AdminSection
        title="Public showcase"
        description="Create a safe public copy for the portfolio — client data stays private."
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-border px-3 py-1 text-xs font-medium">
            {statusLabel}
          </span>
          {link?.linked && link.portfolioItemId ? (
            <>
              <Button variant="outline" size="sm" className="rounded-lg" asChild>
                <Link href={`/portfolio/${String(link.portfolioItemId)}/edit`}>Edit portfolio</Link>
              </Button>
              {publicHref ? (
                <Button variant="ghost" size="sm" className="rounded-lg" asChild>
                  <a href={publicHref} target="_blank" rel="noopener noreferrer">
                    View public
                  </a>
                </Button>
              ) : null}
            </>
          ) : (
            <Button size="sm" className="rounded-lg" onClick={() => setWizardOpen(true)}>
              Create portfolio draft
            </Button>
          )}
        </div>
      </AdminSection>

      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogTitle>Create portfolio draft</DialogTitle>
          <DialogDescription>
            A redacted snapshot will be saved as a draft. Review and edit before publishing.
          </DialogDescription>

          {previewQ.isPending ? (
            <p className="text-sm text-muted-foreground">Loading preview…</p>
          ) : null}

          {blockers.length > 0 ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-destructive">
              {blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          ) : null}

          {!previewQ.isPending && blockers.length === 0 ? (
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Title
                </p>
                <p className="mt-1">{String(suggested.title ?? '')}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Short description
                </p>
                <p className="mt-1 text-muted-foreground">
                  {String(suggested.shortDescription ?? '')}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Client (marketing)
                </p>
                <p className="mt-1">
                  {(suggested.client as { name?: string } | undefined)?.name ??
                    'Confidential Client'}
                </p>
              </div>

              {eligibleMedia.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Promote images (optional)
                  </p>
                  <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto">
                    {eligibleMedia.map((m) => {
                      const checked = selectedMedia.includes(m.mediaId);
                      return (
                        <li key={m.mediaId} className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={checked}
                            onChange={() => {
                              setSelectedMedia((prev) =>
                                checked
                                  ? prev.filter((id) => id !== m.mediaId)
                                  : [...prev, m.mediaId]
                              );
                            }}
                          />
                          <span>
                            <span className="font-medium">{m.filename}</span>
                            <span className="block text-xs text-muted-foreground">
                              {m.milestoneName} · {m.deliverableName}
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No deliverable images found — add media in the portfolio editor later.
                </p>
              )}
            </div>
          ) : null}

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" className="rounded-lg" onClick={() => setWizardOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-lg"
              disabled={createM.isPending || blockers.length > 0 || previewQ.isPending}
              onClick={() => createM.mutate()}
            >
              {createM.isPending ? 'Creating…' : 'Create draft'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
