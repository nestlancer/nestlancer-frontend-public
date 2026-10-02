'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { getApiErrorMessage } from '@nestlancer/api-client';
import type { Message } from '@nestlancer/types';
import { ConversationSearchPanel } from '@nestlancer/ui';

import { apiServices } from '@/lib/axios';

export function useConversationSearch(scope: { projectId?: string; threadId?: string }) {
  const [results, setResults] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  const search = useMutation({
    mutationFn: (query: string) =>
      apiServices.messaging.searchMessages({
        q: query,
        projectId: scope.projectId,
        threadId: scope.threadId,
      }),
    onSuccess: (data) => {
      setResults(data.items ?? []);
      setError(null);
    },
    onError: (e) => {
      setResults([]);
      setError(getApiErrorMessage(e, 'Search failed'));
    },
  });

  return {
    results,
    error,
    isSearching: search.isPending,
    search: (query: string) => {
      if (!query.trim()) {
        setResults([]);
        setError(null);
        return;
      }
      search.mutate(query.trim());
    },
    clear: () => {
      setResults([]);
      setError(null);
    },
  };
}

export function ConversationSearchSidebar({
  projectId,
  threadId,
}: {
  projectId?: string;
  threadId?: string;
}) {
  const { results, error, isSearching, search } = useConversationSearch({ projectId, threadId });

  return (
    <ConversationSearchPanel
      onSearch={search}
      results={results}
      isSearching={isSearching}
      error={error}
    />
  );
}
