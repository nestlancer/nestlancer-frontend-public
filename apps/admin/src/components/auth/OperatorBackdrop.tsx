'use client';

import { useEffect, useRef } from 'react';

type OperatorBackdropProps = {
  variant?: 'gate' | 'login';
};

function readDotColor(el: HTMLElement): string {
  const raw = getComputedStyle(el).getPropertyValue('--op-dot').trim();
  if (raw) return raw;
  return 'rgba(31,173,143,1)';
}

export function OperatorBackdrop({ variant = 'gate' }: OperatorBackdropProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0;
    let H = 0;
    let dots: Array<{ x: number; y: number; r: number; vx: number; vy: number; a: number }> = [];
    let raf = 0;
    let cancelled = false;
    let baseColor = readDotColor(root.closest('.op-portal') ?? root);

    const resize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };

    const spawn = () => {
      dots = Array.from({ length: 70 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.8 + 0.4,
        vx: (Math.random() - 0.5) * (variant === 'login' ? 0.18 : 0.16),
        vy: (Math.random() - 0.5) * (variant === 'login' ? 0.18 : 0.16),
        a: Math.random() * (variant === 'login' ? 0.45 : 0.4) + 0.1,
      }));
    };

    const withAlpha = (color: string, alpha: number) => {
      const m = color.match(/rgba?\(([^)]+)\)/);
      const body = m?.[1];
      if (body) {
        const parts = body.split(',').map((p) => p.trim());
        return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
      }
      return color;
    };

    const step = () => {
      if (cancelled) return;
      ctx.clearRect(0, 0, W, H);
      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0) d.x = W;
        if (d.x > W) d.x = 0;
        if (d.y < 0) d.y = H;
        if (d.y > H) d.y = 0;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = withAlpha(baseColor, d.a);
        ctx.fill();
      }
      raf = requestAnimationFrame(step);
    };

    const onResize = () => {
      resize();
      spawn();
    };

    const syncTheme = () => {
      baseColor = readDotColor(root.closest('.op-portal') ?? root);
    };

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    resize();
    spawn();
    syncTheme();
    if (reduced) {
      ctx.clearRect(0, 0, W, H);
    } else {
      step();
    }

    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      observer.disconnect();
    };
  }, [variant]);

  return (
    <>
      <div className="op-backdrop" ref={rootRef} aria-hidden="true">
        <div className="op-backdrop-aura" />
        <div className="op-backdrop-grid" />
        <canvas className="op-dotfield" ref={canvasRef} />
      </div>
      <div className="op-scan" aria-hidden="true" />
    </>
  );
}
