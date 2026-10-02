'use client';

import { useMemo, type HTMLAttributes } from 'react';

export type DeltaType = 'increase' | 'decrease' | 'unchanged';

import { cn } from '../../utils/cn';

const chartColors: Record<string, string> = {
  indigo: '#6366f1',
  emerald: '#10b981',
  cyan: '#06b6d4',
  violet: '#8b5cf6',
  fuchsia: '#d946ef',
  rose: '#f43f5e',
  orange: '#f97316',
  amber: '#f59e0b',
  blue: '#3b82f6',
};

/** Tailwind classes so chart fills survive production CSP (no style-src-attr). */
const CHART_BG_CLASS: Record<string, string> = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  cyan: 'bg-cyan-500',
  violet: 'bg-violet-500',
  fuchsia: 'bg-fuchsia-500',
  rose: 'bg-rose-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
};

function chartBgClass(name: string | undefined, fallback: string): string {
  return CHART_BG_CLASS[name ?? fallback] ?? CHART_BG_CLASS[fallback] ?? 'bg-indigo-500';
}

type ChartData = Record<string, string | number>;

function getMax(data: ChartData[], categories: string[]) {
  let max = 0;
  for (const row of data) {
    for (const cat of categories) {
      const v = Number(row[cat] ?? 0);
      if (v > max) max = v;
    }
  }
  return max || 1;
}

function shortLabel(raw: string): string {
  // ISO date → MM/DD; YYYY-MM stays; else truncate
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(5, 10);
  if (/^\d{4}-\d{2}$/.test(raw)) return raw.slice(2);
  return raw.length > 10 ? `${raw.slice(0, 8)}…` : raw;
}

