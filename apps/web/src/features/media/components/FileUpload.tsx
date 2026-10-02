'use client';

import { useRef } from 'react';

import { Button } from '@nestlancer/ui';

import { useMediaUpload } from '@/features/media/hooks/useMediaUpload';

export function FileUpload({
  onUploaded,
  label = 'Choose file',
}: {
  onUploaded?: (mediaId: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useMediaUpload({
    onSuccess: (r) => onUploaded?.(r.mediaId),
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload({ file: f });
          e.target.value = '';
        }}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? 'Uploading…' : label}
      </Button>
    </div>
  );
}
