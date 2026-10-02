'use client';

import { NestlancerLogo, Text, DashboardShellFooter } from '@nestlancer/ui';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { useAuth } from '@nestlancer/auth';
import { cn } from '@nestlancer/ui';
import {
  Activity,
  Bell,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  ClipboardList,
  CreditCard,
  FileStack,
  FolderKanban,
  Gauge,
  HardDrive,
  Inbox,
  LogOut,
  Menu,
  MessageSquare,
  Newspaper,
  Receipt,
  ScrollText,
  Search,
  Settings2,
  ShieldAlert,
  Users,
  Webhook,
  X,
} from '@nestlancer/ui/icons';

import { AdminCommandPalette } from '@/components/command/AdminCommandPalette';
import { AdminMessageLink } from '@/components/admin/AdminMessageLink';
import { AdminModerationLink } from '@/components/admin/AdminModerationLink';
import { AdminNotificationLink } from '@/components/admin/AdminNotificationLink';
import { AdminThemeToggle } from '@/components/admin/AdminThemeToggle';
import { AdminUserMenu } from '@/components/admin/AdminUserMenu';
import { RequestsQuotesRealtimeSync } from '@/components/sync/RequestsQuotesRealtimeSync';
import { AdminChatDockProvider } from '@/features/messages/AdminChatDockProvider';
import { apiServices } from '@/lib/axios';

type AdminNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

type AdminNavSection = {
  title: string;
  items: AdminNavItem[];
};

const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    title: 'Operations',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: Gauge },
      { href: '/pipeline', label: 'Pipelines', icon: FileStack },
      { href: '/contact', label: 'Inquiries', icon: Inbox },
      { href: '/notifications', label: 'Notifications', icon: Bell },
      { href: '/requests', label: 'Requests', icon: ClipboardList },
      { href: '/quotes', label: 'Quotes', icon: Receipt },
      { href: '/projects', label: 'Projects', icon: FolderKanban },
      { href: '/payments', label: 'Payments', icon: CreditCard },
      { href: '/users', label: 'Users', icon: Users },
      { href: '/messages', label: 'Messages', icon: MessageSquare },
      { href: '/moderation', label: 'Moderation', icon: ShieldAlert },
      { href: '/analytics', label: 'Analytics', icon: Activity },
    ],
  },
  {
    title: 'Content',
    items: [
      { href: '/content', label: 'Blog', icon: Newspaper },
      { href: '/portfolio', label: 'Portfolio', icon: Briefcase },
      { href: '/media', label: 'Media Library', icon: HardDrive },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/system', label: 'System Config', icon: Settings2 },
      { href: '/integrations', label: 'Webhooks', icon: Webhook },
      { href: '/audit', label: 'Audit Logs', icon: ScrollText },
    ],
  },
];

const ALL_NAV_ITEMS = ADMIN_NAV_SECTIONS.flatMap((section) => section.items);

function navItemActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AdminNavLink({
  href,
  label,
  icon: Icon,
  onNavigate,
  collapsed,
}: AdminNavItem & { onNavigate?: () => void; collapsed?: boolean }) {
  const pathname = usePathname();
  const active = navItemActive(pathname, href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={cn(
        'group relative mx-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-normal transition-theme',
        active
          ? 'bg-[var(--ge-sidebar-active)] text-[var(--ge-sidebar-text-active)]'
          : 'text-[var(--ge-sidebar-text)] hover:bg-[var(--ge-sidebar-hover)] hover:text-[var(--ge-sidebar-text-active)]',
        collapsed && 'mx-0 justify-center px-2'
      )}
    >
      {active ? (
        <span
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[var(--ge-primary)]"
          aria-hidden
        />
      ) : null}
      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </Link>
  );
}

