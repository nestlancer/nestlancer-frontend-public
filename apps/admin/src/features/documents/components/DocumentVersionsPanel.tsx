'use client';

import { openSafeHttpUrl } from '@nestlancer/utils';

import { Download, FileText, RefreshCw } from '@nestlancer/ui/icons';
import type { DocumentVersionRow } from '@nestlancer/api-client';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  ErrorState,
  Skeleton,
  StatusBadge,
} from '@nestlancer/ui';

function formatDocType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

export type DocumentLatestAction = {
  key: string;
  label: string;
  hint?: string;
  onClick: () => void | Promise<void>;
  isPending?: boolean;
  disabled?: boolean;
};

export type DocumentVersionsPanelProps = {
  title: string;
  description?: string;
  versions: DocumentVersionRow[];
  isPending?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRefresh?: () => void;
  latestActions?: DocumentLatestAction[];
  emptyDescription?: string;
  /** When false, only latest download actions are shown (user dashboard). */
  showVersionHistory?: boolean;
  onDownloadVersion?: (row: DocumentVersionRow) => void | Promise<void>;
  downloadingVersionId?: string | null;
};

function groupVersions(versions: DocumentVersionRow[]): Map<string, DocumentVersionRow[]> {
  const groups = new Map<string, DocumentVersionRow[]>();
  for (const row of versions) {
    const key = row.documentType || 'DOCUMENT';
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  for (const [key, list] of groups) {
    groups.set(
      key,
      [...list].sort((a, b) => b.versionNumber - a.versionNumber)
    );
  }
  return groups;
}

export function DocumentVersionsPanel({
  title,
  description,
  versions,
  isPending,
  isFetching,
  isError,
  errorMessage,
  onRefresh,
  latestActions = [],
  emptyDescription,
  showVersionHistory = true,
  onDownloadVersion,
  downloadingVersionId = null,
}: DocumentVersionsPanelProps) {
  if (!showVersionHistory) {
    return (
      <Card className="border-border/80">
        <CardHeader className="gap-2 space-y-0">
          <h2 className="text-base font-semibold">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </CardHeader>
        {latestActions.length > 0 ? (
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {latestActions.map((action) => (
                <Button
                  key={action.key}
                  type="button"
                  variant="default"
                  size="sm"
                  disabled={action.disabled || action.isPending}
                  onClick={() => void action.onClick()}
                >
                  <Download className="h-4 w-4" aria-hidden />
                  {action.isPending ? 'Preparing…' : action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        ) : null}
      </Card>
    );
  }

  if (isPending) {
    return (
      <Card className="border-border/80">
        <CardHeader>
          <h2 className="text-base font-semibold">{title}</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title={`Could not load ${title.toLowerCase()}`}
        message={errorMessage ?? 'Try refreshing the version list.'}
        onRetry={onRefresh}
      />
    );
  }

  const grouped = groupVersions(versions);
  const totalVersions = versions.length;

  return (
    <Card className="border-border/80">
      <CardHeader className="gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">{title}</h2>
            <StatusBadge variant="neutral">
              {totalVersions} version{totalVersions === 1 ? '' : 's'}
            </StatusBadge>
            {isFetching ? (
              <StatusBadge variant="info">Updating…</StatusBadge>
            ) : (
              <StatusBadge variant="success">Live</StatusBadge>
            )}
          </div>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {onRefresh ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden />
            Refresh
          </Button>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-5">
        {latestActions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {latestActions.map((action) => (
              <Button
                key={action.key}
                type="button"
                variant="default"
                size="sm"
                disabled={action.disabled || action.isPending}
                onClick={() => void action.onClick()}
              >
                <Download className="h-4 w-4" aria-hidden />
                {action.isPending ? 'Preparing…' : action.label}
              </Button>
            ))}
          </div>
        ) : null}

        {totalVersions === 0 ? (
          <EmptyState
            title="No documents yet"
            description={
              emptyDescription ??
              'Generated PDFs will appear here once they are created by the system.'
            }
          />
        ) : (
          [...grouped.entries()].map(([docType, rows]) => {
            const latest = rows.find((row) => row.isLatest) ?? rows[0];
            return (
              <section key={docType} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{formatDocType(docType)}</h3>
                  {latest ? (
                    <p className="text-xs text-muted-foreground">
                      Latest: {latest.documentNumber} · v{latest.versionNumber}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  {rows.map((row) => (
                    <div
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/20 px-4 py-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
                          <span className="font-medium">{row.documentNumber || 'Document'}</span>
                          <StatusBadge variant="neutral">v{row.versionNumber}</StatusBadge>
                          {row.isLatest ? (
                            <StatusBadge variant="success">Latest</StatusBadge>
                          ) : null}
                          {row.isImmutable ? (
                            <StatusBadge variant="warning">Signed</StatusBadge>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(row.issuedAt)}
                          {row.changeReason ? ` · ${row.changeReason}` : ''}
                        </p>
                      </div>
                      {onDownloadVersion || row.downloadUrl ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={downloadingVersionId === row.id}
                          onClick={() => {
                            if (onDownloadVersion) {
                              void onDownloadVersion(row);
                              return;
                            }
                            if (row.downloadUrl) {
                              openSafeHttpUrl(row.downloadUrl);
                            }
                          }}
                        >
                          <Download className="h-4 w-4" aria-hidden />
                          {downloadingVersionId === row.id ? 'Preparing…' : 'Download'}
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
