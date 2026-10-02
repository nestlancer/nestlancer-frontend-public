import { useCallback, useEffect, useState } from 'react';

function read<T>(key: string, initial: T): T {
  if (typeof window === 'undefined') return initial;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return initial;
    return JSON.parse(raw) as T;
  } catch {
    return initial;
  }
}

export function useLocalStorage<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => read(key, initial));

  useEffect(() => {
    setValue(read(key, initial));
  }, [key, initial]);

  const set = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        console.warn('useLocalStorage: failed to persist', key);
      }
    },
    [key]
  );

  return [value, set];
}
