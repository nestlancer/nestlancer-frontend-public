/** Client-generated Idempotency-Key for payment/admin mutations (NL-BV-C1-09). */
export function newIdempotencyKey(prefix: string): string {
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  return `${prefix}-${id}`;
}

export function withIdempotencyHeaders(prefix: string): { headers: Record<string, string> } {
  return { headers: { 'Idempotency-Key': newIdempotencyKey(prefix) } };
}
