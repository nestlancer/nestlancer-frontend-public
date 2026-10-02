'use client';

import Link from 'next/link';

import { routes } from '@nestlancer/constants';
import { Button, cn, DomainStatusBadge } from '@nestlancer/ui';
import { formatMoneyFromPaise } from '@nestlancer/utils';
import { CreditCard, MessageSquare } from '@nestlancer/ui/icons';

import { PaymentCheckoutLink } from '@/features/payments/components/PaymentCheckoutLink';
import { WebPanel } from '@/components/web/WebPanel';
import { webPrimaryButtonClass } from '@/lib/tailadmin-classes';

export function ProjectHubContractStrip({
  projectId,
  status,
  percentComplete,
  nextMilestoneLabel,
  nextPaymentPaise,
  currency,
  payableMilestoneId,
  payablePaymentId,
}: {
  projectId: string;
  status: string | null | undefined;
  percentComplete: number | null;
  nextMilestoneLabel?: string;
  nextPaymentPaise?: number;
  currency?: string;
  payableMilestoneId?: string;
  payablePaymentId?: string;
}) {
  const pct = percentComplete != null ? Math.round(percentComplete) : null;

  return (
    <WebPanel padding="sm" className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <DomainStatusBadge domain="project" status={String(status ?? '')} />
        {pct != null ? (
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{pct}%</span> complete
          </span>
        ) : null}
        {nextMilestoneLabel ? (
          <span className="text-sm text-muted-foreground">
            Next: <span className="font-medium text-foreground">{nextMilestoneLabel}</span>
          </span>
        ) : null}
        {nextPaymentPaise != null && nextPaymentPaise > 0 ? (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <CreditCard className="h-3.5 w-3.5" aria-hidden />
            {formatMoneyFromPaise(nextPaymentPaise, currency ?? 'INR')}
          </span>
        ) : null}
      </div>
      <div className="flex gap-2">
        {payableMilestoneId && nextPaymentPaise != null && nextPaymentPaise > 0 ? (
          <PaymentCheckoutLink
            projectId={projectId}
            milestoneId={payableMilestoneId}
            amount={nextPaymentPaise}
            currency={currency ?? 'INR'}
            paymentId={payablePaymentId}
            label="Pay now"
            variant="compact"
            className={cn('h-8 rounded-lg px-3 text-xs font-semibold', webPrimaryButtonClass)}
          />
        ) : null}
        <Button variant="outline" size="sm" asChild>
          <Link href={`${routes.project(projectId)}?tab=messages`}>
            <MessageSquare className="mr-1.5 h-4 w-4" aria-hidden />
            Message
          </Link>
        </Button>
        <Button size="sm" className={webPrimaryButtonClass} asChild>
          <Link href={`${routes.project(projectId)}?tab=milestones`}>View milestones</Link>
        </Button>
      </div>
    </WebPanel>
  );
}
