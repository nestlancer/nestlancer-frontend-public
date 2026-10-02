'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CreditCard,
  FolderKanban,
  ImageIcon,
  LayoutDashboard,
  MessageSquare,
  Moon,
  Newspaper,
  Plus,
  Receipt,
  Send,
  Settings,
  Sun,
  User,
} from '@nestlancer/ui/icons';

import { routes } from '@nestlancer/constants';
import {
  CommandPalette,
  useCommandPaletteShortcut,
  useTheme,
  type CommandItem,
} from '@nestlancer/ui';
import { analyticsEvents, isFeatureEnabled } from '@nestlancer/constants';
import { trackEvent } from '@/lib/telemetry';

export function CommandPaletteRoot() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const enabled = isFeatureEnabled('commandPaletteWeb', true);

  useCommandPaletteShortcut(() => {
    if (!enabled) return;
    trackEvent(analyticsEvents.commandPaletteOpened, { source: 'shortcut', app: 'web' });
    setOpen(true);
  });

  const items = useMemo<CommandItem[]>(
    () => [
      {
        id: 'nav-dashboard',
        group: 'Navigation',
        label: 'Dashboard',
        keywords: 'home overview',
        icon: <LayoutDashboard className="h-4 w-4" aria-hidden />,
        onSelect: () => router.push(routes.dashboard),
      },
      {
        id: 'nav-requests',
        group: 'Navigation',
        label: 'Requests',
        keywords: 'pipeline work',
        icon: <Send className="h-4 w-4" aria-hidden />,
        onSelect: () => router.push(routes.requests),
      },
      {
        id: 'nav-projects',
        group: 'Navigation',
        label: 'Projects',
        icon: <FolderKanban className="h-4 w-4" aria-hidden />,
        onSelect: () => router.push(routes.projects),
      },
      {
        id: 'nav-quotes',
        group: 'Navigation',
        label: 'Quotes',
        icon: <Receipt className="h-4 w-4" aria-hidden />,
        onSelect: () => router.push(routes.quotes),
      },
      {
        id: 'nav-messages',
        group: 'Navigation',
        label: 'Messages',
        icon: <MessageSquare className="h-4 w-4" aria-hidden />,
        onSelect: () => router.push(routes.messages),
      },
      {
        id: 'nav-payments',
        group: 'Navigation',
        label: 'Billing',
        keywords: 'payments invoice',
        icon: <CreditCard className="h-4 w-4" aria-hidden />,
        onSelect: () => router.push(routes.payments),
      },
      {
        id: 'nav-notifications',
        group: 'Navigation',
        label: 'Notifications',
        icon: <Bell className="h-4 w-4" aria-hidden />,
        onSelect: () => router.push(routes.notifications),
      },
      {
        id: 'nav-profile',
        group: 'Navigation',
        label: 'Profile',
        icon: <User className="h-4 w-4" aria-hidden />,
        onSelect: () => router.push(routes.profile),
      },
      {
        id: 'nav-settings',
        group: 'Navigation',
        label: 'Settings',
        icon: <Settings className="h-4 w-4" aria-hidden />,
        onSelect: () => router.push(routes.settingsAccount),
      },
      {
        id: 'nav-blog',
        group: 'Explore',
        label: 'Blog',
        icon: <Newspaper className="h-4 w-4" aria-hidden />,
        onSelect: () => router.push(routes.blog),
      },
      {
        id: 'nav-portfolio',
        group: 'Explore',
        label: 'Portfolio',
        icon: <ImageIcon className="h-4 w-4" aria-hidden />,
        onSelect: () => router.push(routes.portfolio),
      },
      {
        id: 'action-new-request',
        group: 'Actions',
        label: 'New request',
        keywords: 'create add',
        icon: <Plus className="h-4 w-4" aria-hidden />,
        onSelect: () => router.push(routes.requestNew),
      },
      {
        id: 'action-new-project',
        group: 'Actions',
        label: 'New project',
        icon: <Plus className="h-4 w-4" aria-hidden />,
        onSelect: () => router.push(routes.projectNew),
      },
      {
        id: 'action-new-message',
        group: 'Actions',
        label: 'New direct message',
        keywords: 'chat dm',
        icon: <MessageSquare className="h-4 w-4" aria-hidden />,
        onSelect: () => router.push(routes.messageNewDirect),
      },
      {
        id: 'action-theme',
        group: 'Actions',
        label: resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
        keywords: 'theme appearance dark light',
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
          trackEvent(analyticsEvents.commandPaletteOpened, { source: 'ui', app: 'web' });
        }
        setOpen(next);
      }}
      items={items}
    />
  );
}
