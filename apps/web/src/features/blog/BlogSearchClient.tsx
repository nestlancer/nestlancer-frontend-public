'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PublicBlogPost } from '@nestlancer/types';

import { routes } from '@nestlancer/constants';

import { apiServices } from '@/lib/axios';

function parseSearchResults(
  raw: unknown
): Pick<PublicBlogPost, 'id' | 'title' | 'slug' | 'excerpt'>[] {
  if (!raw) return [];
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { data?: unknown[] }).data)
      ? (raw as { data: unknown[] }).data
      : Array.isArray((raw as { items?: unknown[] }).items)
        ? (raw as { items: unknown[] }).items
        : [];
  return arr.map((item) => {
    const o = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    return {
      id: String(o.id ?? ''),
      title: String(o.title ?? ''),
      slug: String(o.slug ?? ''),
      excerpt: o.excerpt ? String(o.excerpt) : '',
    };
  });
}

export function BlogSearchClient() {
  const [input, setInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setDebouncedQ(input.trim());
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [input]);

  const searchQ = useQuery({
    queryKey: ['blog', 'search', debouncedQ],
    queryFn: () => apiServices.blog.searchPosts({ q: debouncedQ }),
    enabled: debouncedQ.length >= 2,
  });

  const results = debouncedQ.length >= 2 ? parseSearchResults(searchQ.data) : [];
  const showResults = debouncedQ.length >= 2;

  return (
    <div className="relative">
      <label className="sr-only" htmlFor="blog-search">
        Search posts
      </label>
      <input
        id="blog-search"
        value={input}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
        className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
        placeholder="Search posts…"
        aria-label="Search blog posts"
      />
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
        aria-hidden
      >
        ⌕
      </span>

      {showResults ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-xl border border-border bg-background shadow-lg">
          {searchQ.isLoading ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              No results for &ldquo;{debouncedQ}&rdquo;
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto divide-y divide-border">
              {results.map((r) => (
                <li key={r.id}>
                  <Link
                    href={routes.blogPost(r.slug)}
                    className="block px-4 py-3 hover:bg-muted/40"
                    onClick={() => setInput('')}
                  >
                    <p className="font-medium text-sm text-foreground">{r.title}</p>
                    {r.excerpt ? (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {r.excerpt}
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
