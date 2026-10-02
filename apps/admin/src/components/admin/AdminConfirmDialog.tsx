'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
} from '@nestlancer/ui';

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  /** Runs in the confirm button click, before the dialog closes. Use for window.open. */
  onConfirmClick?: () => void;
};

type ConfirmResult = { confirmed: boolean; reason?: string };

type AdminConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<ConfirmResult>;
};

const AdminConfirmContext = createContext<AdminConfirmContextValue | null>(null);

export function useAdminConfirm() {
  const ctx = useContext(AdminConfirmContext);
  if (!ctx) throw new Error('useAdminConfirm must be used within AdminConfirmProvider');
  return ctx;
}

export function AdminConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [reason, setReason] = useState('');
  const resolverRef = useRef<((result: ConfirmResult) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<ConfirmResult>((resolve) => {
      resolverRef.current = resolve;
      setOptions(opts);
      setReason('');
      setOpen(true);
    });
  }, []);

  const finish = (result: ConfirmResult) => {
    setOpen(false);
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOptions(null);
    setReason('');
  };

  return (
    <AdminConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={open} onOpenChange={(next) => !next && finish({ confirmed: false })}>
        <DialogContent>
          <DialogTitle>{options?.title ?? 'Confirm'}</DialogTitle>
          {options?.description ? (
            <DialogDescription>{options.description}</DialogDescription>
          ) : null}
          {options?.requireReason ? (
            <div className="mt-4 space-y-2">
              <label htmlFor="admin-confirm-reason" className="text-sm font-medium text-foreground">
                {options.reasonLabel ?? 'Reason'}
              </label>
              <Input
                id="admin-confirm-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for this action (audit log)"
              />
            </div>
          ) : null}
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => finish({ confirmed: false })}>
              {options?.cancelLabel ?? 'Cancel'}
            </Button>
            <Button
              type="button"
              variant={options?.destructive ? 'default' : 'default'}
              className={
                options?.destructive
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : undefined
              }
              disabled={options?.requireReason ? !reason.trim() : false}
              onClick={() => {
                options?.onConfirmClick?.();
                finish({ confirmed: true, reason: reason.trim() || undefined });
              }}
            >
              {options?.confirmLabel ?? 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminConfirmContext.Provider>
  );
}
