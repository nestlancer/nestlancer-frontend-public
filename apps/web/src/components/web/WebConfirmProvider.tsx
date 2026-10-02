'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

import { Button, Dialog, DialogContent, DialogDescription, DialogTitle, cn } from '@nestlancer/ui';

export type WebConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type WebConfirmContextValue = {
  confirm: (options: WebConfirmOptions) => Promise<boolean>;
};

const WebConfirmContext = createContext<WebConfirmContextValue | null>(null);

export function WebConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<{ options: WebConfirmOptions } | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: WebConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setPending({ options });
    });
  }, []);

  const close = (result: boolean) => {
    setPending(null);
    resolveRef.current?.(result);
    resolveRef.current = null;
  };

  const opts = pending?.options;

  return (
    <WebConfirmContext.Provider value={{ confirm }}>
      {children}
      {opts ? (
        <Dialog open onOpenChange={(open) => !open && close(false)}>
          <DialogContent className="max-w-md border-gray-200 dark:border-gray-800">
            <DialogTitle className="text-gray-800 dark:text-white/90">{opts.title}</DialogTitle>
            {opts.description ? (
              <DialogDescription className="text-gray-500 dark:text-gray-400">
                {opts.description}
              </DialogDescription>
            ) : null}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => close(false)}>
                {opts.cancelLabel ?? 'Cancel'}
              </Button>
              <Button
                type="button"
                className={cn(
                  opts.destructive
                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    : 'bg-ta-brand-500 text-white hover:bg-ta-brand-600'
                )}
                onClick={() => close(true)}
              >
                {opts.confirmLabel ?? 'Confirm'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </WebConfirmContext.Provider>
  );
}

export function useWebConfirm() {
  const ctx = useContext(WebConfirmContext);
  if (!ctx) {
    throw new Error('useWebConfirm must be used within WebConfirmProvider');
  }
  return ctx.confirm;
}
