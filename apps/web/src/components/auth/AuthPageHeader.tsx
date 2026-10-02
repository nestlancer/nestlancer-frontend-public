import type { ReactNode } from 'react';

import { cn } from '@nestlancer/ui';

import { authPageSubtitleClass, authPageTitleClass } from '@/lib/tailadmin-classes';

type AuthPageHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
};

export function AuthPageHeader({ title, subtitle, icon, className }: AuthPageHeaderProps) {
  return (
    <div className={cn('mb-3 space-y-2 sm:mb-8', className)}>
      {icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
          {icon}
        </div>
      ) : null}
      <h1 className={authPageTitleClass}>{title}</h1>
      {subtitle ? <p className={authPageSubtitleClass}>{subtitle}</p> : null}
    </div>
  );
}
