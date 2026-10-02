export const CHAT_DOCK_MAX_SLOTS = 8;

export const CHAT_DOCK_SHORTCUTS = [
  { keys: 'Esc', description: 'Minimize focused conversation' },
  { keys: 'Ctrl/Cmd + .', description: 'Close focused conversation' },
  { keys: 'Ctrl/Cmd + 1–8', description: 'Focus conversation by position' },
  { keys: 'Ctrl/Cmd + Alt + [', description: 'Previous conversation' },
  { keys: 'Ctrl/Cmd + Alt + ]', description: 'Next conversation' },
  { keys: '?', description: 'Show keyboard shortcuts' },
] as const;
