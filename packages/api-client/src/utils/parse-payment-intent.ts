import { peelSuccessEnvelope } from './peel-success-envelope';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export type ParsedPaymentIntent = {
  id?: string;
  projectId?: string;
  amount?: number;
  currency?: string;
  clientSecret?: string;
  status?: string;
};

/** Normalize create-intent / initiate responses from gateway or payments service. */
export function parsePaymentIntentResult(raw: unknown): ParsedPaymentIntent {
  const peeled = peelSuccessEnvelope(raw);
  const candidates: Record<string, unknown>[] = [];

  if (isRecord(peeled)) {
    candidates.push(peeled);
    if (isRecord(peeled.data)) candidates.push(peeled.data);
    if (isRecord(peeled.payment)) candidates.push(peeled.payment);
  }

  for (const o of candidates) {
    const orderId =
      o.clientSecret ??
      o.intentId ??
      o.orderId ??
      o.order_id ??
      o.razorpay_order_id;

    if (typeof orderId === 'string' && orderId.length > 0) {
      return {
        id: typeof o.id === 'string' ? o.id : undefined,
        projectId: typeof o.projectId === 'string' ? o.projectId : undefined,
        amount: typeof o.amount === 'number' ? o.amount : undefined,
        currency: typeof o.currency === 'string' ? o.currency : undefined,
        clientSecret: orderId,
        status: typeof o.status === 'string' ? o.status : undefined,
      };
    }
  }

  if (isRecord(peeled)) {
    return {
      id: typeof peeled.id === 'string' ? peeled.id : undefined,
      projectId: typeof peeled.projectId === 'string' ? peeled.projectId : undefined,
      amount: typeof peeled.amount === 'number' ? peeled.amount : undefined,
      currency: typeof peeled.currency === 'string' ? peeled.currency : undefined,
      status: typeof peeled.status === 'string' ? peeled.status : undefined,
    };
  }

  return {};
}
