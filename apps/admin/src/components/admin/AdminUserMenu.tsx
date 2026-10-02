'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '@nestlancer/ui';
import { ChevronsUpDown, LogOut, Settings2, Shield, User } from '@nestlancer/ui/icons';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { useAuth } from '@nestlancer/auth';
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@nestlancer/ui';

import { apiServices } from '@/lib/axios';

function initials(user: { firstName?: string; lastName?: string; email: string }) {
  const a = user.firstName?.[0];
  const b = user.lastName?.[0];
  if (a && b) return `${a}${b}`.toUpperCase();
  if (a) return a.toUpperCase();
  return user.email.slice(0, 2).toUpperCase();
}

export function AdminUserMenu({ className }: { className?: string }) {
  const { user, logout } = useAuth();
  const router = useRouter();

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
            'h-9 gap-2 rounded-md px-2 hover:bg-muted data-[state=open]:bg-muted sm:pl-2 sm:pr-3',
            className
          )}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
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
          <Link href="/profile" className="cursor-pointer">
            <User className="h-4 w-4" />
            Operator profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="cursor-pointer">
            <Shield className="h-4 w-4 text-primary" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/system" className="cursor-pointer">
            <Settings2 className="h-4 w-4" />
            System settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={() => void handleLogout()}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
