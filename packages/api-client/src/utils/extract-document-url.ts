import { peelSuccessEnvelope } from './peel-success-envelope';
import { unwrapGatewayBody } from './unwrap-gateway-body';

type DocumentUrlPayload = {
  url?: string | { url?: string };
  downloadUrl?: string;
  pdfUrl?: string;
};

/** Extract a presigned document URL from gateway-wrapped API responses. */
export function extractDocumentUrl(raw: unknown): string | null {
  const failure = extractDocumentApiFailure(raw);
  if (failure) return null;

  const inner = unwrapGatewayBody<DocumentUrlPayload>(raw);
  const peeled = peelSuccessEnvelope(raw) as DocumentUrlPayload;
  const candidate =
    inner?.downloadUrl ??
    inner?.pdfUrl ??
    inner?.url ??
    peeled?.downloadUrl ??
    peeled?.pdfUrl ??
    peeled?.url;

  if (typeof candidate === 'string' && candidate.length > 0) return candidate;
  if (candidate && typeof candidate === 'object' && typeof candidate.url === 'string') {
    return candidate.url;
  }
  return null;
}

/** Detect gateway-wrapped HTTP errors returned with a 200 envelope (e.g. PDF generation 500). */
export function extractDocumentApiFailure(raw: unknown): string | null {
  const inner = unwrapGatewayBody<Record<string, unknown>>(raw);
  const peeled = peelSuccessEnvelope(raw) as Record<string, unknown> | null;
  for (const candidate of [inner, peeled]) {
    if (!candidate || typeof candidate !== 'object') continue;
    const statusCode = Number(candidate.statusCode);
    if (Number.isFinite(statusCode) && statusCode >= 400) {
      const message = candidate.message;
      return typeof message === 'string' && message.length > 0
        ? message
        : 'Document could not be generated';
    }
    if (candidate.status === 'error' && typeof candidate.message === 'string') {
      return candidate.message;
    }
  }
  return null;
}

export type DocumentVersionRow = {
  id: string;
  documentNumber: string;
  versionNumber: number;
  documentType: string;
  issuedAt?: string;
  changeReason?: string | null;
  isLatest?: boolean;
  isImmutable?: boolean;
  downloadUrl?: string;
};

export type DocumentVerifyResult = {
  documentNumber: string;
  type: string;
  version?: number;
  status: string;
  issuedAt?: string;
  entityRef?: string;
  fileHash?: string | null;
  isLatest?: boolean;
};

function asVersionRows(raw: unknown): DocumentVersionRow[] {
  const inner = unwrapGatewayBody<unknown>(raw);
  const peeled = peelSuccessEnvelope(raw);
  const payload =
    inner && typeof inner === 'object' ? (inner as Record<string, unknown>) : undefined;

  if (Array.isArray(inner)) return mapVersionRows(inner);
  if (Array.isArray(peeled)) return mapVersionRows(peeled);
  if (Array.isArray(payload?.versions)) return mapVersionRows(payload.versions as unknown[]);

  const merged: unknown[] = [];
  if (Array.isArray(payload?.invoices)) merged.push(...payload.invoices);
  if (Array.isArray(payload?.receipts)) merged.push(...payload.receipts);
  if (Array.isArray(payload?.quotes)) merged.push(...payload.quotes);
  if (Array.isArray(payload?.contracts)) merged.push(...payload.contracts);
  if (merged.length > 0) return mapVersionRows(merged);

  return [];
}

function mapVersionRows(rows: unknown[]): DocumentVersionRow[] {
  return rows
    .filter((row): row is Record<string, unknown> => Boolean(row && typeof row === 'object'))
    .map((row) => ({
      id: String(row.id ?? ''),
      documentNumber: String(row.documentNumber ?? ''),
      versionNumber: Number(row.versionNumber ?? 1),
      documentType: String(row.documentType ?? ''),
      issuedAt: row.issuedAt != null ? String(row.issuedAt) : undefined,
      changeReason: row.changeReason != null ? String(row.changeReason) : null,
      isLatest: Boolean(row.isLatest),
      isImmutable: Boolean(row.isImmutable),
      downloadUrl: row.downloadUrl != null ? String(row.downloadUrl) : undefined,
    }))
    .filter((row) => row.id.length > 0);
}

export function extractDocumentVersions(raw: unknown): DocumentVersionRow[] {
  return asVersionRows(raw).sort((a, b) => {
    const typeCmp = a.documentType.localeCompare(b.documentType);
    if (typeCmp !== 0) return typeCmp;
    return b.versionNumber - a.versionNumber;
  });
}

export function extractDocumentVerify(raw: unknown): DocumentVerifyResult | null {
  const inner = unwrapGatewayBody<DocumentVerifyResult | null>(raw);
  const peeled = peelSuccessEnvelope(raw) as DocumentVerifyResult | null;
  const candidate = inner ?? peeled;
  if (!candidate || typeof candidate !== 'object' || !('documentNumber' in candidate)) {
    return null;
  }
  const status = String((candidate as DocumentVerifyResult).status ?? '').toUpperCase();
  if (!status || status === 'NOT_FOUND') {
    return null;
  }
  return candidate;
}
