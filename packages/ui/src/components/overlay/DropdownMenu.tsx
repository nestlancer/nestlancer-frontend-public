'use client';

import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type MouseEvent,
  type MutableRefObject,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../../utils/cn';
import { useClickOutside } from '../../hooks/useClickOutside';
import { Check, ChevronRight, Circle } from '../../icons';

type DropdownContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: MutableRefObject<HTMLElement | null>;
  anchorRect: DOMRect | null;
  setAnchorRect: (rect: DOMRect | null) => void;
};

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdown() {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error('DropdownMenu components must be used within DropdownMenu');
  return ctx;
}

function composeRefs<T>(...refs: Array<Ref<T> | undefined>): Ref<T> {
  return (node: T | null) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') ref(node);
      else (ref as MutableRefObject<T | null>).current = node;
    });
  };
}

function readAnchorRect(node: EventTarget | null): DOMRect | null {
  return node instanceof HTMLElement ? node.getBoundingClientRect() : null;
}

function cssIdent(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '');
  return cleaned.length > 0 ? cleaned : 'menu';
}

function readCspNonce(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content')?.trim();
  return value || undefined;
}

/** Pixel offsets only — written into a nonce style element so production CSP keeps the menu placed. */
function buildMenuPositionCss(
  menuId: string,
  rect: DOMRect,
  align: 'start' | 'center' | 'end',
  sideOffset: number
): string {
  const top = Math.round(rect.bottom + sideOffset);
  if (align === 'end') {
    const right = Math.round(window.innerWidth - rect.right);
    return `#${menuId}{top:${top}px;right:${right}px}`;
  }
  const left = align === 'center' ? Math.round(rect.left + rect.width / 2) : Math.round(rect.left);
  return `#${menuId}{top:${top}px;left:${left}px}`;
}

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerRef, anchorRect, setAnchorRect }}>
      {children}
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  asChild,
  className,
  ...props
}: HTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { open, setOpen, triggerRef, setAnchorRect } = useDropdown();

  const toggle = (target: EventTarget | null) => {
    const willOpen = !open;
    if (willOpen) {
      setAnchorRect(readAnchorRect(target) ?? readAnchorRect(triggerRef.current));
    } else {
      setAnchorRect(null);
    }
    setOpen(willOpen);
  };

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{
      className?: string;
      onClick?: (e: MouseEvent) => void;
      ref?: Ref<HTMLElement>;
    }>;
    return cloneElement(child, {
      'aria-expanded': open,
      'aria-haspopup': 'menu',
      onClick: (e: MouseEvent) => {
        child.props.onClick?.(e);
        toggle(e.currentTarget);
      },
      className: cn('cursor-pointer', child.props.className, className),
      ref: composeRefs<HTMLElement>((node) => {
        triggerRef.current = node;
      }, child.props.ref),
    } as Record<string, unknown>);
  }

  return (
    <button
      ref={(node) => {
        triggerRef.current = node;
      }}
      type="button"
      aria-expanded={open}
      aria-haspopup="menu"
      className={cn('cursor-pointer', className)}
      onClick={(e) => toggle(e.currentTarget)}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuGroup({ children }: { children: ReactNode }) {
  return <div role="group">{children}</div>;
}

export function DropdownMenuPortal({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function DropdownMenuSub({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function DropdownMenuRadioGroup({ children }: { children: ReactNode }) {
  return <div role="group">{children}</div>;
}

export const DropdownMenuContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'center' | 'end'; sideOffset?: number }
>(({ className, align = 'start', sideOffset = 6, children, style: _style, ...props }, ref) => {
  void _style;
  const { open, setOpen, triggerRef, anchorRect, setAnchorRect } = useDropdown();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const reactId = useId();
  const menuId = `nl-menu-${cssIdent(reactId)}`;
  const [positionCss, setPositionCss] = useState<string | null>(null);

  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect() ?? anchorRect;
    if (!rect) return;
    setPositionCss(buildMenuPositionCss(menuId, rect, align, sideOffset));
  }, [align, anchorRect, menuId, sideOffset, triggerRef]);

  useClickOutside(
    panelRef,
    () => {
      setAnchorRect(null);
      setOpen(false);
    },
    open
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAnchorRect(null);
        setOpen(false);
      }
    };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, setAnchorRect, setOpen]);

  useLayoutEffect(() => {
    if (!open) {
      setPositionCss(null);
      return;
    }

    updatePosition();

    const onReposition = () => updatePosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open, updatePosition]);

  useLayoutEffect(() => {
    if (!open || !positionCss) return;
    const tag = document.createElement('style');
    const nonce = readCspNonce();
    if (nonce) tag.setAttribute('nonce', nonce);
    tag.setAttribute('data-nl-menu-pos', menuId);
    tag.textContent = positionCss;
    document.head.appendChild(tag);
    return () => tag.remove();
  }, [menuId, open, positionCss]);

  if (!open || typeof document === 'undefined' || !positionCss) return null;

  const setRefs = (node: HTMLDivElement | null) => {
    panelRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  return createPortal(
    <div
      ref={setRefs}
      id={menuId}
      role="menu"
      className={cn(
        'fixed z-[100] min-w-[12rem] overflow-hidden rounded-xl border border-border/80 bg-popover/95 p-1.5 text-popover-foreground shadow-[var(--glass-shadow)] backdrop-blur-xl animate-in fade-in-0 zoom-in-95',
        align === 'center' && '-translate-x-1/2',
        className
      )}
      {...props}
    >
      {children}
    </div>,
    document.body
  );
});
DropdownMenuContent.displayName = 'DropdownMenuContent';

