'use client';

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';

import { cn } from '../../utils/cn';
import { IconX } from '../../icons';

type SheetContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
};

const SheetContext = createContext<SheetContextValue | null>(null);

function useSheet() {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error('Sheet components must be used within Sheet');
  return ctx;
}

export function Sheet({
  children,
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
}: {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const open = controlledOpen ?? uncontrolled;
  const setOpen = useCallback(
    (next: boolean) => {
      setUncontrolled(next);
      onOpenChange?.(next);
    },
    [onOpenChange]
  );
  const titleId = useId();
  const descriptionId = useId();

  return (
    <SheetContext.Provider value={{ open, setOpen, titleId, descriptionId }}>
      {children}
    </SheetContext.Provider>
  );
}

export function SheetTrigger({ children, asChild }: { children: ReactElement; asChild?: boolean }) {
  const { setOpen } = useSheet();
  const onClick = () => setOpen(true);
  if (asChild) {
    return (
      <children.type
        {...children.props}
        onClick={(e: React.MouseEvent) => {
          children.props.onClick?.(e);
          onClick();
        }}
      />
    );
  }
  return (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  );
}

export const SheetClose = forwardRef<HTMLButtonElement, HTMLAttributes<HTMLButtonElement>>(
  ({ className, onClick, ...props }, ref) => {
    const { setOpen } = useSheet();
    return (
      <button
        ref={ref}
        type="button"
        className={className}
        onClick={(e) => {
          onClick?.(e);
          setOpen(false);
        }}
        {...props}
      />
    );
  }
);
SheetClose.displayName = 'SheetClose';

export function SheetPortal({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export const SheetOverlay = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'fixed inset-0 z-[60] bg-background/70 backdrop-blur-sm animate-in fade-in-0',
        className
      )}
      aria-hidden
      {...props}
    />
  )
);
SheetOverlay.displayName = 'SheetOverlay';

type SheetContentProps = HTMLAttributes<HTMLDivElement> & {
  side?: 'left' | 'right';
};

export const SheetContent = forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side = 'left', className, children, ...props }, ref) => {
    const { open, setOpen, titleId, descriptionId } = useSheet();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog || !open) return;

      // NL-BUG-A11Y-001: restore focus to the Open menu (or other) trigger after Escape/close.
      // Native <dialog> restore often fails when we unmount on close.
      const previouslyFocused = document.activeElement as HTMLElement | null;
      if (!dialog.open) dialog.showModal();

      const panel = panelRef.current;
      const initial = panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1)
        : [];
      (initial[0] ?? panel)?.focus?.({ preventScroll: true });

      const onClose = () => setOpen(false);
      const onCancel = (e: Event) => {
        e.preventDefault();
        setOpen(false);
      };
      dialog.addEventListener('close', onClose);
      dialog.addEventListener('cancel', onCancel);
      return () => {
        dialog.removeEventListener('close', onClose);
        dialog.removeEventListener('cancel', onCancel);
        if (dialog.open) dialog.close();
        previouslyFocused?.focus?.({ preventScroll: true });
      };
    }, [open, setOpen]);

    // Unmount when closed so AT does not see a 0×0 “Menu” heading (NL-A11Y-004).
    if (!open) return null;

    return (
      // Backdrop click dismisses. Escape is handled by the native dialog `cancel` event.
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- <dialog> is the correct control; cancel listener is attached above
      <dialog
        ref={dialogRef}
        className="fixed inset-0 z-[70] m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-background/80"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        <div
          ref={(node) => {
            panelRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          className={cn(
            'fixed flex h-full flex-col gap-4 overflow-y-auto border-border/80 bg-card shadow-glass-lg',
            side === 'left' &&
              'inset-y-0 left-0 w-full border-r animate-in slide-in-from-left sm:w-[min(100%,20rem)]',
            side === 'right' &&
              'inset-y-0 right-0 w-full border-l animate-in slide-in-from-right sm:w-[min(100%,20rem)]',
            className
          )}
          {...props}
        >
          {children}
          <SheetClose
            className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground opacity-70 ring-offset-background transition-theme hover:bg-accent hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Close"
          >
            <IconX className="h-4 w-4" />
          </SheetClose>
        </div>
      </dialog>
    );
  }
);
SheetContent.displayName = 'SheetContent';

export function SheetHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 pr-10 text-left', className)} {...props} />;
}

export const SheetTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => {
    const { titleId } = useSheet();
    return (
      <h2
        ref={ref}
        id={titleId}
        className={cn('font-display text-lg font-semibold text-foreground', className)}
        {...props}
      >
        {children}
      </h2>
    );
  }
);
SheetTitle.displayName = 'SheetTitle';

export const SheetDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { descriptionId } = useSheet();
  return (
    <p
      ref={ref}
      id={descriptionId}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});
SheetDescription.displayName = 'SheetDescription';
