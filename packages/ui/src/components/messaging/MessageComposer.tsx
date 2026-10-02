'use client';

import type { KeyboardEvent, ReactNode } from 'react';
import { useEffect, useId, useRef, useState } from 'react';

import { Paperclip, Send, X } from '../../icons';
import { cn } from '../../utils/cn';
import { Button } from '../primitives/button/Button';

export type MessageComposerPendingFile = {
  file: File;
  previewUrl: string | null;
};

function formatBytes(size: number): string {
  if (!Number.isFinite(size) || size < 0) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export function MessageComposer({
  value,
  onChange,
  onSend,
  placeholder = 'Write a message…',
  disabled,
  sendDisabled,
  sendPending,
  attachmentSlot,
  leadingSlot,
  className,
  variant = 'client',
  density = 'default',
  enableFileAttach = false,
  onSendFile,
  fileSendPending,
  fileAccept,
  replyTo,
  onCancelReply,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  sendDisabled?: boolean;
  sendPending?: boolean;
  /** Legacy slot (e.g. custom attach). Prefer enableFileAttach + onSendFile. */
  attachmentSlot?: ReactNode;
  /** Extra controls before the attach / textarea row (e.g. quick replies). */
  leadingSlot?: ReactNode;
  className?: string;
  variant?: 'client' | 'admin';
  density?: 'default' | 'compact';
  /** Stage a file in a preview tray; caption uses the composer text. */
  enableFileAttach?: boolean;
  onSendFile?: (file: File, caption: string) => void | Promise<void>;
  fileSendPending?: boolean;
  fileAccept?: string;
  /** Optional quote-reply target shown above the composer. */
  replyTo?: { label: string; preview: string } | null;
  onCancelReply?: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();
  const messageFieldId = useId();
  const compact = density === 'compact';
  const [pending, setPending] = useState<MessageComposerPendingFile | null>(null);
  const [fileBusy, setFileBusy] = useState(false);

  const busy = Boolean(sendPending || fileSendPending || fileBusy);
  const canSendText = !sendDisabled && value.trim().length > 0;
  const canSendFile = Boolean(pending && onSendFile);
  const canSubmit = !busy && !disabled && (canSendFile || canSendText);

  const clearPending = () => {
    setPending((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
  };

  useEffect(() => {
    return () => {
      if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revoke only on unmount
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const minRows = compact ? 1 : variant === 'admin' ? 2 : 1;
    el.rows = minRows;
    const computed = getComputedStyle(el);
    const lineHeight = Number.parseFloat(computed.lineHeight);
    const paddingTop = Number.parseFloat(computed.paddingTop);
    const paddingBottom = Number.parseFloat(computed.paddingBottom);
    const usable = Number.isFinite(lineHeight) && lineHeight > 0 ? lineHeight : 20;
    const padding =
      (Number.isFinite(paddingTop) ? paddingTop : 0) +
      (Number.isFinite(paddingBottom) ? paddingBottom : 0);
    const contentHeight = Math.max(0, el.scrollHeight - padding);
    el.rows = Math.min(8, Math.max(minRows, Math.ceil(contentHeight / usable)));
  }, [value, compact, variant]);

  const stageFile = (file: File) => {
    setPending((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return {
        file,
        previewUrl: isImageFile(file) ? URL.createObjectURL(file) : null,
      };
    });
  };

  const submit = async () => {
    if (!canSubmit) return;
    if (pending && onSendFile) {
      setFileBusy(true);
      try {
        await onSendFile(pending.file, value.trim());
        onChange('');
        clearPending();
      } finally {
        setFileBusy(false);
      }
      return;
    }
    onSend();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  const showBuiltInAttach = enableFileAttach && typeof onSendFile === 'function';

  return (
    <div className={cn('flex w-full flex-col', compact ? 'gap-1.5' : 'gap-2', className)}>
      {replyTo ? (
        <div className="composer-reply-banner" role="status">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              Replying to {replyTo.label}
            </p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{replyTo.preview}</p>
          </div>
          {onCancelReply ? (
            <button
              type="button"
              className="composer-attachment-tray-remove"
              aria-label="Cancel reply"
              disabled={busy}
              onClick={onCancelReply}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ) : null}

      {pending ? (
        <div
          className="composer-attachment-tray"
          role="group"
          aria-label="Attachment ready to send"
        >
          <div className="composer-attachment-tray-preview">
            {pending.previewUrl ? (
              <img src={pending.previewUrl} alt="" className="composer-attachment-tray-thumb" />
            ) : (
              <div className="composer-attachment-tray-file-icon" aria-hidden>
                <Paperclip className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{pending.file.name}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {[pending.file.type || 'File', formatBytes(pending.file.size)]
                  .filter(Boolean)
                  .join(' · ')}
                {' · '}
                Add a caption below, then send
              </p>
            </div>
            <button
              type="button"
              className="composer-attachment-tray-remove"
              aria-label="Remove attachment"
              disabled={busy}
              onClick={clearPending}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <form
        className={cn('flex items-end', compact ? 'gap-1.5' : 'gap-2')}
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {leadingSlot ? <div className="shrink-0 self-end">{leadingSlot}</div> : null}

        {showBuiltInAttach ? (
          <>
            <input
              id={fileInputId}
              name="message-attachment"
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={fileAccept}
              disabled={disabled || busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) stageFile(file);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              title="Attach file or image"
              aria-label="Attach file or image"
              disabled={disabled || busy}
              className={cn(
                'inline-flex shrink-0 items-center justify-center border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:border-primary/30 hover:text-primary disabled:opacity-50',
                compact
                  ? 'h-9 w-9 rounded-lg'
                  : variant === 'admin'
                    ? 'h-10 w-10 rounded-lg'
                    : 'h-11 w-11 rounded-xl'
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </button>
          </>
        ) : attachmentSlot ? (
          <div className="shrink-0 self-end">{attachmentSlot}</div>
        ) : null}

        <textarea
          id={messageFieldId}
          name="message"
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || busy}
          rows={compact ? 1 : variant === 'admin' ? 2 : 1}
          aria-label={pending ? 'Attachment caption' : 'Message'}
          placeholder={pending ? 'Add a caption for this attachment (optional)…' : placeholder}
          className={cn(
            'flex-1 resize-none overflow-y-auto border border-border bg-card text-sm leading-relaxed shadow-sm placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50',
            compact
              ? 'max-h-24 min-h-[2.25rem] rounded-xl px-3 py-2 text-[13px]'
              : 'max-h-32 min-h-[2.75rem] rounded-2xl px-4 py-3'
          )}
        />

        <Button
          type="submit"
          className={cn(
            'shrink-0 gap-1.5 rounded-2xl bg-gradient-to-r from-primary to-primary/80 font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40',
            compact
              ? 'h-9 rounded-lg px-3.5 text-xs'
              : cn('h-11 px-5', variant === 'admin' && 'h-10 rounded-xl px-4 text-sm')
          )}
          disabled={!canSubmit}
        >
          <span>{busy ? 'Sending…' : pending ? 'Send file' : 'Send'}</span>
          {variant === 'client' && !compact && !busy ? <Send className="h-4 w-4" /> : null}
        </Button>
      </form>
    </div>
  );
}
