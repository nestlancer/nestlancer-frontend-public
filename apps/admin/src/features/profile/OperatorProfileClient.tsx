'use client';

import Link from 'next/link';

import { useAuth } from '@nestlancer/auth';
import { Button } from '@nestlancer/ui';
import { Settings2, Shield } from '@nestlancer/ui/icons';

import {
  AdminUserAvatar,
  GeCard,
  GePageHeader as PageHeader,
} from '@/components/admin/AdminGentelellaUI';

import { OperatorTwoFactorSection } from './OperatorTwoFactorSection';

export function OperatorProfileClient() {
  const { user } = useAuth();

  const displayName =
    user && [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
      ? [user.firstName, user.lastName].filter(Boolean).join(' ')
      : (user?.email ?? 'Operator');

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="Account"
        title="Operator profile"
        description="Your signed-in administrator account and console preferences."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <GeCard className="text-center lg:col-span-1">
          <div className="ge-card-body space-y-4">
            <AdminUserAvatar
              name={displayName}
              email={user?.email}
              size="lg"
              status="active"
              className="mx-auto"
            />
            <div>
              <h2 className="text-lg font-semibold text-foreground">{displayName}</h2>
              <p className="text-sm text-muted-foreground">{user?.email ?? '—'}</p>
            </div>
            <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Enterprise operator access. Session activity is audited.
            </p>
          </div>
        </GeCard>

        <div className="space-y-6 lg:col-span-2">
          <GeCard>
            <div className="ge-card-body space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Quick links</h3>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard">
                    <Shield className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Dashboard
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/system">
                    <Settings2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    System configuration
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/audit">Audit logs</Link>
                </Button>
              </div>
            </div>
          </GeCard>

          <OperatorTwoFactorSection />

          <GeCard>
            <div className="ge-card-body space-y-2 text-sm text-muted-foreground">
              <p>
                Profile fields such as name and password are managed through the same account APIs
                used by the client portal. Use system configuration for platform-wide operator
                settings.
              </p>
            </div>
          </GeCard>
        </div>
      </div>
    </div>
  );
}
