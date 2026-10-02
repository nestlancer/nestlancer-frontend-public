export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roundTo(value: number, decimals: number): number {
  const p = 10 ** decimals;
  return Math.round(value * p) / p;
}

export function toPercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return roundTo((value / total) * 100, 1);
}
