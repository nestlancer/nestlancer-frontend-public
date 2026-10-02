'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '@nestlancer/ui';
import { ChevronsUpDown, LogOut, Settings, Sparkles, User, UserCircle } from '@nestlancer/ui/icons';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { useAuth } from '@nestlancer/auth';
import { routes } from '@nestlancer/constants';
import { Button, cn } from '@nestlancer/ui';

import { apiServices } from '@/lib/axios';
import { stopActingAsUser, useImpersonationMeta } from '@/lib/impersonationSession';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function initials(user: { firstName?: string; lastName?: string; email: string }) {
  const a = user.firstName?.[0];
  const b = user.lastName?.[0];
  if (a && b) return `${a}${b}`.toUpperCase();
  if (a) return a.toUpperCase();
  return user.email.slice(0, 2).toUpperCase();
}

export function NavbarUserMenu({ className }: { className?: string }) {
  const { user, logout } = useAuth();
  const impersonation = useImpersonationMeta();
  const router = useRouter();

  const handleLogout = async () => {
    if (impersonation) {
      const result = await stopActingAsUser();
      window.location.assign(`/impersonate?done=${result}`);
      return;
    }
    try {
      await apiServices.auth.logout();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not sign out on the server.'));
    } finally {
      logout();
      router.push(routes.login);
    }
  };

  const display =
    user && [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
      ? [user.firstName, user.lastName].filter(Boolean).join(' ')
      : (user?.email ?? 'Account');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label={`Account menu for ${display}`}
          className={cn(
            'h-10 gap-2 rounded-lg px-2 hover:bg-gray-100 data-[state=open]:bg-gray-100 dark:hover:bg-white/5 dark:data-[state=open]:bg-white/5 sm:pl-2 sm:pr-3',
            className
          )}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ta-brand-50 text-xs font-semibold text-ta-brand-500 dark:bg-ta-brand-500/15">
            {user ? initials(user) : <User className="h-4 w-4" aria-hidden />}
          </span>
          <span className="hidden max-w-[10rem] truncate text-left text-sm font-medium text-foreground sm:block">
            {display}
          </span>
          <ChevronsUpDown className="hidden h-4 w-4 text-muted-foreground sm:block" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="truncate font-medium text-foreground">{display}</p>
          {user?.email ? (
            <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={routes.dashboard} className="cursor-pointer">
            <Sparkles className="h-4 w-4 text-primary" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={routes.profile} className="cursor-pointer">
            <UserCircle className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={routes.settingsAccount} className="cursor-pointer">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={() => void handleLogout()}
        >
          <LogOut className="h-4 w-4" />
          {impersonation ? 'Stop acting as user' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
