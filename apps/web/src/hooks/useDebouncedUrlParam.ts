'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Syncs debounced search to URL query param (e.g. ?q=). */
export function useDebouncedUrlParam(paramName: string, debounceMs = 300) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlValue = searchParams.get(paramName) ?? '';
  const [value, setValue] = useState(urlValue);
  const debounced = useDebounce(value, debounceMs);

  useEffect(() => {
    setValue(urlValue);
  }, [urlValue]);

  useEffect(() => {
    if (debounced === urlValue) return;
    const params = new URLSearchParams(searchParams.toString());
    if (debounced.trim()) {
      params.set(paramName, debounced.trim());
    } else {
      params.delete(paramName);
    }
    params.delete('page');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [debounced, urlValue, paramName, pathname, router, searchParams]);

  return {
    value,
    setValue: useCallback((next: string) => setValue(next), []),
    debounced,
    urlValue,
  };
}
