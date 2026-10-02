import { cn } from '@nestlancer/ui';

export function SwitchRow({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/40 px-4 py-3">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-theme focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50',
          checked
            ? 'border-ta-brand-500 bg-ta-brand-500'
            : 'border-gray-300 bg-gray-200 hover:bg-gray-300 dark:border-border dark:bg-muted-foreground/25 dark:hover:bg-muted-foreground/35'
        )}
      >
        <span
          className={cn(
            'pointer-events-none block h-6 w-6 rounded-full bg-white shadow-md ring-1 ring-black/10 transition-transform dark:bg-background',
            checked ? 'translate-x-7' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}