export const DropdownMenuItem = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { inset?: boolean; asChild?: boolean }
>(({ className, inset, asChild, children, onClick, ...props }, ref) => {
  const { setOpen } = useDropdown();
  const classes = cn(
    'relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2 py-2 text-sm outline-none transition-theme focus:bg-accent focus:text-accent-foreground',
    inset && 'pl-8',
    className
  );

  const close = () => setOpen(false);

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{
      className?: string;
      onClick?: (e: MouseEvent) => void;
    }>;
    return cloneElement(child, {
      className: cn(classes, child.props.className),
      onClick: (e: MouseEvent) => {
        child.props.onClick?.(e);
        close();
      },
    } as Record<string, unknown>);
  }

  return (
    <div
      ref={ref}
      role="menuitem"
      tabIndex={0}
      className={classes}
      onClick={(e) => {
        onClick?.(e);
        close();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(e as unknown as MouseEvent<HTMLDivElement>);
          close();
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
});
DropdownMenuItem.displayName = 'DropdownMenuItem';

export const DropdownMenuCheckboxItem = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { checked?: boolean }
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuItem ref={ref} className={cn('pl-8', className)} {...props}>
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {checked ? <Check className="h-4 w-4" /> : null}
    </span>
    {children}
  </DropdownMenuItem>
));
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

export const DropdownMenuRadioItem = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <DropdownMenuItem ref={ref} className={cn('pl-8', className)} {...props}>
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <Circle className="h-2 w-2 fill-current" />
      </span>
      {children}
    </DropdownMenuItem>
  )
);
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

export const DropdownMenuLabel = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

export const DropdownMenuSeparator = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="separator"
      className={cn('-mx-1 my-1 h-px bg-border/80', className)}
      {...props}
    />
  )
);
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export function DropdownMenuShortcut({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn('ml-auto text-xs tracking-widest opacity-60', className)} {...props} />
  );
}

export function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { inset?: boolean }) {
  return (
    <div
      className={cn(
        'flex cursor-default select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none focus:bg-accent',
        inset && 'pl-8',
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4" />
    </div>
  );
}

export const DropdownMenuSubContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'z-[100] min-w-[8rem] overflow-hidden rounded-xl border border-border/80 bg-popover/95 p-1 text-popover-foreground shadow-[var(--glass-shadow)] backdrop-blur-xl',
        className
      )}
      {...props}
    />
  )
);
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';
