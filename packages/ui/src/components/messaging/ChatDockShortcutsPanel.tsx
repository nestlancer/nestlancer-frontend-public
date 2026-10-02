'use client';

import { CHAT_DOCK_SHORTCUTS } from './chat-dock-constants';

export function ChatDockShortcutsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="chat-dock-shortcuts" role="dialog" aria-label="Chat dock keyboard shortcuts">
      <div className="chat-dock-shortcuts-header">
        <p className="chat-dock-shortcuts-title">Chat dock shortcuts</p>
        <button
          type="button"
          className="chat-dock-shortcuts-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <ul className="chat-dock-shortcuts-list">
        {CHAT_DOCK_SHORTCUTS.map((item) => (
          <li key={item.keys} className="chat-dock-shortcuts-row">
            <kbd className="chat-dock-shortcuts-kbd">{item.keys}</kbd>
            <span>{item.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
