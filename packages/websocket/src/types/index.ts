import type { SocketEventName } from '@nestlancer/types';

export interface ServerToClientEvents {
  [key: string]: (...args: unknown[]) => void;
}

export interface ClientToServerEvents {
  join: (roomId: string) => void;
  leave: (roomId: string) => void;
  ping: () => void;
}

export type { SocketEventName };
