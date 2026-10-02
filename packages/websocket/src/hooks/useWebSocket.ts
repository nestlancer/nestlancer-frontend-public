'use client';

import { useWebSocketContext } from '../WebSocketProvider';

export function useWebSocket() {
  return useWebSocketContext();
}
