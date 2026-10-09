import { io, type Socket } from 'socket.io-client';

import { resolveCorrelationId } from '@nestlancer/config/correlation-id.mjs';

let socket: Socket | null = null;
let lastKey = '';
let refCount = 0;
let pendingDisconnect: ReturnType<typeof setTimeout> | null = null;

export interface GetSocketOptions {
  /** Socket.IO `path` option (default `/ws/socket.io` for Nestlancer dev gateway). */
  path?: string;
}

function resolveSocketPath(explicit?: string): string {
  if (explicit) return explicit;
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SOCKET_IO_PATH) {
    return process.env.NEXT_PUBLIC_SOCKET_IO_PATH;
  }
  return '/ws/socket.io';
}

function teardown(): void {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  lastKey = '';
  refCount = 0;
}

/**
 * Acquire a shared socket.io client. Reference-counted so that React StrictMode's
 * mount/unmount/remount cycle does not destroy an in-flight WebSocket handshake.
 * Pair every call with `releaseSocket()` (typically in a `useEffect` cleanup).
 */
export function getSocket(url: string, token?: string, options?: GetSocketOptions): Socket {
  const path = resolveSocketPath(options?.path);
  const correlationId = resolveCorrelationId();
  const key = `${url}|${path}|${token ?? ''}|${correlationId}`;

  if (pendingDisconnect) {
    clearTimeout(pendingDisconnect);
    pendingDisconnect = null;
  }

  if (socket && lastKey === key) {
    refCount += 1;
    return socket;
  }

  if (socket) {
    teardown();
  }

  lastKey = key;
  refCount = 1;
  socket = io(url, {
    path,
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelayMax: 10_000,
    auth: {
      ...(token ? { token } : {}),
      correlationId,
    },
    // Marker only — never put the JWT in the query string (NL-BUG-PAY-003).
    // Engine.IO allowRequest accepts auth=1; the real token rides in `auth`.
    query: token ? { auth: '1' } : undefined,
    extraHeaders: {
      'X-Correlation-ID': correlationId,
      'X-Request-ID': correlationId,
    },
    // Bearer auth only — do not send HttpOnly refresh cookies to WS gateway (NL-BV-C1-04).
    withCredentials: false,
  });

  return socket;
}

/**
 * Decrement the reference count. When it reaches zero the socket is torn down
 * after a short grace period so a sibling re-mount (StrictMode, route change)
 * can re-acquire the same connection without an interrupted handshake.
 */
export function releaseSocket(graceMs = 100): void {
  if (!socket) return;
  refCount = Math.max(0, refCount - 1);
  if (refCount > 0) return;

  if (pendingDisconnect) clearTimeout(pendingDisconnect);
  pendingDisconnect = setTimeout(() => {
    pendingDisconnect = null;
    if (refCount === 0) teardown();
  }, graceMs);
}

/**
 * Force an immediate disconnect (e.g. on logout). Resets the refcount and
 * cancels any pending grace-period teardown.
 */
export function disconnectSocket(): void {
  if (pendingDisconnect) {
    clearTimeout(pendingDisconnect);
    pendingDisconnect = null;
  }
  teardown();
}
