import type { QueryClient } from '@tanstack/react-query';

import { invalidationMap } from '@nestlancer/constants';

type MapKey = keyof typeof invalidationMap;

/** Invalidate all query keys registered for a mutation action. */
export async function invalidateByAction(
  qc: QueryClient,
  action: MapKey,
  ...args: unknown[]
): Promise<void> {
  const target = invalidationMap[action];
  const keys =
    typeof target === 'function'
      ? (target as (...a: unknown[]) => readonly unknown[])(...args)
      : target;

  await Promise.all(
    keys.map((key) => qc.invalidateQueries({ queryKey: key as readonly unknown[] }))
  );
}
