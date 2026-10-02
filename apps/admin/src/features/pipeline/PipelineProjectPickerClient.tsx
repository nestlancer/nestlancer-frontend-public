'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import {
  GeCard,
  GeCardHeader,
  GePageHeader,
  GeStatusBadge,
} from '@/components/admin/AdminGentelellaUI';
import { AdminQueryState } from '@/components/admin/AdminConsolePrimitives';
import { adminKeys } from '@/lib/admin-query-keys';
import { projectProgressPercent } from '@/lib/admin-pipeline-hub';
import {
  clientEmailFromRow,
  formatAdminStatus,
  pickAdminRows,
  rowId,
  rowTitle,
} from '@/lib/admin-response';
import { apiServices } from '@/lib/axios';

import { PipelineHubTabs } from './PipelineHubTabs';

export function PipelineProjectPickerClient() {
  const [search, setSearch] = useState('');

  const listQ = useQuery({
    queryKey: [...adminKeys.root, 'projects', 'pipeline-picker', search],
    queryFn: () =>
      apiServices.admin.listAdminProjects({
        page: 1,
        limit: 25,
        search: search || undefined,
      }),
    staleTime: 30_000,
  });

  const projects = useMemo(() => pickAdminRows(listQ.data), [listQ.data]);

  return (
    <div className="space-y-4">
      <PipelineHubTabs />

      <GePageHeader
        pretitle="Operations · Project pipeline"
        title="Project hub"
        description="Select a project to open delivery 360° — milestones, payments, origin chain, and timeline."
      />

      <GeCard flush>
        <GeCardHeader title="Select project" subtitle="Search by title or id" />
        <div className="ge-card-body space-y-4">
          <input
            type="search"
            className="w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <AdminQueryState isLoading={listQ.isLoading} error={listQ.error}>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {projects.length ? (
                projects.map((p) => {
                  const id = rowId(p);
                  if (!id) return null;
                  const progress = projectProgressPercent(p);
                  return (
                    <li key={id}>
                      <Link
                        href={`/pipeline/projects/${id}`}
                        className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/40"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{rowTitle(p)}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            <span className="font-mono">{id}</span> · {clientEmailFromRow(p)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {progress}%
                          </span>
                          <GeStatusBadge status={formatAdminStatus(p.status)} />
                        </div>
                      </Link>
                    </li>
                  );
                })
              ) : (
                <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No projects found.
                </li>
              )}
            </ul>
          </AdminQueryState>
        </div>
      </GeCard>
    </div>
  );
}