export function AreaChart({
  className,
  data,
  index,
  categories,
  colors = ['indigo'],
  valueFormatter = (n: number) => String(n),
  yAxisWidth: _yAxisWidth,
  noDataText = 'No data',
  showAnimation: _showAnimation,
}: {
  className?: string;
  data: ChartData[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (n: number) => string;
  yAxisWidth?: number;
  noDataText?: string;
  showAnimation?: boolean;
}) {
  const { series, width, height, ticks, lastValue, dots } = useMemo(() => {
    if (!data.length) {
      return {
        series: [] as { id: string; color: string; polygon: string; line: string }[],
        width: 400,
        height: 200,
        ticks: [] as { x: number; label: string }[],
        lastValue: 0,
        dots: [] as { x: number; y: number; color: string }[],
      };
    }
    const w = 400;
    const h = 200;
    const pad = { t: 16, r: 14, b: 28, l: 40 };
    const innerW = w - pad.l - pad.r;
    const innerH = h - pad.t - pad.b;
    const max = getMax(data, categories);
    const seriesOut: { id: string; color: string; polygon: string; line: string }[] = [];
    const dotsOut: { x: number; y: number; color: string }[] = [];
    const cat = categories[0] ?? 'value';

    categories.forEach((c, ci) => {
      const colorKey = colors[ci] ?? 'indigo';
      const color = chartColors[colorKey] ?? chartColors.indigo ?? '#06b6d4';
      const gradId = `area-grad-${ci}`;
      const points = data.map((row, i) => {
        const x = pad.l + (i / Math.max(data.length - 1, 1)) * innerW;
        const v = Number(row[c] ?? 0);
        const y = pad.t + innerH - (v / max) * innerH;
        return { x, y, v };
      });
      const line = points.map((p) => `${p.x},${p.y}`).join(' ');
      const area = `${points[0]?.x},${pad.t + innerH} ${line} ${points[points.length - 1]?.x},${pad.t + innerH}`;
      seriesOut.push({ id: gradId, color, polygon: area, line });
      // Highlight last point + local peaks for a polished look
      points.forEach((p, i) => {
        const prev = points[i - 1]?.v ?? -1;
        const next = points[i + 1]?.v ?? -1;
        const isPeak = p.v > 0 && p.v >= prev && p.v >= next;
        const isLast = i === points.length - 1;
        if (isLast || isPeak) dotsOut.push({ x: p.x, y: p.y, color });
      });
    });

    const tickCount = data.length <= 6 ? data.length : 5;
    const tickIdx =
      data.length <= 1
        ? [0]
        : Array.from({ length: tickCount }, (_, i) =>
            Math.round((i / Math.max(tickCount - 1, 1)) * (data.length - 1))
          );
    const ticksOut = Array.from(new Set(tickIdx)).map((i) => ({
      x: pad.l + (i / Math.max(data.length - 1, 1)) * innerW,
      label: shortLabel(String(data[i]?.[index] ?? '')),
    }));

    return {
      series: seriesOut,
      width: w,
      height: h,
      ticks: ticksOut,
      lastValue: Number(data[data.length - 1]?.[cat] ?? 0),
      dots: dotsOut,
    };
  }, [data, categories, colors, index]);

  if (!data.length) {
    return (
      <div
        className={cn(
          'flex h-44 items-center justify-center text-sm text-muted-foreground',
          className
        )}
      >
        {noDataText}
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full min-h-[11rem] w-full"
        role="img"
        aria-label="Area chart"
      >
        <defs>
          {series.map((seriesItem) => (
            <linearGradient key={seriesItem.id} id={seriesItem.id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={seriesItem.color} stopOpacity={0.38} />
              <stop offset="55%" stopColor={seriesItem.color} stopOpacity={0.12} />
              <stop offset="100%" stopColor={seriesItem.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        {/* soft baseline grid */}
        <line
          x1="40"
          x2={width - 14}
          y1={height - 28}
          y2={height - 28}
          stroke="currentColor"
          className="text-border"
          strokeOpacity="0.55"
        />
        {series.map((seriesItem) => (
          <g key={seriesItem.id}>
            <polygon points={seriesItem.polygon} fill={`url(#${seriesItem.id})`} />
            <polyline
              points={seriesItem.line}
              fill="none"
              stroke={seriesItem.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ))}
        {dots.map((d, i) => (
          <g key={`${d.x}-${d.y}-${i}`}>
            <circle cx={d.x} cy={d.y} r="5" fill={d.color} fillOpacity="0.2" />
            <circle cx={d.x} cy={d.y} r="2.75" fill={d.color} />
          </g>
        ))}
        {ticks.map((t) => (
          <text
            key={`${t.x}-${t.label}`}
            x={t.x}
            y={height - 8}
            textAnchor="middle"
            className="fill-muted-foreground text-[9px]"
          >
            {t.label}
          </text>
        ))}
      </svg>
      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {data.length} points · latest {valueFormatter(lastValue)}
        </span>
      </div>
    </div>
  );
}

export function BarChart({
  className,
  data,
  index,
  categories,
  colors = ['emerald'],
  valueFormatter = (n: number) => String(n),
  noDataText = 'No data',
  showAnimation: _showAnimation,
  yAxisWidth: _yAxisWidth,
}: {
  className?: string;
  data: ChartData[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (n: number) => string;
  noDataText?: string;
  showAnimation?: boolean;
  yAxisWidth?: number;
}) {
  if (!data.length) {
    return (
      <div
        className={cn(
          'flex h-44 items-center justify-center text-sm text-muted-foreground',
          className
        )}
      >
        {noDataText}
      </div>
    );
  }

  const max = getMax(data, categories);
  const cat = categories[0] ?? 'value';
  const fill = chartColors[colors[0] ?? 'emerald'] ?? chartColors.emerald;
  // Cap visible bars so labels stay readable (daily dumps look "blank")
  const visible = data.length > 14 ? data.filter((row) => Number(row[cat] ?? 0) > 0) : data;
  const rows = visible.length ? visible.slice(-14) : data.slice(-8);

  // SVG presentation attributes (not CSS style attrs) survive production CSP.
  const chartH = 128;
  const labelH = 20;
  const valueH = 16;
  const gap = 8;
  const barSlot = 48;
  const width = Math.max(rows.length * (barSlot + gap), 200);
  const innerH = chartH - valueH - labelH;

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <svg
        viewBox={`0 0 ${width} ${chartH}`}
        className="h-full min-h-[10rem] w-full border-b border-border"
        role="img"
        aria-label="Bar chart"
      >
        {rows.map((row, i) => {
          const v = Number(row[cat] ?? 0);
          const pct = v / max;
          const barH = v > 0 ? Math.max(pct * innerH, 6) : 0;
          const x = i * (barSlot + gap) + gap / 2;
          const barW = Math.min(barSlot - 4, 40);
          const barX = x + (barSlot - barW) / 2;
          const barY = valueH + (innerH - barH);
          const label = shortLabel(String(row[index]));
          return (
            <g key={`${label}-${i}`}>
              {v > 0 ? (
                <text
                  x={barX + barW / 2}
                  y={valueH - 4}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {valueFormatter(v)}
                </text>
              ) : null}
              {barH > 0 ? (
                <rect x={barX} y={barY} width={barW} height={barH} rx={4} ry={4} fill={fill}>
                  <title>{`${String(row[index])}: ${valueFormatter(v)}`}</title>
                </rect>
              ) : null}
              <text
                x={barX + barW / 2}
                y={chartH - 4}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {label.length > 8 ? `${label.slice(0, 7)}…` : label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function DonutChart({
  className,
  data,
  index,
  category,
  colors = ['indigo', 'violet', 'fuchsia'],
  valueFormatter = (n: number) => String(n),
  noDataText = 'No data',
  showAnimation: _showAnimation,
}: {
  className?: string;
  data: ChartData[];
  index: string;
  category: string;
  colors?: string[];
  valueFormatter?: (n: number) => string;
  noDataText?: string;
  showAnimation?: boolean;
}) {
  const total = data.reduce((s, row) => s + Number(row[category] ?? 0), 0);
  if (!data.length || total === 0) {
    return (
      <div
        className={cn(
          'flex h-72 items-center justify-center text-sm text-muted-foreground',
          className
        )}
      >
        {noDataText}
      </div>
    );
  }

  let offset = 0;
  const r = 80;
  const cx = 100;
  const cy = 100;
  const circumference = 2 * Math.PI * r;

  const segments = data.map((row, i) => {
    const v = Number(row[category] ?? 0);
    const pct = v / total;
    const dash = pct * circumference;
    const seg = (
      <circle
        key={String(row[index])}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={chartColors[colors[i % colors.length] ?? 'indigo'] ?? chartColors.indigo}
        strokeWidth={24}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    );
    offset += dash;
    return seg;
  });

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <svg viewBox="0 0 200 200" className="h-56 w-56" role="img" aria-label="Donut chart">
        {segments}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground text-lg font-bold"
        >
          {total}
        </text>
      </svg>
      <ul className="flex flex-wrap justify-center gap-3 text-xs">
        {data.map((row, i) => (
          <li key={String(row[index])} className="flex items-center gap-1.5">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                chartBgClass(colors[i % colors.length], 'indigo')
              )}
            />
            {String(row[index])}: {valueFormatter(Number(row[category] ?? 0))}
          </li>
        ))}
      </ul>
    </div>
  );
}

export type TrackerBlock = { color: string; tooltip?: string };

const TRACKER_CLASS: Record<string, string> = {
  cyan: 'bg-cyan-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  gray: 'bg-slate-400',
};

export function Tracker({
  className,
  data,
}: HTMLAttributes<HTMLDivElement> & { data: TrackerBlock[] }) {
  return (
    <div className={cn('flex w-full gap-0.5', className)}>
      {data.map((block, i) => (
        <div
          key={i}
          className={cn(
            'h-8 flex-1 rounded-sm first:rounded-l-md last:rounded-r-md',
            TRACKER_CLASS[block.color] ?? TRACKER_CLASS.cyan
          )}
          title={block.tooltip}
        />
      ))}
    </div>
  );
}
