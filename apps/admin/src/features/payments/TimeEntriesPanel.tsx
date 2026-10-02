'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { formatIsoDate } from '@nestlancer/utils';
import { Button, Input, Textarea } from '@nestlancer/ui';

import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminRows, rowId } from '@/lib/admin-response';
import { apiServices } from '@/lib/axios';

export function TimeEntriesPanel({
  projectId,
  milestoneId,
}: {
  projectId: string;
  milestoneId?: string;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState('1');
  const [description, setDescription] = useState('');
  const [workedAt, setWorkedAt] = useState(new Date().toISOString().slice(0, 10));
  const [entryMilestoneId, setEntryMilestoneId] = useState(milestoneId ?? '');

  const q = useQuery({
    queryKey: adminKeys.timeEntries(projectId),
    queryFn: () => apiServices.admin.listTimeEntries({ projectId }),
    enabled: open,
  });

  const createM = useMutation({
    mutationFn: () =>
      apiServices.admin.createTimeEntry({
        projectId,
        milestoneId: entryMilestoneId.trim() || undefined,
        hours: Number(hours),
        description: description.trim() || undefined,
        workedAt: workedAt ? new Date(`${workedAt}T12:00:00`).toISOString() : undefined,
      }),
    onSuccess: () => {
      toast.success('Time entry logged');
      setDescription('');
      setHours('1');
      void qc.invalidateQueries({ queryKey: adminKeys.timeEntries(projectId) });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const rows = pickAdminRows(q.data);

  return (
    <section className="rounded-lg border border-border/70 bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">Time entries</h3>
          <p className="text-xs text-muted-foreground">Admin time logged against this project</p>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide' : 'Show'}
        </Button>
      </div>

      {open ? (
        <div className="space-y-4 p-4">
          <div className="grid gap-2 sm:grid-cols-4">
            <Input
              type="number"
              min={0.25}
              step={0.25}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="e.g. 2.5"
              aria-label="Hours"
            />
            <Input
              type="date"
              value={workedAt}
              onChange={(e) => setWorkedAt(e.target.value)}
              aria-label="Worked at"
            />
            <Input
              value={entryMilestoneId}
              onChange={(e) => setEntryMilestoneId(e.target.value)}
              placeholder="Milestone ID (optional)"
              aria-label="Milestone ID"
            />
            <Button
              size="sm"
              disabled={!hours || Number(hours) <= 0 || createM.isPending}
              onClick={() => createM.mutate()}
            >
              {createM.isPending ? 'Saving…' : 'Log time'}
            </Button>
          </div>
          <Textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What was worked on…"
          />

          {q.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading entries…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No time entries yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {rows.map((row) => (
                <li
                  key={rowId(row) || String(row.workedAt ?? Math.random())}
                  className="flex justify-between gap-3 rounded-md border border-border/50 px-3 py-2"
                >
                  <div>
                    <p className="font-medium tabular-nums">{String(row.hours ?? '—')}h</p>
                    <p className="text-xs text-muted-foreground">
                      {String(row.description ?? 'No description')}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {row.workedAt ? formatIsoDate(String(row.workedAt), 'PP') : '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}
