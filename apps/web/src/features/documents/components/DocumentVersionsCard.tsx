'use client';

import { Download, FileText } from '@nestlancer/ui/icons';
import type { DocumentVersionRow } from '@nestlancer/api-client';
import { safeHttpUrl } from '@nestlancer/utils';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
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

export function DocumentVersionsCard({
  title,
  versions,
  isPending,
  emptyDescription,
}: {
  title: string;
  versions: DocumentVersionRow[];
  isPending?: boolean;
  emptyDescription?: string;
}) {
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

  if (versions.length === 0) {
    return (
      <Card className="border-border/80">
        <CardHeader>
          <h2 className="text-base font-semibold">{title}</h2>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No documents yet"
            description={
              emptyDescription ??
              'Generated PDFs will appear here once they are created by the system.'
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/80">
      <CardHeader>
        <h2 className="text-base font-semibold">{title}</h2>
      </CardHeader>
      <CardContent className="space-y-3">
        {versions.map((row) => (
          <div
            key={row.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 px-4 py-3"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
                <span className="font-medium">{row.documentNumber || 'Document'}</span>
                <StatusBadge variant="neutral">v{row.versionNumber}</StatusBadge>
                {row.isLatest ? <StatusBadge variant="success">Latest</StatusBadge> : null}
                {row.isImmutable ? <StatusBadge variant="warning">Signed</StatusBadge> : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDocType(row.documentType)} · {formatDate(row.issuedAt)}
                {row.changeReason ? ` · ${row.changeReason}` : ''}
              </p>
            </div>
            {safeHttpUrl(row.downloadUrl) ? (
              <Button type="button" variant="outline" size="sm" asChild>
                <a
                  href={safeHttpUrl(row.downloadUrl) ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Download
                </a>
              </Button>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
