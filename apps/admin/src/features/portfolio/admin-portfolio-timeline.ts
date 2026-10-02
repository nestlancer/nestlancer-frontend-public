import type { PortfolioTimelineEntry } from '@nestlancer/ui';
import { comparePortfolioByDateDesc, formatPortfolioProjectDate } from '@nestlancer/utils';

export function adminRowsToTimelineEntries(
  rows: Record<string, unknown>[]
): PortfolioTimelineEntry[] {
  return [...rows]
    .sort((a, b) =>
      comparePortfolioByDateDesc(
        a as Parameters<typeof comparePortfolioByDateDesc>[0],
        b as Parameters<typeof comparePortfolioByDateDesc>[0]
      )
    )
    .map((row, i) => {
      const id = String(row.id ?? `p-${i}`);
      return {
        id,
        title: String(row.title ?? row.name ?? id),
        dateLabel: formatPortfolioProjectDate(
          row as Parameters<typeof formatPortfolioProjectDate>[0]
        ),
        status: String(row.status ?? row.publishStatus ?? 'DRAFT'),
      };
    });
}
