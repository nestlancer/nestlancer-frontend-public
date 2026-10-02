'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

import { DashboardShellFooter, cn } from '@nestlancer/ui';

import { RequestsQuotesRealtimeSync } from '@/components/sync/RequestsQuotesRealtimeSync';
import { ClientChatDockProvider } from '@/features/messaging/dock/ClientChatDockProvider';

import { CommandPaletteRoot } from '@/components/command/CommandPaletteRoot';

import { DashboardHeader } from './DashboardHeader';
import { ImpersonationBanner } from './ImpersonationBanner';
import { DashboardMobileBottomNav, DashboardMobileNavSheet } from './DashboardMobileNav';
import { Sidebar } from './Sidebar';
import { SidebarProvider, useSidebar } from './SidebarContext';

/** Full messaging panel / thread routes — keep app chrome, fill remaining height. */
function isClientChatWorkspace(pathname: string): boolean {
  if (pathname === '/messages/inbox') return true;
  if (pathname.startsWith('/messages/thread/')) return true;
  if (pathname.startsWith('/messages/new')) return false;
  // Project conversation: /messages/[id] but not /messages or /messages/inbox
  if (/^\/messages\/[^/]+$/.test(pathname) && pathname !== '/messages/inbox') return true;
  return false;
}

function DashboardShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const chatWorkspace = isClientChatWorkspace(pathname);
  const { isMobileOpen, toggleMobileSidebar, closeMobileSidebar, setExpanded } = useSidebar();
  const wasChatWorkspace = useRef(false);

  useEffect(() => {
    if (chatWorkspace && !wasChatWorkspace.current) {
      setExpanded(false);
    }
    wasChatWorkspace.current = chatWorkspace;
  }, [chatWorkspace, setExpanded]);

  return (
    <>
      <RequestsQuotesRealtimeSync />
      <CommandPaletteRoot />
      <div className="flex h-dvh w-full flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
        <ImpersonationBanner />
        <div className="flex min-h-0 w-full flex-1 overflow-hidden">
          <Sidebar className="hidden lg:flex" />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <DashboardHeader onOpenMobileNav={toggleMobileSidebar} />
            <main
              id="main-content"
              className={cn(
                'min-h-0 w-full flex-1',
                chatWorkspace
                  ? 'overflow-hidden px-3 py-3 sm:px-4 sm:py-4'
                  : 'overflow-y-auto overscroll-y-contain px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-6'
              )}
            >
              {children}
            </main>
            {chatWorkspace ? null : <DashboardShellFooter className="hidden lg:block" />}
          </div>
        </div>
      </div>
      {chatWorkspace ? null : (
        <>
          <DashboardMobileBottomNav onOpenFullMenu={toggleMobileSidebar} />
          <DashboardMobileNavSheet
            open={isMobileOpen}
            onOpenChange={(open) => !open && closeMobileSidebar()}
          />
        </>
      )}
    </>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <ClientChatDockProvider>
        <DashboardShellInner>{children}</DashboardShellInner>
      </ClientChatDockProvider>
    </SidebarProvider>
  );
}
