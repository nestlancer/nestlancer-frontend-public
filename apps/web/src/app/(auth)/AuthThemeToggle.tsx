'use client';

import { Laptop, Moon, Sun } from '@nestlancer/ui/icons';
import { useTheme } from '@nestlancer/ui';
import { useEffect, useState } from 'react';

import { Button } from '@nestlancer/ui';

export function AuthThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-xl text-muted-foreground"
        disabled
        aria-label="Theme"
      >
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  const cycle = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const Icon = theme === 'system' ? Laptop : resolvedTheme === 'dark' ? Moon : Sun;
  const label = theme === 'system' ? 'Use system appearance' : `Use ${theme} mode`;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-11 w-11 rounded-full border-gray-200 bg-white text-gray-600 shadow-theme-xs transition-theme hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
      onClick={cycle}
      aria-label={label}
      title={label}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </Button>
  );
}
