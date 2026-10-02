'use client';

import * as React from 'react';
import { Moon, Sun } from '@nestlancer/ui/icons';
import { useTheme } from '@nestlancer/ui';
import { Button } from '@nestlancer/ui';

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
  const label = nextTheme === 'dark' ? 'Switch to dark mode' : 'Switch to light mode';

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-10 w-10 rounded-xl"
      onClick={() => setTheme(nextTheme)}
      title={label}
      aria-label={label}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
