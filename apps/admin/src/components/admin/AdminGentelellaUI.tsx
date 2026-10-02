'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';

import { Button, cn, StatusBadge, Switch, useTheme } from '@nestlancer/ui';

import { resolveGenericStatusVariant } from '@/lib/admin-status';
import { formatAdminStatus } from '@/lib/admin-response';

const AVATAR_GRADIENT_COUNT = 6;

export function GePageHeader({
  pretitle,
  title,
  description,
  actions,
}: {
  pretitle?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-fade-in motion-reduce:animate-none">
      <div className="min-w-0 space-y-1">
        {pretitle ? (
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">{pretitle}</p>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/** Alias for unified page headers across the admin app. */
export { GePageHeader as PageHeader };

export function GeCard({
  children,
  className,
  flush,
}: {
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <div className={cn('ge-card overflow-hidden', className)}>
      {flush ? children : <div className="ge-card-body">{children}</div>}
    </div>
  );
}

export function GeCardHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="ge-card-header">
      <div>
        <h2 className="ge-card-title">{title}</h2>
        {subtitle ? <div className="ge-card-subtitle">{subtitle}</div> : null}
      </div>
      {actions}
    </div>
  );
}

export function GeChartTabs({
  value,
  onChange,
  options = ['7 days', '30 days', '90 days'],
}: {
  value: string;
  onChange: (v: string) => void;
  options?: string[];
}) {
  return (
    <div className="ge-chart-tabs" role="tablist" aria-label="Chart period">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          role="tab"
          aria-selected={value === opt}
          className={cn('ge-chart-tab', value === opt && 'active')}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function initialsFromTitle(title: string): string {
  const words = title.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0]![0]}${words[1]![0]}`.toUpperCase();
  return title.slice(0, 2).toUpperCase();
}

function avatarGradientIndex(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i)) % AVATAR_GRADIENT_COUNT;
  }
  return hash;
}

/** Colored initials avatar matching stitch-audit user directory rows. */
export function AdminUserAvatar({
  name,
  email,
  size = 'md',
  status,
  className,
}: {
  name?: string;
  email?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'active' | 'suspended' | 'neutral';
  className?: string;
}) {
  const title = name?.trim() || email?.trim() || '?';
  const initials = initialsFromTitle(title);
  const sizeClass =
    size === 'sm'
      ? 'h-8 w-8 text-xs'
      : size === 'lg'
        ? 'h-20 w-20 text-2xl ring-4 ring-background'
        : 'h-10 w-10 text-sm';

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-full font-bold text-white shadow-sm',
          sizeClass,
          `ge-avatar-gradient-${avatarGradientIndex(title)}`
        )}
        aria-hidden
      >
        {initials}
      </div>
      {status === 'active' ? (
        <span
          className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500"
          aria-hidden
        />
      ) : null}
      {status === 'suspended' ? (
        <span
          className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-amber-500"
          aria-hidden
        />
      ) : null}
    </div>
  );
}

export function GeActivityList({
  items,
  maxItems = 8,
}: {
  items: { id: string; title: string; description?: string; when?: string; tag?: string }[];
  maxItems?: number;
}) {
  const visible = items.slice(0, maxItems);
  if (!visible.length) {
    return (
      <p className="py-4 text-center text-sm italic text-muted-foreground">No recent activity.</p>
    );
  }

  return (
    <ul className="ge-activity-list">
      {visible.map((a, i) => (
        <li key={a.id} className="ge-activity-item">
          <div
            className={cn('ge-activity-avatar', `ge-avatar-gradient-${i % AVATAR_GRADIENT_COUNT}`)}
            aria-hidden
          >
            {initialsFromTitle(a.title)}
          </div>
          <div className="min-w-0">
            <div className="ge-activity-body">
              <strong>{a.title}</strong>
              {a.description ? (
                <span className="text-muted-foreground"> — {a.description}</span>
              ) : null}
            </div>
            {a.when ? <div className="ge-activity-time">{a.when}</div> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function GeStatusBadge({ status }: { status: string }) {
  const label = formatAdminStatus(status);
  return (
    <StatusBadge variant={resolveGenericStatusVariant(status)} dot>
      {label}
    </StatusBadge>
  );
}

export function GeTaskList({
  items,
}: {
  items: {
    id: string;
    title: string;
    detail?: string;
    severity?: 'info' | 'warning' | 'critical';
  }[];
}) {
  if (!items.length) {
    return <p className="py-2 text-sm text-muted-foreground">No open tasks.</p>;
  }

  const prioClass = (s?: string) => {
    if (s === 'critical') return 'ge-todo-prio--critical';
    if (s === 'warning') return 'ge-todo-prio--warning';
    return 'ge-todo-prio--info';
  };

  return (
    <div>
      {items.map((t) => (
        <div key={t.id} className="ge-todo-row">
          <span className={cn('ge-todo-prio', prioClass(t.severity))} aria-hidden />
          <span className="ge-todo-text flex-1 text-foreground">{t.title}</span>
          <span className="ge-todo-date">{t.detail ? t.detail.slice(0, 24) : '—'}</span>
        </div>
      ))}
    </div>
  );
}

export function GeStorageWidget({
  segments,
  title = 'Platform mix',
  subtitle,
}: {
  title?: string;
  subtitle?: string;
  segments: { label: string; pct: number; color: string; value?: number }[];
}) {
  if (!segments.length) return null;

  const totalPct = segments.reduce((s, x) => s + Math.max(0, x.pct), 0) || 1;
  let barOffset = 0;

  return (
    <GeCard flush>
      <GeCardHeader title={title} subtitle={subtitle} />
      <div className="ge-card-body">
        <svg
          viewBox="0 0 100 4"
          className="ge-storage-bar mb-4 h-2.5 w-full"
          preserveAspectRatio="none"
          aria-hidden
        >
          {segments.map((s) => {
            const width = Math.max(0.5, (Math.max(0, s.pct) / totalPct) * 100);
            const rect = (
              <rect key={s.label} x={barOffset} width={width} height="4" fill={s.color} rx="1" />
            );
            barOffset += width;
            return rect;
          })}
        </svg>
        <div className="space-y-2">
          {segments.map((s) => (
            <div key={s.label} className="ge-legend-item">
              <svg width="8" height="8" className="dot shrink-0" aria-hidden>
                <circle cx="4" cy="4" r="4" fill={s.color} />
              </svg>
              {s.label}
              <span className="val">
                {s.value != null ? `${s.value} · ` : ''}
                {Math.round((Math.max(0, s.pct) / totalPct) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </GeCard>
  );
}

const QUICK_SETTINGS_KEY = 'nestlancer:admin:quick-settings';

type QuickSettings = {
  emailNotifications: boolean;
  desktopAlerts: boolean;
};

function loadQuickSettings(): QuickSettings {
  if (typeof window === 'undefined') {
    return { emailNotifications: true, desktopAlerts: true };
  }
  try {
    const raw = localStorage.getItem(QUICK_SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as QuickSettings;
  } catch {
    /* ignore */
  }
  return { emailNotifications: true, desktopAlerts: true };
}

export function GeQuickSettings() {
  const { resolvedTheme, setTheme } = useTheme();
  const [settings, setSettings] = useState<QuickSettings>(loadQuickSettings);

  useEffect(() => {
    localStorage.setItem(QUICK_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  return (
    <GeCard flush>
      <GeCardHeader title="Quick settings" />
      <div className="ge-card-body !py-2">
        <div className="ge-toggle-row">
          <span className="text-sm text-foreground">Email notifications</span>
          <Switch
            checked={settings.emailNotifications}
            onChange={(v) => setSettings((s) => ({ ...s, emailNotifications: v }))}
          />
        </div>
        <div className="ge-toggle-row">
          <span className="text-sm text-foreground">Desktop alerts</span>
          <Switch
            checked={settings.desktopAlerts}
            onChange={(v) => setSettings((s) => ({ ...s, desktopAlerts: v }))}
          />
        </div>
        <div className="ge-toggle-row">
          <span className="text-sm text-foreground">Dark mode</span>
          <Switch
            checked={resolvedTheme === 'dark'}
            onChange={(v) => setTheme(v ? 'dark' : 'light')}
          />
        </div>
      </div>
    </GeCard>
  );
}

export function GeRecentTable({
  title,
  subtitle,
  viewAllHref,
  columns,
  rows,
  emptyMessage = 'No records.',
}: {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  columns: { key: string; header: string; className?: string }[];
  rows: Record<string, unknown>[];
  emptyMessage?: string;
}) {
  return (
    <GeCard flush className="h-full">
      <GeCardHeader
        title={title}
        subtitle={subtitle}
        actions={
          viewAllHref ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={viewAllHref}>View all →</Link>
            </Button>
          ) : undefined
        }
      />
      <div className="ge-card-body-flush overflow-x-auto rounded-b-[var(--radius-lg)]">
        {rows.length ? (
          <table className="ge-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className={c.className}>
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={String(row.id ?? i)}>
                  {columns.map((c) => (
                    <td key={c.key} className={c.className}>
                      {c.key === 'status' && typeof row[c.key] === 'string' ? (
                        <GeStatusBadge status={row[c.key] as string} />
                      ) : (
                        <span className={c.key === 'id' ? 'ge-cell-mono' : 'ge-cell-strong'}>
                          {String(row[c.key] ?? '—')}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        )}
      </div>
    </GeCard>
  );
}
