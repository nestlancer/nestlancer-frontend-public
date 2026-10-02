'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { analyticsEvents, isFeatureEnabled } from '@nestlancer/constants';
import {
  Activity,
  Briefcase,
  ClipboardList,
  CreditCard,
  FileStack,
  FileText,
  FolderKanban,
  Gauge,
  HardDrive,
  Inbox,
  MessageSquare,
  Moon,
  Newspaper,
  Receipt,
  ScrollText,
  Settings2,
  ShieldAlert,
  Sun,
  Users,
  Webhook,
} from '@nestlancer/ui/icons';

import {
  CommandPalette,
  useCommandPaletteShortcut,
  useTheme,
  type CommandItem,
} from '@nestlancer/ui';
import { trackEvent } from '@/lib/telemetry';

const NAV_ITEMS: { id: string; label: string; href: string; group: string; icon: ReactNode }[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    group: 'Operations',
    icon: <Gauge className="h-4 w-4" />,
  },
  {
    id: 'pipeline',
    label: 'Pipelines',
    href: '/pipeline',
    group: 'Operations',
    icon: <FileStack className="h-4 w-4" />,
  },
  {
    id: 'pipeline-users',
    label: 'Pipeline · User hub',
    href: '/pipeline/users',
    group: 'Operations',
    icon: <Users className="h-4 w-4" />,
  },
  {
    id: 'pipeline-projects',
    label: 'Pipeline · Project hub',
    href: '/pipeline/projects',
    group: 'Operations',
    icon: <FolderKanban className="h-4 w-4" />,
  },
  {
    id: 'contact',
    label: 'Inquiries',
    href: '/contact',
    group: 'Operations',
    icon: <Inbox className="h-4 w-4" />,
  },
  {
    id: 'requests',
    label: 'Requests',
    href: '/requests',
    group: 'Operations',
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    id: 'quotes',
    label: 'Quotes',
    href: '/quotes',
    group: 'Operations',
    icon: <Receipt className="h-4 w-4" />,
  },
  {
    id: 'projects',
    label: 'Projects',
    href: '/projects',
    group: 'Operations',
    icon: <FolderKanban className="h-4 w-4" />,
  },
  {
    id: 'users',
    label: 'Users',
    href: '/users',
    group: 'Operations',
    icon: <Users className="h-4 w-4" />,
  },
  {
    id: 'payments',
    label: 'Payments',
    href: '/payments',
    group: 'Operations',
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    id: 'payment-accounts',
    label: 'Settlement accounts',
    href: '/payments/accounts',
    group: 'Operations',
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    id: 'company-legal',
    label: 'Company legal identity',
    href: '/payments/company-legal',
    group: 'Operations',
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    id: 'contact',
    label: 'Inquiries',
    href: '/contact',
    group: 'Operations',
    icon: <Inbox className="h-4 w-4" />,
  },
  {
    id: 'messages',
    label: 'Messages',
    href: '/messages',
    group: 'Operations',
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    id: 'moderation',
    label: 'Moderation',
    href: '/moderation',
    group: 'Operations',
    icon: <ShieldAlert className="h-4 w-4" />,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/analytics',
    group: 'Operations',
    icon: <Activity className="h-4 w-4" />,
  },
  {
    id: 'content',
    label: 'Blog',
    href: '/content',
    group: 'Content',
    icon: <Newspaper className="h-4 w-4" />,
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    href: '/portfolio',
    group: 'Content',
    icon: <Briefcase className="h-4 w-4" />,
  },
  {
    id: 'media',
    label: 'Media Library',
    href: '/media',
    group: 'Content',
    icon: <HardDrive className="h-4 w-4" />,
  },
  {
    id: 'system',
    label: 'System Config',
    href: '/system',
    group: 'System',
    icon: <Settings2 className="h-4 w-4" />,
  },
  {
    id: 'integrations',
    label: 'Webhooks',
    href: '/integrations',
    group: 'System',
    icon: <Webhook className="h-4 w-4" />,
  },
  {
    id: 'audit',
    label: 'Audit Logs',
    href: '/audit',
    group: 'System',
    icon: <ScrollText className="h-4 w-4" />,
  },
];

export function AdminCommandPalette() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const enabled = isFeatureEnabled('commandPaletteAdmin', true);

  useCommandPaletteShortcut(() => {
    if (!enabled) return;
    trackEvent(analyticsEvents.commandPaletteOpened, { source: 'shortcut', app: 'admin' });
    setOpen(true);
  });

  const items = useMemo<CommandItem[]>(
    () => [
      ...NAV_ITEMS.map((item) => ({
        id: item.id,
        group: item.group,
        label: item.label,
        icon: item.icon,
        onSelect: () => {
          trackEvent(analyticsEvents.commandPaletteItemSelected, {
            app: 'admin',
            itemId: item.id,
            target: item.href,
          });
          router.push(item.href);
        },
      })),
      {
        id: 'new-blog-post',
        group: 'Quick actions',
        label: 'Create blog post',
        icon: <FileText className="h-4 w-4" aria-hidden />,
        onSelect: () => router.push('/content/posts/new'),
      },
      {
        id: 'new-portfolio',
        group: 'Quick actions',
        label: 'New portfolio item',
        icon: <Briefcase className="h-4 w-4" aria-hidden />,
        onSelect: () => router.push('/portfolio/new'),
      },
      {
        id: 'message-client',
        group: 'Quick actions',
        label: 'Message client',
        icon: <MessageSquare className="h-4 w-4" aria-hidden />,
        onSelect: () => router.push('/messages/new-direct'),
      },
      {
        id: 'new-group-chat',
        group: 'Quick actions',
        label: 'New group chat',
        icon: <MessageSquare className="h-4 w-4" aria-hidden />,
        onSelect: () => router.push('/messages/new-group'),
      },
      {
        id: 'toggle-theme',
        group: 'Quick actions',
        label: resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
        icon:
          resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4" aria-hidden />
          ) : (
            <Moon className="h-4 w-4" aria-hidden />
          ),
        onSelect: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
      },
    ],
    [router, resolvedTheme, setTheme]
  );

  if (!enabled) return null;

  return (
    <CommandPalette
      open={open}
      onOpenChange={(next) => {
        if (next && !open) {
          trackEvent(analyticsEvents.commandPaletteOpened, { source: 'ui', app: 'admin' });
        }
        setOpen(next);
      }}
      items={items}
    />
  );
}