function AdminSidebarNav({
  onNavigate,
  className,
  collapsed,
}: {
  onNavigate?: () => void;
  className?: string;
  collapsed?: boolean;
}) {
  return (
    <nav
      className={cn(
        'ge-sidebar-scroll flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3',
        className
      )}
      aria-label="Console"
    >
      {ADMIN_NAV_SECTIONS.map((section) => (
        <div key={section.title} className="mb-3">
          {!collapsed ? (
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--ge-sidebar-section)]">
              {section.title}
            </p>
          ) : null}
          <div className="flex flex-col gap-0.5">
            {section.items.map((item) => (
              <AdminNavLink
                key={item.href}
                {...item}
                onNavigate={onNavigate}
                collapsed={collapsed}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function AdminSidebarBrand({ collapsed, actions }: { collapsed?: boolean; actions?: ReactNode }) {
  return (
    <div
      className={cn(
        'ge-sidebar-brand relative flex h-header shrink-0 items-center border-b border-[var(--ge-sidebar-border)]',
        collapsed ? 'justify-center px-2' : 'justify-between gap-2 px-4'
      )}
    >
      {!collapsed ? (
        <NestlancerLogo variant="full" size="md" />
      ) : (
        <NestlancerLogo variant="icon" size="md" />
      )}
      {!collapsed ? (
        <div className="absolute right-4 top-1.5 flex items-center gap-2">
          <span className="whitespace-nowrap text-[10px] font-semibold uppercase leading-none tracking-wide text-[var(--ge-primary)]">
            Operator Console
          </span>
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function AdminConsoleLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const wasChatWorkspace = useRef(false);

  const activeNav = ALL_NAV_ITEMS.find(({ href }) => navItemActive(pathname, href));
  const activeSection = ADMIN_NAV_SECTIONS.find((section) =>
    section.items.some(({ href }) => navItemActive(pathname, href))
  );
  const isChatWorkspace =
    pathname === '/messages/inbox' ||
    pathname.startsWith('/messages/thread/') ||
    pathname.startsWith('/messages/project/');

  useEffect(() => {
    if (isChatWorkspace && !wasChatWorkspace.current) {
      setSidebarCollapsed(true);
    }
    wasChatWorkspace.current = isChatWorkspace;
  }, [isChatWorkspace]);

  const handleLogout = async () => {
    try {
      await apiServices.auth.logout();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not sign out on the server.'));
    } finally {
      logout();
      router.push('/login');
    }
  };

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <RequestsQuotesRealtimeSync />
      <AdminCommandPalette />
      <AdminChatDockProvider>
        <div
          className={cn(
            'admin-console flex h-dvh w-full overflow-hidden bg-[var(--ge-canvas)] text-foreground',
            isChatWorkspace && 'admin-console--chat-workspace'
          )}
        >
          {/* Desktop sidebar */}
          <aside
            className={cn(
              'ge-sidebar h-full shrink-0 flex-col overflow-hidden border-r border-[var(--ge-sidebar-border)] shadow-lg transition-[width] duration-200',
              'hidden lg:flex',
              sidebarCollapsed ? 'w-[var(--sidebar-rail-width)]' : 'w-[var(--sidebar-width)]'
            )}
          >
            <AdminSidebarBrand collapsed={sidebarCollapsed} />

            <AdminSidebarNav collapsed={sidebarCollapsed} />

            <div className="mt-auto border-t border-[var(--ge-sidebar-border)] p-3">
              <div className="ge-sidebar-user">
                <div className="ge-sidebar-avatar">
                  {(user?.email?.[0] ?? 'A').toUpperCase()}
                  <span className="online" aria-hidden />
                </div>
                {!sidebarCollapsed ? (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-[var(--ge-sidebar-text-active)]">
                      {user?.email ?? '—'}
                    </p>
                    <Text className="text-[10px] text-[var(--ge-sidebar-text)]">Administrator</Text>
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void handleLogout()}
                title="Sign out"
                className={cn(
                  'mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-[var(--ge-primary)] py-2 text-xs font-semibold text-white transition-theme hover:opacity-90',
                  sidebarCollapsed && 'px-0'
                )}
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
                {!sidebarCollapsed ? 'Sign out' : null}
              </button>
            </div>
          </aside>

          {/* Mobile drawer */}
          {mobileNavOpen ? (
            <div className="fixed inset-0 z-50 lg:hidden">
              <button
                type="button"
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                aria-label="Close navigation menu"
                onClick={() => setMobileNavOpen(false)}
              />
              <aside className="ge-sidebar relative flex h-full w-[min(100%,var(--sidebar-width))] flex-col shadow-xl">
                <AdminSidebarBrand
                  actions={
                    <button
                      type="button"
                      onClick={() => setMobileNavOpen(false)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--ge-sidebar-text)] hover:bg-[var(--ge-sidebar-hover)] hover:text-[var(--ge-sidebar-text-active)]"
                      aria-label="Close menu"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  }
                />
                <AdminSidebarNav onNavigate={() => setMobileNavOpen(false)} />
                <div className="mt-auto border-t border-[var(--ge-sidebar-border)] p-3">
                  <div className="ge-sidebar-user">
                    <div className="ge-sidebar-avatar">
                      {(user?.email?.[0] ?? 'A').toUpperCase()}
                      <span className="online" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-[var(--ge-sidebar-text-active)]">
                        {user?.email ?? '—'}
                      </p>
                      <Text className="text-[10px] text-[var(--ge-sidebar-text)]">
                        Administrator
                      </Text>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-[var(--ge-primary)] py-2 text-xs font-semibold text-white transition-theme hover:opacity-90"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden />
                    Sign out
                  </button>
                </div>
              </aside>
            </div>
          ) : null}

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <header className="ge-topbar z-40 shrink-0 border-b border-border bg-card shadow-sm">
              <div className="flex h-header items-center gap-3 px-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(true)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setSidebarCollapsed((c) => !c)}
                  className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground lg:flex"
                  aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {sidebarCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </button>

                <nav
                  aria-label="Console breadcrumb"
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-sm"
                >
                  <Link
                    href="/dashboard"
                    className="hidden text-muted-foreground hover:text-foreground sm:inline"
                  >
                    Home
                  </Link>
                  {activeSection ? (
                    <>
                      <ChevronRight
                        className="hidden h-3.5 w-3.5 text-muted-foreground/50 sm:inline"
                        aria-hidden
                      />
                      <span className="hidden text-muted-foreground sm:inline">
                        {activeSection.title}
                      </span>
                    </>
                  ) : null}
                  <ChevronRight
                    className="hidden h-3.5 w-3.5 text-muted-foreground/50 sm:inline"
                    aria-hidden
                  />
                  {isChatWorkspace && pathname !== '/messages/inbox' ? (
                    <>
                      <Link
                        href="/messages"
                        className="truncate text-muted-foreground hover:text-foreground"
                      >
                        Messages
                      </Link>
                      <ChevronRight
                        className="hidden h-3.5 w-3.5 text-muted-foreground/50 sm:inline"
                        aria-hidden
                      />
                      <Link
                        href="/messages/inbox"
                        className="truncate text-muted-foreground hover:text-foreground"
                      >
                        Panel
                      </Link>
                      <ChevronRight
                        className="hidden h-3.5 w-3.5 text-muted-foreground/50 sm:inline"
                        aria-hidden
                      />
                      <span className="truncate font-medium text-foreground">
                        {activeNav?.label ?? 'Thread'}
                      </span>
                    </>
                  ) : (
                    <span className="truncate font-medium text-foreground">
                      {pathname === '/messages/inbox'
                        ? 'Messaging panel'
                        : (activeNav?.label ?? 'Console')}
                    </span>
                  )}
                </nav>

                <button
                  type="button"
                  onClick={() =>
                    // Listener is on window (useCommandPaletteShortcut). Synthetic
                    // keydown must target window — document.dispatchEvent never reaches it
                    // because KeyboardEvent bubbles defaults to false (NL-BUG-UI-001).
                    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
                  }
                  className="ge-search-box hidden lg:flex"
                  aria-label="Open command palette"
                >
                  <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">Search pages…</span>
                  <kbd>⌘K</kbd>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
                  aria-label="Open command palette"
                >
                  <Search className="h-4 w-4" aria-hidden />
                </button>

                <AdminNotificationLink />

                <AdminMessageLink />

                <AdminModerationLink />

                <AdminUserMenu />

                <AdminThemeToggle />
              </div>
            </header>

            <main
              id="main-content"
              tabIndex={-1}
              className={cn(
                'admin-console-main min-h-0 flex-1 focus:outline-none',
                isChatWorkspace ? 'overflow-hidden' : 'overflow-y-auto overscroll-y-contain'
              )}
            >
              <div
                className={cn(
                  'admin-console-content w-full',
                  isChatWorkspace
                    ? 'flex h-full min-h-0 flex-col overflow-hidden p-2 sm:p-3'
                    : 'px-4 py-6 sm:px-6 lg:px-8 lg:py-8'
                )}
              >
                {children}
              </div>
            </main>

            {isChatWorkspace ? null : (
              <DashboardShellFooter variant="admin" brand="Nestlancer Admin" />
            )}
          </div>
        </div>
      </AdminChatDockProvider>
    </>
  );
}
