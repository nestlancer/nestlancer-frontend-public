import { useEffect, useRef, useState, type RefObject } from 'react';

export function useIntersectionObserver<T extends Element>(
  options?: IntersectionObserverInit
): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(([entry]) => {
      setVisible(entry?.isIntersecting ?? false);
    }, options);

    obs.observe(el);
    return () => obs.disconnect();
  }, [options]);

  return [ref, visible];
}
