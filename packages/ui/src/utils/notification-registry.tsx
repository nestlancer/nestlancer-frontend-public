'use client';

import type { ComponentType } from 'react';

import {
  AlertTriangle,
  Bell,
  ClipboardList,
  CreditCard,
  Download,
  FileText,
  Lock,
  MessageSquare,
  Package,
  Receipt,
  ShieldAlert,
} from '../icons';

export type NotificationIconConfig = {
  Icon: ComponentType<{ className?: string }>;
  className: string;
};

const DEFAULT_ICON: NotificationIconConfig = {
  Icon: Bell,
  className: 'bg-[hsl(var(--status-warning)/0.12)] text-[hsl(var(--status-warning))]',
};

function byPrefix(
  type: string,
  prefix: string,
  config: NotificationIconConfig
): NotificationIconConfig | null {
  return type.startsWith(prefix) ? config : null;
}

/** Map canonical notification `type` strings to icon + color classes. */
export function resolveNotificationIcon(
  type?: string,
  title = '',
  message = ''
): NotificationIconConfig {
  if (type) {
    const map: Array<NotificationIconConfig | null> = [
      byPrefix(type, 'quote.', {
        Icon: Receipt,
        className: 'bg-[hsl(var(--status-info)/0.12)] text-[hsl(var(--status-info))]',
      }),
      byPrefix(type, 'payment.', {
        Icon: CreditCard,
        className: 'bg-[hsl(var(--status-success)/0.12)] text-[hsl(var(--status-success))]',
      }),
      byPrefix(type, 'message.', {
        Icon: MessageSquare,
        className: 'bg-[hsl(var(--status-purple)/0.12)] text-[hsl(var(--status-purple))]',
      }),
      byPrefix(type, 'request.', {
        Icon: ClipboardList,
        className: 'bg-[hsl(var(--status-info)/0.12)] text-[hsl(var(--status-info))]',
      }),
      byPrefix(type, 'deliverable.', {
        Icon: Package,
        className: 'bg-[hsl(var(--status-info)/0.12)] text-[hsl(var(--status-info))]',
      }),
      byPrefix(type, 'export.', {
        Icon: Download,
        className: 'bg-[hsl(var(--status-info)/0.12)] text-[hsl(var(--status-info))]',
      }),
      byPrefix(type, 'document.', {
        Icon: FileText,
        className: 'bg-[hsl(var(--status-info)/0.12)] text-[hsl(var(--status-info))]',
      }),
      byPrefix(type, 'account.', {
        Icon: Lock,
        className: 'bg-[hsl(var(--status-error)/0.12)] text-[hsl(var(--status-error))]',
      }),
      byPrefix(type, 'security.', {
        Icon: Lock,
        className: 'bg-[hsl(var(--status-error)/0.12)] text-[hsl(var(--status-error))]',
      }),
      byPrefix(type, 'media.', {
        Icon: ShieldAlert,
        className: 'bg-[hsl(var(--status-error)/0.12)] text-[hsl(var(--status-error))]',
      }),
      byPrefix(type, 'comment.', {
        Icon: ShieldAlert,
        className: 'bg-[hsl(var(--status-warning)/0.12)] text-[hsl(var(--status-warning))]',
      }),
      byPrefix(type, 'feedback.', {
        Icon: MessageSquare,
        className: 'bg-[hsl(var(--status-purple)/0.12)] text-[hsl(var(--status-purple))]',
      }),
      byPrefix(type, 'project.', {
        Icon: Package,
        className: 'bg-[hsl(var(--status-info)/0.12)] text-[hsl(var(--status-info))]',
      }),
      byPrefix(type, 'milestone.', {
        Icon: Package,
        className: 'bg-[hsl(var(--status-success)/0.12)] text-[hsl(var(--status-success))]',
      }),
    ];
    const match = map.find(Boolean);
    if (match) return match;
    if (type === 'payment.disputeOpened' || type === 'message.flagged') {
      return {
        Icon: ShieldAlert,
        className: 'bg-[hsl(var(--status-error)/0.12)] text-[hsl(var(--status-error))]',
      };
    }
  }

  const text = `${title} ${message}`.toLowerCase();
  if (text.includes('payment') || text.includes('invoice') || text.includes('billing')) {
    return {
      Icon: CreditCard,
      className: 'bg-[hsl(var(--status-success)/0.12)] text-[hsl(var(--status-success))]',
    };
  }
  if (text.includes('message') || text.includes('chat')) {
    return {
      Icon: MessageSquare,
      className: 'bg-[hsl(var(--status-purple)/0.12)] text-[hsl(var(--status-purple))]',
    };
  }
  if (text.includes('upload') || text.includes('deliverable') || text.includes('file')) {
    return {
      Icon: Package,
      className: 'bg-[hsl(var(--status-info)/0.12)] text-[hsl(var(--status-info))]',
    };
  }
  if (text.includes('export') || text.includes('download')) {
    return {
      Icon: Download,
      className: 'bg-[hsl(var(--status-info)/0.12)] text-[hsl(var(--status-info))]',
    };
  }
  if (text.includes('security') || text.includes('password') || text.includes('suspended')) {
    return {
      Icon: AlertTriangle,
      className: 'bg-[hsl(var(--status-error)/0.12)] text-[hsl(var(--status-error))]',
    };
  }

  return DEFAULT_ICON;
}
