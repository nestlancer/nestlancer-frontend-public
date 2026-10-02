export const ImpersonationMessage = {
  ready: 'nl.impersonate.ready',
  start: 'nl.impersonate.start',
  ack: 'nl.impersonate.ack',
  end: 'nl.impersonate.end',
} as const;

export interface ImpersonationStartMessage {
  type: typeof ImpersonationMessage.start;
  accessToken: string;
  sessionId: string;
  expiresAt: string;
  email?: string;
}

export interface ImpersonationEndMessage {
  type: typeof ImpersonationMessage.end;
  sessionId: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isImpersonationReadyMessage(data: unknown): boolean {
  return isRecord(data) && data.type === ImpersonationMessage.ready;
}

export function isImpersonationAckMessage(data: unknown): boolean {
  return isRecord(data) && data.type === ImpersonationMessage.ack;
}

export function readImpersonationStartMessage(data: unknown): ImpersonationStartMessage | null {
  if (!isRecord(data) || data.type !== ImpersonationMessage.start) return null;
  if (typeof data.accessToken !== 'string' || typeof data.sessionId !== 'string') return null;
  if (typeof data.expiresAt !== 'string') return null;
  const email = typeof data.email === 'string' ? data.email : undefined;
  return {
    type: ImpersonationMessage.start,
    accessToken: data.accessToken,
    sessionId: data.sessionId,
    expiresAt: data.expiresAt,
    email,
  };
}

export function readImpersonationEndMessage(data: unknown): ImpersonationEndMessage | null {
  if (!isRecord(data) || data.type !== ImpersonationMessage.end) return null;
  if (
    typeof data.sessionId !== 'string' ||
    data.sessionId.length === 0 ||
    data.sessionId.length > 80
  ) {
    return null;
  }
  return { type: ImpersonationMessage.end, sessionId: data.sessionId };
}
