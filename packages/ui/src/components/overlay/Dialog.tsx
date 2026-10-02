'use client';

import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../../utils/cn';

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
};

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('Dialog components must be used within Dialog');
  return ctx;
}

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const titleId = useId();
  return (
    <DialogContext.Provider value={{ open, setOpen: onOpenChange, titleId }}>
      {children}
    </DialogContext.Provider>
  );
}

function focusableIn(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1);
}

export function DialogContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen, titleId } = useDialog();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const root = ref.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const initial = root ? focusableIn(root) : [];
    (initial[0] ?? root)?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== 'Tab' || !root) return;
      const items = focusableIn(root);
      if (items.length === 0) {
        e.preventDefault();
        root.focus({ preventScroll: true });
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !root.contains(active))) {
        e.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!e.shiftKey && (active === last || !root.contains(active))) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add('overflow-hidden');
    return () => document.body.classList.remove('overflow-hidden');
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={() => setOpen(false)}
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative z-[101] w-full max-w-lg rounded-[var(--radius-lg)] border border-border bg-card p-6 shadow-xl outline-none animate-in fade-in zoom-in-95 duration-200 motion-reduce:animate-none',
          className
        )}
        {...props}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export const DialogTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => {
    const { titleId } = useDialog();
    return (
      <h2
        ref={ref}
        id={titleId}
        className={cn('text-lg font-semibold text-foreground', className)}
        {...props}
      >
        {children ?? <span className="sr-only">Dialog title</span>}
      </h2>
    );
  }
);
DialogTitle.displayName = 'DialogTitle';

export function DialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-1 text-sm text-muted-foreground', className)} {...props} />;
}

export function DialogClose({ children, className, ...props }: HTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDialog();
  return (
    <button type="button" className={className} onClick={() => setOpen(false)} {...props}>
      {children}
    </button>
  );
}
