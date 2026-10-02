export function unique<T>(items: T[], key?: keyof T): T[] {
  if (!key) return Array.from(new Set(items));
  const seen = new Set<unknown>();
  return items.filter((item) => {
    const v = item[key];
    if (seen.has(v)) return false;
    seen.add(v);
    return true;
  });
}

export function groupBy<T, K extends string | number>(
  items: T[],
  getKey: (item: T) => K
): Record<K, T[]> {
  return items.reduce(
    (acc, item) => {
      const k = getKey(item);
      if (!acc[k]) acc[k] = [];
      acc[k].push(item);
      return acc;
    },
    {} as Record<K, T[]>
  );
}

export function sortBy<T>(items: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...items].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av === bv) return 0;
    const cmp = av < bv ? -1 : 1;
    return order === 'asc' ? cmp : -cmp;
  });
}
