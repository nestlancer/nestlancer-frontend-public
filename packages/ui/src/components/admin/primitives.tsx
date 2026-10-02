'use client';

import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useId,
  useState,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';

import { cn } from '../../utils/cn';

export { Card } from '../data-display/card/Card';

export function Text({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)} {...props}>
      {children}
    </p>
  );
}

export function Metric({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-3xl font-semibold tracking-tight text-foreground', className)}
      {...props}
    >
      {children}
    </p>
  );
}

const badgeColorClass: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  slate: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  rose: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  violet: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
};

export function Badge({
  className,
  color = 'slate',
  size = 'sm',
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { color?: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-2.5 py-0.5 text-sm',
        badgeColorClass[color] ?? badgeColorClass.slate,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

const deltaClass: Record<string, string> = {
  increase: 'text-emerald-600 dark:text-emerald-400',
  decrease: 'text-red-600 dark:text-red-400',
  unchanged: 'text-slate-500',
};

export function BadgeDelta({
  className,
  deltaType = 'unchanged',
  size: _size,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { deltaType?: string; size?: string }) {
  return (
    <span
      className={cn(
        'text-xs font-medium',
        deltaClass[deltaType] ?? deltaClass.unchanged,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function Grid({
  className,
  numItemsMd,
  numItemsLg,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { numItemsMd?: number; numItemsLg?: number }) {
  const md = numItemsMd ?? 2;
  const lg = numItemsLg ?? md;
  return (
    <div
      className={cn(
        'grid gap-4',
        md === 2 && 'md:grid-cols-2',
        md === 3 && 'md:grid-cols-2',
        md === 4 && 'md:grid-cols-2',
        lg === 2 && 'lg:grid-cols-2',
        lg === 3 && 'lg:grid-cols-3',
        lg === 4 && 'lg:grid-cols-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Divider({ className, ...props }: HTMLAttributes<HTMLHRElement>) {
  return <hr className={cn('border-border', className)} {...props} />;
}

export const TextInput = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
    onValueChange?: (value: string) => void;
  }
>(({ className, onValueChange, value, defaultValue, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    value={value}
    defaultValue={defaultValue}
    onChange={(e) => onValueChange?.(e.target.value)}
    {...props}
  />
));
TextInput.displayName = 'TextInput';

export function Switch({
  checked,
  onChange,
  disabled,
  className,
  color: _color,
  ...props
}: {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  color?: string;
} & Omit<HTMLAttributes<HTMLButtonElement>, 'onChange'>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        checked
          ? 'border-primary bg-primary'
          : 'border-border bg-muted-foreground/20 hover:bg-muted-foreground/30',
        className
      )}
      onClick={() => onChange?.(!checked)}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-md ring-1 ring-black/10 transition-transform dark:bg-background',
          checked ? 'translate-x-[1.25rem]' : 'translate-x-0.5'
        )}
      />
    </button>
  );
}

type SelectCtx = { value: string; onChange: (v: string) => void };
const SelectContext = createContext<SelectCtx | null>(null);

export function Select({
  value,
  onValueChange,
  placeholder,
  className,
  children,
  id: idProp,
  ...props
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> & {
  onValueChange?: (value: string) => void;
  placeholder?: string;
}) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  return (
    <SelectContext.Provider
      value={{ value: String(value ?? ''), onChange: onValueChange ?? (() => {}) }}
    >
      <select
        id={id}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background py-2 pl-3 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className
        )}
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {children}
      </select>
    </SelectContext.Provider>
  );
}

export function SelectItem({
  value,
  children,
  ...props
}: HTMLAttributes<HTMLOptionElement> & { value: string }) {
  return (
    <option value={value} {...props}>
      {children}
    </option>
  );
}

type TabCtx = { index: number; setIndex: (i: number) => void };
const TabContext = createContext<TabCtx | null>(null);
const TabListVariantContext = createContext<'solid' | 'line' | undefined>(undefined);

export function TabGroup({
  index,
  onIndexChange,
  children,
  className,
}: {
  index?: number;
  onIndexChange?: (i: number) => void;
  children: ReactNode;
  className?: string;
}) {
  const [internal, setInternal] = useState(index ?? 0);
  const current = index ?? internal;
  const setIndex = (i: number) => {
    setInternal(i);
    onIndexChange?.(i);
  };
  return (
    <TabContext.Provider value={{ index: current, setIndex }}>
      <div className={className}>{children}</div>
    </TabContext.Provider>
  );
}

export function TabList({
  className,
  variant = 'line',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: 'solid' | 'line' }) {
  const indexedChildren = Children.map(children, (child, i) => {
    if (!isValidElement(child)) return child;
    const explicit = (child.props as { index?: number }).index;
    return cloneElement(child, { index: explicit ?? i } as { index: number });
  });

  return (
    <TabListVariantContext.Provider value={variant}>
      <div
        className={cn(
          'flex flex-wrap gap-1',
          variant === 'solid' ? 'rounded-lg bg-muted p-1' : 'border-b border-border',
          className
        )}
        role="tablist"
        {...props}
      >
        {indexedChildren}
      </div>
    </TabListVariantContext.Provider>
  );
}

export function Tab({
  className,
  children,
  index: tabIndex = 0,
  ...props
}: HTMLAttributes<HTMLButtonElement> & { index?: number }) {
  const ctx = useContext(TabContext);
  const variant = useContext(TabListVariantContext);
  const selected = ctx?.index === tabIndex;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      className={cn(
        'px-4 py-2 text-sm font-medium transition-colors',
        variant === 'solid'
          ? selected
            ? 'rounded-md bg-background text-foreground shadow-sm'
            : 'rounded-md text-muted-foreground hover:text-foreground'
          : selected
            ? '-mb-px border-b-2 border-primary text-foreground'
            : 'text-muted-foreground hover:text-foreground',
        className
      )}
      onClick={() => ctx?.setIndex(tabIndex)}
      {...props}
    >
      {children}
    </button>
  );
}

export function Table({ className, children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('min-w-full divide-y divide-border text-sm', className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn('bg-muted/50', className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn('divide-y divide-border bg-card', className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('hover:bg-muted/30', className)} {...props}>
      {children}
    </tr>
  );
}

export function TableHeaderCell({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('whitespace-nowrap px-4 py-3 text-foreground', className)} {...props}>
      {children}
    </td>
  );
}
