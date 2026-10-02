'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import type { BlogEngagementResult, BlogLikeResult } from '@nestlancer/api-client';
import { useAuth } from '@nestlancer/auth';
import { buildLoginHref, queryKeys, routes } from '@nestlancer/constants';
import { featureFlags } from '@nestlancer/config';

import { FormFieldLabel } from '@nestlancer/field-help';

import { useWebConfirm } from '@/components/web/WebConfirmProvider';
import { apiServices } from '@/lib/axios';
import { blogDebug, blogDebugError, blogDebugWarn } from '@/features/blog/blog-debug';

type Comment = {
  id: string;
  content: string;
  authorName?: string;
  authorId?: string;
  createdAt?: string;
  isOwn?: boolean;
};

type LikeResult = BlogLikeResult;

function authorNameFromRecord(o: Record<string, unknown>): string {
  if (typeof o.authorName === 'string' && o.authorName) return o.authorName;
  const author =
    o.author && typeof o.author === 'object' ? (o.author as Record<string, unknown>) : null;
  if (author) {
    const name = [author.firstName, author.lastName].filter(Boolean).join(' ').trim();
    if (name) return name;
    if (typeof author.name === 'string' && author.name) return author.name;
  }
  if (typeof o.name === 'string' && o.name) return o.name;
  return 'User';
}

function parseComments(raw: unknown, currentUserId?: string | null): Comment[] {
  if (!raw) return [];
  let payload = raw;
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const inner = (payload as { data: unknown }).data;
    if (Array.isArray(inner)) {
      payload = inner;
    } else if (
      inner &&
      typeof inner === 'object' &&
      'data' in inner &&
      Array.isArray((inner as { data: unknown }).data)
    ) {
      payload = (inner as { data: unknown[] }).data;
    } else if (Array.isArray(inner)) {
      payload = inner;
    }
  }
  const arr = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { items?: unknown[] }).items)
      ? (payload as { items: unknown[] }).items
      : [];
  return arr.map((c) => {
    const o = c && typeof c === 'object' ? (c as Record<string, unknown>) : {};
    const author =
      o.author && typeof o.author === 'object' ? (o.author as Record<string, unknown>) : null;
    const authorId = String(o.authorId ?? author?.id ?? '');
    return {
      id: String(o.id ?? ''),
      content: String(o.content ?? o.body ?? ''),
      authorName: authorNameFromRecord(o),
      authorId: authorId || undefined,
      createdAt: o.createdAt ? String(o.createdAt) : undefined,
      isOwn: currentUserId ? authorId === currentUserId : Boolean(o.isOwn ?? o.isMine ?? false),
    };
  });
}

const bookmarkOnly = featureFlags.blogInteractions === 'bookmark';

function parseBookmarkSlugs(raw: unknown): string[] {
  if (!raw) return [];
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { items?: unknown[] }).items)
      ? (raw as { items: unknown[] }).items
      : Array.isArray((raw as { data?: unknown[] }).data)
        ? (raw as { data: unknown[] }).data
        : [];
  return arr
    .map((b) => {
      const o = b && typeof b === 'object' ? (b as Record<string, unknown>) : {};
      const post = o.post && typeof o.post === 'object' ? (o.post as Record<string, unknown>) : o;
      return String(post.slug ?? o.slug ?? '');
    })
    .filter(Boolean);
}

function promptLogin(pathname: string, title: string, description: string) {
  toast.message(title, {
    description,
    action: {
      label: 'Log in',
      onClick: () => {
        window.location.href = buildLoginHref(pathname);
      },
    },
  });
}

