'use client';

import { PctProgressFill } from '@nestlancer/ui';
import { useEffect, useState } from 'react';

export function BlogReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrollTop = el.scrollTop;
      const height = el.scrollHeight - el.clientHeight;
      setProgress(height > 0 ? Math.min(100, (scrollTop / height) * 100) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fixed left-0 right-0 top-16 z-40 h-0.5 bg-border/80" aria-hidden>
      <PctProgressFill pct={progress} fillClassName="fill-primary" className="h-full" />
    </div>
  );
}
