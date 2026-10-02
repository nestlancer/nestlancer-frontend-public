'use client';

import { Moon, Sun } from '@nestlancer/ui/icons';
import { useTheme } from '@nestlancer/ui';
import { useEffect, useState } from 'react';

import { cn } from '@nestlancer/ui';

export function AdminThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <span
        className={cn(
          'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md,0.625rem)] border border-border bg-card',
          className
        )}
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md,0.625rem)]',
        'border border-border bg-card text-muted-foreground transition-theme',
        'hover:bg-accent hover:text-foreground',
        className
      )}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
    </button>
  );
}
