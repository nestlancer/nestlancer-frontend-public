function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Strip active markup before an email preview iframe.
 * `sandbox=""` is the boundary; this keeps scripts and handlers out of srcDoc.
 * Event handlers are matched on a word boundary so `<img/onerror=…>` is removed.
 */
export function neutralizeEmailHtml(html: string): string {
  return html
    .replace(
      /<\s*(script|iframe|object|embed|link|meta|base|form)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
      ''
    )
    .replace(/<\s*\/?\s*(script|iframe|object|embed|link|meta|base|form)\b[^>]*>/gi, '')
    .replace(/\bon[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, '');
}

/** Wrap template HTML (or plain text) in a document that renders like a received email. */
export function toEmailPreviewDocument(raw: string): string {
  const trimmed = raw.trim();
  const looksHtml = /<\/?[a-z][\s\S]*>/i.test(trimmed);
  const body = looksHtml
    ? neutralizeEmailHtml(trimmed)
    : `<pre style="margin:0;padding:20px;font:14px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;white-space:pre-wrap;word-break:break-word;">${escapeHtml(trimmed)}</pre>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data: blob:; style-src 'unsafe-inline'; font-src https: data:; media-src https: data:;"/><style>
    html,body{margin:0;padding:0;background:#ffffff;color:#111827;}
    img{max-width:100%;height:auto;}
    a{color:#2563eb;}
  </style></head><body>${body}</body></html>`;
}
