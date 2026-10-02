type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'purple' | 'neutral';

function normalizeStatus(status: string): string {
  return status.toLowerCase().replace(/\s+/g, '_');
}

/** Map arbitrary API status strings to semantic badge variants. */
export function resolveGenericStatusVariant(status: string): StatusVariant {
  const key = normalizeStatus(status);
  const upper = status.toUpperCase();

  // Contact inquiry statuses (admin /contact inbox)
  if (upper === 'NEW') return 'info';
  if (upper === 'READ') return 'warning';
  if (upper === 'RESPONDED') return 'success';
  if (upper === 'SPAM') return 'error';
  if (upper === 'ARCHIVED') return 'neutral';

  if (
    ['active', 'completed', 'paid', 'verified', 'approved', 'healthy', 'success', 'ready'].some(
      (x) => key.includes(x) || upper.includes(x.toUpperCase())
    )
  ) {
    return 'success';
  }
  if (
    ['pending', 'open', 'processing', 'submitted', 'flagged', 'draft'].some(
      (x) => key.includes(x) || upper.includes(x.toUpperCase())
    )
  ) {
    return 'warning';
  }
  if (
    [
      'failed',
      'rejected',
      'cancelled',
      'canceled',
      'deleted',
      'suspended',
      'quarantined',
      'spam',
    ].some((x) => key.includes(x) || upper.includes(x.toUpperCase()))
  ) {
    return 'error';
  }
  if (['sent', 'info', 'quoted', 'review', 'new', 'read'].some((x) => key.includes(x))) {
    return 'info';
  }
  return 'neutral';
}

export function resolvePaymentStatusVariant(status: string): StatusVariant {
  const key = normalizeStatus(status);
  if (key.includes('complete') || key.includes('paid') || key.includes('success')) return 'success';
  if (key.includes('fail') || key.includes('reject') || key.includes('refund')) return 'error';
  if (key.includes('pending') || key.includes('process') || key.includes('hold')) return 'warning';
  return resolveGenericStatusVariant(status);
}

export function resolveMediaStatusVariant(status: string): StatusVariant {
  const key = normalizeStatus(status);
  if (key === 'ready') return 'success';
  if (key === 'quarantined') return 'error';
  if (key === 'processing') return 'warning';
  return 'neutral';
}

export function statusToneToVariant(tone: 'good' | 'warn' | 'bad' | 'neutral'): StatusVariant {
  if (tone === 'good') return 'success';
  if (tone === 'warn') return 'warning';
  if (tone === 'bad') return 'error';
  return 'neutral';
}
