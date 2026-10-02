'use client';

import { useEffect } from 'react';

import { useWebSocketContext } from '../WebSocketProvider';

export function useSocketRoom(roomId: string | undefined): void {
  const { socket } = useWebSocketContext();

  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit('join', roomId);
    return () => {
      socket.emit('leave', roomId);
    };
  }, [socket, roomId]);
}
