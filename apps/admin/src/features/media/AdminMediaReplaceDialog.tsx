'use client';

import { useRef, useState } from 'react';

import { ACCEPTED_MEDIA_FILE_ACCEPT } from '@nestlancer/api-client';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  PctProgressFill,
} from '@nestlancer/ui';

import { useAdminMediaReplace } from './hooks/useAdminMediaReplace';

export function AdminMediaReplaceDialog({
  mediaId,
  filename,
  open,
  onOpenChange,
}: {
  mediaId: string | null;
  filename: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { replace, progress, isReplacing, resetProgress } = useAdminMediaReplace(mediaId);

  const handleClose = (next: boolean) => {
    if (isReplacing) return;
    if (!next) {
      setSelectedFile(null);
      resetProgress();
    }
    onOpenChange(next);
  };

  const handleReplace = async () => {
    if (!selectedFile) return;
    await replace.mutateAsync({ file: selectedFile });
    setSelectedFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogTitle>Replace file</DialogTitle>
        <DialogDescription>
          Upload a new file to replace <span className="font-medium">{filename}</span>. Existing
          links keep the same media ID.
        </DialogDescription>

        <div className="mt-4 space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_MEDIA_FILE_ACCEPT}
            className="hidden"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isReplacing}
              onClick={() => inputRef.current?.click()}
            >
              Choose file
            </Button>
            <span className="truncate text-sm text-muted-foreground">
              {selectedFile?.name ?? 'No file selected'}
            </span>
          </div>

          {progress != null ? (
            <div className="space-y-1">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <PctProgressFill pct={progress} fillClassName="fill-primary" className="h-full" />
              </div>
              <p className="text-xs text-muted-foreground">Uploading… {progress}%</p>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isReplacing}
            onClick={() => handleClose(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!selectedFile || isReplacing}
            onClick={() => void handleReplace()}
          >
            {isReplacing ? 'Replacing…' : 'Replace file'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
