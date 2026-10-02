/** Typed socket event names — align with backend gateway */
export const SocketEvents = {
  messageNew: 'message:new',
  messageRead: 'message:read',
  typingStart: 'typing:start',
  typingStop: 'typing:stop',
  conversationView: 'conversation:view',
  notificationNew: 'notification:new',
  unreadCountUpdated: 'unreadCount.updated',
  presenceUpdate: 'presence:update',
} as const;

export type SocketEventName = (typeof SocketEvents)[keyof typeof SocketEvents];
