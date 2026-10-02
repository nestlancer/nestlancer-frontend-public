import { cn } from '../../utils/cn';

export function MessageDateDivider({ label, compact }: { label: string; compact?: boolean }) {
  return (
    <li className={cn('flex justify-center', compact ? 'py-2' : 'py-4')} role="separator">
      <span
        className={cn(
          'rounded-full bg-card/90 font-semibold text-muted-foreground shadow-sm ring-1 ring-border/60',
          compact ? 'px-3 py-0.5 text-[10px]' : 'px-4 py-1 text-[11px]'
        )}
      >
        {label}
      </span>
    </li>
  );
}
