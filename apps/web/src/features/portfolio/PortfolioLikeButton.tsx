'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';

import { apiServices } from '@/lib/axios';

export function PortfolioLikeButton({
  itemId,
  idOrSlug,
  initialCount = 0,
}: {
  itemId: string;
  idOrSlug: string;
  initialCount?: number;
}) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);

  const likeM = useMutation({
    mutationFn: () => apiServices.portfolio.like(idOrSlug || itemId),
    onMutate: () => {
      setLiked((prev) => !prev);
      setCount((c) => (liked ? Math.max(0, c - 1) : c + 1));
    },
    onSuccess: (result) => {
      if (typeof result?.liked === 'boolean') setLiked(result.liked);
      if (typeof result?.likeCount === 'number') setCount(result.likeCount);
    },
    onError: (e) => {
      setLiked((prev) => !prev);
      setCount((c) => (liked ? c + 1 : Math.max(0, c - 1)));
      toast.error(getApiErrorMessage(e, 'Could not like item'));
    },
  });

  return (
    <button
      type="button"
      disabled={likeM.isPending}
      aria-label={liked ? 'Unlike' : 'Like'}
      onClick={() => likeM.mutate()}
      className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
        liked
          ? 'border-red-400 bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
          : 'border-border bg-surface text-muted-foreground hover:border-red-300 hover:text-red-500'
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4"
      >
        <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-2.09C4.244 12.982 3 11.4 3 9.249 3 7.109 4.609 5.5 6.75 5.5c1.19 0 2.294.54 3.006 1.394A3.744 3.744 0 0113.25 5.5C15.391 5.5 17 7.109 17 9.249c0 2.151-1.244 3.733-2.885 5.081a22.07 22.07 0 01-2.582 2.09 20.759 20.759 0 01-1.162.682l-.019.01-.005.003h-.001a.75.75 0 01-.694 0l-.001-.001z" />
      </svg>
      {count > 0 ? count : liked ? 'Liked' : 'Like'}
    </button>
  );
}
