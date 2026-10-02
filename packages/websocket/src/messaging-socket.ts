import { io, type Socket } from 'socket.io-client';

let messagingSocket: Socket | null = null;
let lastKey = '';
let refCount = 0;
let pendingDisconnect: ReturnType<typeof setTimeout> | null = null;

function resolveSocketPath(explicit?: string): string {
  if (explicit) return explicit;
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SOCKET_IO_PATH) {
    return process.env.NEXT_PUBLIC_SOCKET_IO_PATH;
  }
  return '/ws/socket.io';
}

function teardown(): void {
  if (!messagingSocket) return;
  messagingSocket.removeAllListeners();
  messagingSocket.disconnect();
  messagingSocket = null;
  lastKey = '';
  refCount = 0;
}

/**
 * Reference-counted Socket.IO client for the `/messages` namespace.
 * Prevents duplicate handshakes from inbox realtime, peer views, and status probes.
 */
export function getMessagingSocket(wsUrl: string, token?: string, socketPath?: string): Socket {
  const path = resolveSocketPath(socketPath);
  const base = wsUrl.replace(/\/$/, '');
  const nsUrl = base.endsWith('/messages') ? base : `${base}/messages`;
  const key = `${nsUrl}|${path}|${token ?? ''}`;

  if (pendingDisconnect) {
    clearTimeout(pendingDisconnect);
    pendingDisconnect = null;
  }

  if (messagingSocket && lastKey === key) {
    refCount += 1;
    return messagingSocket;
  }

  if (messagingSocket) {
    teardown();
  }

  lastKey = key;
  refCount = 1;
  messagingSocket = io(nsUrl, {
    path,
    transports: ['websocket', 'polling'],
    auth: token ? { token } : undefined,
    // Marker only — JWT stays in `auth` (NL-BUG-PAY-003). Engine.IO allowRequest
    // accepts auth=1 or access_token cookie; middleware validates auth.token.
    query: token ? { auth: '1' } : undefined,
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 12,
    reconnectionDelayMax: 10_000,
  });

  return messagingSocket;
}

export function releaseMessagingSocket(graceMs = 100): void {
  if (!messagingSocket) return;
  refCount = Math.max(0, refCount - 1);
  if (refCount > 0) return;

  if (pendingDisconnect) clearTimeout(pendingDisconnect);
  pendingDisconnect = setTimeout(() => {
    pendingDisconnect = null;
    if (refCount === 0) teardown();
  }, graceMs);
}

export function disconnectMessagingSocket(): void {
  if (pendingDisconnect) {
    clearTimeout(pendingDisconnect);
    pendingDisconnect = null;
  }
  teardown();
}
