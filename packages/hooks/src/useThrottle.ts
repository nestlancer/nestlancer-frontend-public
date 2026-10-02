import { useEffect, useRef, useState } from 'react';

export function useThrottle<T>(value: T, intervalMs: number): T {
  const [throttled, setThrottled] = useState(value);
  const last = useRef(0);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const now = Date.now();
    const elapsed = now - last.current;

    const apply = () => {
      last.current = Date.now();
      setThrottled(value);
    };

    if (elapsed >= intervalMs) {
      apply();
      return;
    }

    timeoutRef.current = window.setTimeout(apply, intervalMs - elapsed);
    return () => {
      if (timeoutRef.current !== undefined) window.clearTimeout(timeoutRef.current);
    };
  }, [value, intervalMs]);

  return throttled;
}
