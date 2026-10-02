'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { cn } from '../utils/cn';

export type ToastVariant = 'default' | 'success' | 'error' | 'info';

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastItem = {
  id: string;
  title?: string;
  description?: string;
  message?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
};

type ToastInput = Omit<ToastItem, 'id'> & { message?: string };

const variantClass: Record<ToastVariant, string> = {
  default: 'border-border bg-card text-card-foreground',
  success: 'border-emerald-500/30 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100',
  error: 'border-red-500/30 bg-red-50 text-red-950 dark:bg-red-950/40 dark:text-red-100',
  info: 'border-blue-500/30 bg-blue-50 text-blue-950 dark:bg-blue-950/40 dark:text-blue-100',
};

let externalPush: ((toast: ToastInput) => string) | null = null;

function genId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function pushToast(input: ToastInput): string {
  if (externalPush) return externalPush(input);
  return genId();
}

export const toast = Object.assign(
  (message: string, options?: Omit<ToastInput, 'message'>) =>
    pushToast({ message, title: options?.title, variant: options?.variant ?? 'default', ...options }),
  {
    success: (message: string, options?: Omit<ToastInput, 'message' | 'variant'>) =>
      pushToast({ message, variant: 'success', ...options }),
    error: (message: string, options?: Omit<ToastInput, 'message' | 'variant'>) =>
      pushToast({ message, variant: 'error', ...options }),
    info: (message: string, options?: Omit<ToastInput, 'message' | 'variant'>) =>
      pushToast({ message, variant: 'info', ...options }),
    message: (message: string, options?: Omit<ToastInput, 'message'>) =>
      pushToast({ message, variant: 'info', ...options }),
  }
);

type ToastContextValue = {
  show: (input: ToastInput) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastViewport({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: string) => void }) {
  if (!items.length) return null;
  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[200] flex max-w-sm flex-col gap-2"
      aria-live="polite"
      aria-relevant="additions"
    >
      {items.map((item) => {
        const body = item.message ?? item.title ?? '';
        const hasTitle = Boolean(item.message && item.title);
        return (
          <div
            key={item.id}
            role={item.variant === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto relative animate-in fade-in-0 slide-in-from-bottom-2 rounded-lg border px-4 py-3 pr-8 text-sm shadow-lg',
              variantClass[item.variant ?? 'default']
            )}
          >
            {hasTitle ? <p className="font-medium">{item.title}</p> : null}
            <p className={cn(hasTitle && 'mt-0.5 opacity-90')}>{body}</p>
            {item.description ? <p className="mt-1 text-xs opacity-80">{item.description}</p> : null}
            {item.action ? (
              <button
                type="button"
                className="mt-2 text-xs font-medium underline underline-offset-2"
                onClick={() => {
                  item.action?.onClick();
                  onDismiss(item.id);
                }}
              >
                {item.action.label}
              </button>
            ) : null}
            <button
              type="button"
              className="absolute right-2 top-2 rounded p-1 text-xs opacity-60 hover:opacity-100"
              aria-label="Dismiss"
              onClick={() => onDismiss(item.id)}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const show = useCallback(
    (input: ToastInput) => {
      const id = genId();
      const item: ToastItem = { id, duration: 4000, ...input };
      setItems((prev) => [...prev, item]);
      const ms = item.duration ?? 4000;
      if (ms > 0) {
        const t = setTimeout(() => dismiss(id), ms);
        timers.current.set(id, t);
      }
      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    externalPush = show;
    return () => {
      externalPush = null;
    };
  }, [show]);

  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

/** Drop-in replacement for Sonner Toaster — mount once in app providers */
export function Toaster() {
  return null;
}