export function BlogPostInteractionsClient({
  slug,
  initialLikeCount = 0,
  initialLiked = false,
  initialBookmarked = false,
  commentsEnabled = true,
}: {
  slug: string;
  initialLikeCount?: number;
  initialLiked?: boolean;
  initialBookmarked?: boolean;
  commentsEnabled?: boolean;
}) {
  const confirm = useWebConfirm();
  const qc = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [commentText, setCommentText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    blogDebug('interactions mounted', {
      slug,
      isAuthenticated,
      userId: user?.id ?? null,
      initialLikeCount,
      initialLiked,
      initialBookmarked,
      commentsEnabled,
      bookmarkOnly,
    });
  }, [
    slug,
    isAuthenticated,
    user?.id,
    initialLikeCount,
    initialLiked,
    initialBookmarked,
    commentsEnabled,
  ]);

  const engagementQ = useQuery({
    queryKey: ['blog', 'engagement', slug],
    queryFn: async () => {
      blogDebug('engagement fetch start', { slug });
      const data = await apiServices.blog.getPostEngagement(slug);
      if (data === null) {
        blogDebugWarn('engagement endpoint unavailable (404), using bookmarks fallback', { slug });
        return null;
      }
      blogDebug('engagement fetch success', { slug, ...data });
      return data;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: false,
  });

  const bookmarksQ = useQuery({
    queryKey: queryKeys.blog.list({ scope: 'bookmarks' }),
    queryFn: () => apiServices.blog.getBookmarks(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      blogDebug('engagement skipped (guest)', { slug });
      return;
    }
    if (engagementQ.isError) {
      blogDebugError('engagement fetch failed', engagementQ.error, { slug });
    }
  }, [slug, isAuthenticated, engagementQ.isError, engagementQ.error]);

  useEffect(() => {
    const data = engagementQ.data;
    if (data) {
      blogDebug('engagement applied to UI', { slug, ...data });
      setLiked(data.liked);
      setBookmarked(data.bookmarked);
      setLikeCount(data.likeCount);
      return;
    }
    if (engagementQ.isSuccess && bookmarksQ.data) {
      const isBookmarked = parseBookmarkSlugs(bookmarksQ.data).includes(slug);
      setBookmarked(isBookmarked);
      blogDebug('bookmark state from fallback list', { slug, isBookmarked });
    }
  }, [engagementQ.data, engagementQ.isSuccess, bookmarksQ.data, slug]);

  const commentsQ = useQuery({
    queryKey: ['blog', 'comments', slug],
    queryFn: async () => {
      blogDebug('comments fetch start', { slug });
      const data = await apiServices.blog.listComments(slug);
      blogDebug('comments fetch success', { slug, raw: data });
      return data;
    },
    enabled: !bookmarkOnly,
  });

  useEffect(() => {
    if (commentsQ.isSuccess) {
      const parsed = parseComments(commentsQ.data, user?.id);
      blogDebug('comments loaded', {
        slug,
        count: parsed.length,
        ownCount: parsed.filter((c) => c.isOwn).length,
      });
    }
    if (commentsQ.isError) {
      blogDebugError('comments fetch failed', commentsQ.error, { slug });
    }
  }, [commentsQ.isSuccess, commentsQ.isError, commentsQ.data, commentsQ.error, slug, user?.id]);

  const comments = parseComments(commentsQ.data, user?.id);

  const likeM = useMutation({
    mutationFn: () => apiServices.blog.likePost(slug),
    onMutate: () => {
      let previousLiked = false;
      setLiked((prev) => {
        previousLiked = prev;
        return !prev;
      });
      setLikeCount((c) => (previousLiked ? Math.max(0, c - 1) : c + 1));
      blogDebug('like optimistic update', { slug, previousLiked, nextLiked: !previousLiked });
      return { previousLiked };
    },
    onSuccess: (raw) => {
      const result = raw as LikeResult;
      blogDebug('like success', { slug, result });
      if (typeof result?.liked === 'boolean') {
        setLiked(result.liked);
        qc.setQueryData<BlogEngagementResult | null>(['blog', 'engagement', slug], (old) =>
          old
            ? {
                ...old,
                liked: result.liked!,
                likeCount: typeof result.likeCount === 'number' ? result.likeCount : old.likeCount,
              }
            : old
        );
      }
      if (typeof result?.likeCount === 'number') setLikeCount(result.likeCount);
      if (typeof result?.liked !== 'boolean') {
        void qc.invalidateQueries({ queryKey: ['blog', 'engagement', slug] });
      }
    },
    onError: (e, _vars, context) => {
      blogDebugError('like failed', e, { slug, rolledBackFrom: context?.previousLiked });
      if (context) {
        setLiked(context.previousLiked);
        setLikeCount((c) => (context.previousLiked ? c + 1 : Math.max(0, c - 1)));
      }
      toast.error(getApiErrorMessage(e, 'Could not update like'));
    },
  });

  const bookmarkM = useMutation({
    mutationFn: (nextBookmarked: boolean) => {
      blogDebug('bookmark request', { slug, action: nextBookmarked ? 'remove' : 'add' });
      return nextBookmarked
        ? apiServices.blog.unbookmarkPost(slug)
        : apiServices.blog.bookmarkPost(slug);
    },
    onMutate: (nextBookmarked) => {
      setBookmarked(!nextBookmarked);
      blogDebug('bookmark optimistic update', { slug, nextBookmarked: !nextBookmarked });
    },
    onSuccess: (_data, wasBookmarked) => {
      blogDebug('bookmark success', { slug, wasBookmarked, nowBookmarked: !wasBookmarked });
      toast.success(wasBookmarked ? 'Bookmark removed.' : 'Post bookmarked!');
      void qc.invalidateQueries({ queryKey: ['blog', 'engagement', slug] });
      void qc.invalidateQueries({ queryKey: queryKeys.blog.list({ scope: 'bookmarks' }) });
    },
    onError: (e, wasBookmarked) => {
      blogDebugError('bookmark failed', e, { slug, wasBookmarked });
      setBookmarked(wasBookmarked);
      toast.error(getApiErrorMessage(e, 'Could not update bookmark'));
    },
  });

  const postCommentM = useMutation({
    mutationFn: () => apiServices.blog.postComment(slug, { content: commentText }),
    onMutate: () => {
      blogDebug('comment post start', { slug, length: commentText.trim().length });
    },
    onSuccess: (data) => {
      blogDebug('comment post success', { slug, response: data });
      toast.success('Comment posted!');
      setCommentText('');
      void qc.invalidateQueries({ queryKey: ['blog', 'comments', slug] });
    },
    onError: (e) => {
      blogDebugError('comment post failed', e, { slug });
      toast.error(getApiErrorMessage(e, 'Could not post comment'));
    },
  });

  const editCommentM = useMutation({
    mutationFn: (id: string) => apiServices.blog.patchComment(slug, id, { content: editText }),
    onMutate: (id) => blogDebug('comment edit start', { slug, commentId: id }),
    onSuccess: (_data, id) => {
      blogDebug('comment edit success', { slug, commentId: id });
      toast.success('Comment updated.');
      setEditingId(null);
      setEditText('');
      void qc.invalidateQueries({ queryKey: ['blog', 'comments', slug] });
    },
    onError: (e, id) => {
      blogDebugError('comment edit failed', e, { slug, commentId: id });
      toast.error(getApiErrorMessage(e, 'Could not update comment'));
    },
  });

  const deleteCommentM = useMutation({
    mutationFn: (id: string) => apiServices.blog.deleteComment(slug, id),
    onMutate: (id) => blogDebug('comment delete start', { slug, commentId: id }),
    onSuccess: (_data, id) => {
      blogDebug('comment delete success', { slug, commentId: id });
      toast.success('Comment deleted.');
      void qc.invalidateQueries({ queryKey: ['blog', 'comments', slug] });
    },
    onError: (e, id) => {
      blogDebugError('comment delete failed', e, { slug, commentId: id });
      toast.error(getApiErrorMessage(e, 'Could not delete comment'));
    },
  });

  const handleLikeClick = () => {
    if (!isAuthenticated) {
      blogDebugWarn('like blocked (guest)', { slug });
      promptLogin(
        window.location.pathname,
        'Sign in to like articles',
        'Create an account or log in to like posts.'
      );
      return;
    }
    blogDebug('like click', { slug, currentLiked: liked, currentCount: likeCount });
    likeM.mutate();
  };

  const handleBookmarkClick = () => {
    if (!isAuthenticated) {
      blogDebugWarn('bookmark blocked (guest)', { slug });
      promptLogin(
        window.location.pathname,
        'Sign in to save articles',
        'Create an account or log in to bookmark posts.'
      );
      return;
    }
    blogDebug('bookmark click', { slug, currentBookmarked: bookmarked });
    bookmarkM.mutate(bookmarked);
  };

  const handlePostComment = () => {
    if (!isAuthenticated) {
      blogDebugWarn('comment blocked (guest)', { slug });
      promptLogin(
        window.location.pathname,
        'Sign in to comment',
        'Create an account or log in to join the discussion.'
      );
      return;
    }
    postCommentM.mutate();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        {!bookmarkOnly ? (
          <button
            type="button"
            aria-label={liked ? 'Unlike post' : 'Like post'}
            aria-pressed={liked}
            onClick={handleLikeClick}
            disabled={likeM.isPending}
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
            {likeCount > 0 ? likeCount : liked ? 'Liked' : 'Like'}
          </button>
        ) : null}

        <button
          type="button"
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark post'}
          aria-pressed={bookmarked}
          onClick={handleBookmarkClick}
          disabled={bookmarkM.isPending}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
            bookmarked
              ? 'border-primary/60 bg-primary/10 text-primary'
              : 'border-border bg-surface text-muted-foreground hover:border-primary/40 hover:text-primary'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M10 2c-1.716 0-3.408.106-5.07.31C3.806 2.45 3 3.414 3 4.517V17.25a.75.75 0 001.075.676L10 15.082l5.925 2.844A.75.75 0 0017 17.25V4.517c0-1.103-.806-2.068-1.93-2.207A41.403 41.403 0 0010 2z"
              clipRule="evenodd"
            />
          </svg>
          {bookmarked ? 'Bookmarked' : 'Bookmark'}
        </button>

        {isAuthenticated && bookmarkOnly ? (
          <Link
            href={routes.blogBookmarks}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            View saved
          </Link>
        ) : null}
      </div>

      {!bookmarkOnly && commentsEnabled ? (
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">Comments</h2>
          {commentsQ.isLoading ? (
            <p className="mt-3 text-sm text-muted-foreground">Loading comments…</p>
          ) : null}

          {commentsQ.isError ? (
            <p className="mt-3 text-sm text-destructive">
              {getApiErrorMessage(commentsQ.error, 'Could not load comments.')}
            </p>
          ) : null}

          {!commentsQ.isLoading && !commentsQ.isError && comments.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No comments yet. Be the first!</p>
          ) : null}

          {comments.length > 0 ? (
            <ul className="mt-4 space-y-4">
              {comments.map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border border-border/60 bg-background/60 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{c.authorName}</p>
                      {editingId === c.id ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={editText}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                              setEditText(e.target.value)
                            }
                            className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                            rows={2}
                            placeholder="Edit your comment"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={!editText.trim() || editCommentM.isPending}
                              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                              onClick={() => editCommentM.mutate(c.id)}
                            >
                              {editCommentM.isPending ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-foreground/90">{c.content}</p>
                      )}
                      {c.createdAt ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Intl.DateTimeFormat('en', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }).format(new Date(c.createdAt))}
                        </p>
                      ) : null}
                    </div>
                    {c.isOwn && editingId !== c.id ? (
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingId(c.id);
                            setEditText(c.content);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-xs text-destructive hover:underline disabled:opacity-50"
                          disabled={deleteCommentM.isPending}
                          onClick={async () => {
                            if (
                              await confirm({
                                title: 'Delete comment?',
                                destructive: true,
                              })
                            ) {
                              deleteCommentM.mutate(c.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-5 space-y-2">
            <FormFieldLabel fieldKey="blog.commentBody" label="Comment">
              Comment
            </FormFieldLabel>
            <textarea
              value={commentText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setCommentText(e.target.value)
              }
              placeholder={isAuthenticated ? 'Write a comment…' : 'Sign in to write a comment…'}
              className="min-h-[80px] w-full rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="button"
              disabled={!commentText.trim() || postCommentM.isPending}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              onClick={handlePostComment}
            >
              {postCommentM.isPending ? 'Posting…' : 'Post comment'}
            </button>
          </div>
        </div>
      ) : null}

      {!bookmarkOnly && !commentsEnabled ? (
        <p className="text-sm text-muted-foreground">Comments are closed for this article.</p>
      ) : null}
    </div>
  );
}
