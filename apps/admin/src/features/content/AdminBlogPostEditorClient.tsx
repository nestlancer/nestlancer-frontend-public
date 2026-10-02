'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { FormFieldLabel } from '@nestlancer/field-help';
import { Button, cn, Input } from '@nestlancer/ui';
import { ExternalLink, MonitorSmartphone, Smartphone } from '@nestlancer/ui/icons';

import { AdminSection } from '@/components/admin/AdminConsolePrimitives';
import { getPublicWebOrigin } from './blog-admin-helpers';
import { PageHeader } from '@/components/admin/AdminDataViews';
import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminRecord, pickAdminRows } from '@/lib/admin-response';
import { apiServices } from '@/lib/axios';

import { BlogPostPreview } from './BlogPostPreview';

interface Props {
  postId?: string;
}

type EditorView = 'write' | 'split' | 'preview';
type PreviewDevice = 'desktop' | 'mobile';

function parseCategories(raw: unknown): { id: string; name: string }[] {
  const rows = pickAdminRows(raw);
  return rows
    .map((row) => ({
      id: String(row.id ?? ''),
      name: String(row.name ?? row.title ?? row.slug ?? ''),
    }))
    .filter((c) => c.id && c.name);
}

export function AdminBlogPostEditorClient({ postId }: Props) {
  const router = useRouter();
  const isEditing = Boolean(postId);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [initialized, setInitialized] = useState(!isEditing);
  const [editorView, setEditorView] = useState<EditorView>('write');
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');

  const wordCount = useMemo(() => content.trim().split(/\s+/).filter(Boolean).length, [content]);
  const readingMinutes = useMemo(() => Math.max(1, Math.ceil(wordCount / 200)), [wordCount]);
  const excerptChars = excerpt.length;

  const publicWebOrigin = getPublicWebOrigin();

  const categoriesQ = useQuery({
    queryKey: adminKeys.blogCategories(),
    queryFn: () => apiServices.admin.listBlogCategories(),
  });

  const categories = parseCategories(categoriesQ.data);
  const selectedCategory = categories.find((category) => category.id === categoryId)?.name;
  const previewTags = useMemo(
    () =>
      tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tags]
  );

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0]!.id);
    }
  }, [categories, categoryId]);

  const existingQ = useQuery({
    queryKey: ['admin', 'post', postId],
    queryFn: () => apiServices.admin.getAdminBlogPost(postId!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (!initialized && existingQ.data) {
      const rec = pickAdminRecord(existingQ.data) ?? {};
      setTitle(String(rec.title ?? ''));
      setSlug(String(rec.slug ?? ''));
      setExcerpt(String(rec.excerpt ?? ''));
      setContent(String(rec.content ?? rec.body ?? ''));
      setTags(
        Array.isArray(rec.tags)
          ? rec.tags
              .map((tag) =>
                tag && typeof tag === 'object'
                  ? String((tag as Record<string, unknown>).name ?? '')
                  : String(tag)
              )
              .filter(Boolean)
              .join(', ')
          : String(rec.tags ?? '')
      );
      const cat =
        rec.categoryId ??
        (rec.category && typeof rec.category === 'object'
          ? (rec.category as Record<string, unknown>).id
          : '');
      if (cat) setCategoryId(String(cat));
      setStatus(String(rec.status ?? 'DRAFT'));
      const seo =
        rec.seo && typeof rec.seo === 'object' ? (rec.seo as Record<string, unknown>) : {};
      setMetaTitle(String(seo.metaTitle ?? rec.title ?? ''));
      setMetaDescription(String(seo.metaDescription ?? rec.excerpt ?? ''));
      setInitialized(true);
    }
  }, [existingQ.data, initialized]);

  const buildPayload = () => ({
    title,
    slug: slug || undefined,
    excerpt: excerpt || title.slice(0, 200),
    content,
    contentFormat: 'MARKDOWN' as const,
    categoryId: categoryId || undefined,
    tags: tags
      ? tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
    seo: {
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt || title.slice(0, 160),
    },
  });

  const createM = useMutation({
    mutationFn: () => apiServices.admin.createAdminBlogPostFull(buildPayload()),
    onSuccess: (data) => {
      toast.success('Post created.');
      const rec = pickAdminRecord(data) ?? {};
      const id = String(rec.id ?? '');
      if (id) router.push(`/content/posts/${encodeURIComponent(id)}/edit`);
      else router.push('/content');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not create post')),
  });

  const updateM = useMutation({
    mutationFn: () =>
      apiServices.admin.updateAdminBlogPost(postId!, {
        ...buildPayload(),
        status,
      }),
    onSuccess: () => {
      toast.success('Post saved.');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not save post')),
  });

  const publishM = useMutation({
    mutationFn: () => apiServices.admin.publishBlogPost(postId!),
    onSuccess: () => {
      toast.success('Post published.');
      setStatus('PUBLISHED');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not publish')),
  });

  const isBusy = createM.isPending || updateM.isPending;

  const isWrite = editorView === 'write';
  const isSplit = editorView === 'split';
  const showEditor = editorView !== 'preview';
  const showPreview = editorView !== 'write';

  const settingsCards = (
    <>
      <AdminSection title="Settings">
        <div className="space-y-4">
          <div>
            <FormFieldLabel fieldKey="blog.category" label="Category" required>
              Category
            </FormFieldLabel>
            <select
              value={categoryId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryId(e.target.value)}
              disabled={categoriesQ.isLoading || categories.length === 0}
              className="w-full rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {categories.length === 0 ? (
                <option value="">No categories — create one in Taxonomy first</option>
              ) : (
                categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <FormFieldLabel fieldKey="blog.slug" label="Slug">
              Slug
            </FormFieldLabel>
            <Input
              value={slug}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSlug(e.target.value)}
              className="rounded-lg"
              placeholder="auto-generated-from-title"
            />
          </div>
          <div>
            <FormFieldLabel fieldKey="blog.tags" label="Tags">
              Tags (comma-separated)
            </FormFieldLabel>
            <Input
              value={tags}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTags(e.target.value)}
              className="rounded-lg"
              placeholder="design, nextjs, tips"
            />
          </div>
          {isEditing ? (
            <div>
              <FormFieldLabel fieldKey="blog.status" label="Status">
                Status
              </FormFieldLabel>
              <select
                value={status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          ) : null}
        </div>
      </AdminSection>

      <AdminSection title="SEO & discovery">
        <div className="space-y-4">
          <div>
            <FormFieldLabel fieldKey="blog.seoTitle" label="Meta title">
              Meta title
            </FormFieldLabel>
            <Input
              value={metaTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMetaTitle(e.target.value)}
              className="rounded-lg"
              placeholder={title || 'SEO title for search results'}
            />
          </div>
          <div>
            <FormFieldLabel fieldKey="blog.seoDescription" label="Meta description">
              Meta description
            </FormFieldLabel>
            <textarea
              value={metaDescription}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setMetaDescription(e.target.value)
              }
              className="min-h-[72px] w-full resize-y rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-sm"
              placeholder="155 characters that sell the click in Google"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {metaDescription.length} / 160 characters
            </p>
          </div>
        </div>
      </AdminSection>

      <AdminSection title="Writing stats">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-muted/30 px-3 py-2">
            <dt className="text-xs text-muted-foreground">Words</dt>
            <dd className="font-semibold">{wordCount}</dd>
          </div>
          <div className="rounded-lg bg-muted/30 px-3 py-2">
            <dt className="text-xs text-muted-foreground">Est. read</dt>
            <dd className="font-semibold">{readingMinutes} min</dd>
          </div>
          <div className="col-span-2 rounded-lg bg-muted/30 px-3 py-2">
            <dt className="text-xs text-muted-foreground">Excerpt length</dt>
            <dd className="font-semibold">{excerptChars} chars</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          Lead with a clear promise in the title. Keep excerpts under 200 characters for cards and
          social previews.
        </p>
      </AdminSection>
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="Blog"
        title={isEditing ? 'Edit post' : 'New post'}
        description={
          isEditing
            ? 'Refine the story, tune SEO, and publish when it reads well.'
            : 'Start with a strong title and excerpt — readers discover you through both.'
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-lg" asChild>
              <Link href="/content">← Back to blog</Link>
            </Button>
            {isEditing && slug && status === 'PUBLISHED' ? (
              <Button variant="outline" className="rounded-lg" asChild>
                <a
                  href={`${publicWebOrigin}/blog/${encodeURIComponent(slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open live post
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : null}
            {isEditing && status !== 'PUBLISHED' ? (
              <Button
                variant="outline"
                className="rounded-lg"
                disabled={publishM.isPending}
                onClick={() => publishM.mutate()}
              >
                {publishM.isPending ? 'Publishing…' : 'Publish'}
              </Button>
            ) : null}
            <Button
              className="rounded-lg"
              disabled={isBusy || !title.trim() || !categoryId}
              onClick={() => (isEditing ? updateM.mutate() : createM.mutate())}
            >
              {isBusy ? 'Saving…' : isEditing ? 'Save changes' : 'Create post'}
            </Button>
          </div>
        }
      />

      <div className="sticky top-0 z-30 -mx-4 flex flex-col gap-3 border-b border-border bg-background px-4 py-3 sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:-mx-8 lg:px-8">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Editor view</p>
          <p className="text-xs text-muted-foreground">
            Preview updates instantly from unsaved fields.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-background p-1 sm:flex">
            {(
              [
                ['write', 'Write'],
                ['split', 'Split'],
                ['preview', 'Preview'],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                size="sm"
                className="w-full sm:w-auto"
                variant={editorView === value ? 'secondary' : 'ghost'}
                aria-pressed={editorView === value}
                onClick={() => setEditorView(value)}
              >
                {label}
              </Button>
            ))}
          </div>
          {showPreview ? (
            <div className="flex items-center justify-center gap-1 rounded-lg border border-border bg-background p-1">
              <Button
                type="button"
                size="sm"
                className="flex-1 sm:flex-none"
                variant={previewDevice === 'desktop' ? 'secondary' : 'ghost'}
                aria-label="Desktop preview width"
                aria-pressed={previewDevice === 'desktop'}
                onClick={() => setPreviewDevice('desktop')}
              >
                <MonitorSmartphone className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                className="flex-1 sm:flex-none"
                variant={previewDevice === 'mobile' ? 'secondary' : 'ghost'}
                aria-label="Mobile preview width"
                aria-pressed={previewDevice === 'mobile'}
                onClick={() => setPreviewDevice('mobile')}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {existingQ.isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      ) : existingQ.isError ? (
        <p className="text-sm text-destructive">
          {getApiErrorMessage(
            existingQ.error,
            'Could not load post. Check that the API gateway exposes GET /admin/posts/:id.'
          )}
        </p>
      ) : (
        <>
          <div
            className={cn(
              'grid items-start gap-6',
              isWrite && 'xl:grid-cols-[minmax(0,1fr)_22rem]',
              isSplit && 'lg:grid-cols-2'
            )}
          >
            {showEditor ? (
              <section className="min-w-0 space-y-6">
                <AdminSection title="Post content">
                  <div className="space-y-4">
                    <div>
                      <FormFieldLabel fieldKey="blog.title" label="Title" required>
                        Title
                      </FormFieldLabel>
                      <Input
                        value={title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setTitle(e.target.value)
                        }
                        className="rounded-lg"
                        placeholder="e.g. How we cut checkout drop-off"
                      />
                    </div>
                    <div>
                      <FormFieldLabel fieldKey="blog.excerpt" label="Excerpt">
                        Excerpt
                      </FormFieldLabel>
                      <textarea
                        value={excerpt}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setExcerpt(e.target.value)
                        }
                        className="min-h-[80px] w-full resize-y rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                        placeholder="1–2 sentences for cards and SEO"
                      />
                    </div>
                    <div>
                      <FormFieldLabel fieldKey="blog.content" label="Content">
                        Content (Markdown)
                      </FormFieldLabel>
                      <textarea
                        value={content}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setContent(e.target.value)
                        }
                        className={cn(
                          'w-full resize-y rounded-lg border border-border/70 bg-background/80 px-3 py-2 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40',
                          isSplit ? 'min-h-[420px] lg:min-h-[600px]' : 'min-h-[440px]'
                        )}
                        placeholder="Write your post in Markdown…"
                      />
                    </div>
                  </div>
                </AdminSection>
              </section>
            ) : null}

            {isWrite ? (
              <aside className="space-y-6 xl:sticky xl:top-20">{settingsCards}</aside>
            ) : null}

            {showPreview ? (
              <aside className={cn('min-w-0', isSplit && 'lg:sticky lg:top-20')}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-foreground">Instant preview</h2>
                    <p className="text-xs text-muted-foreground">Unsaved draft · not public</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {previewDevice === 'mobile' ? '390 px' : 'Responsive'}
                  </span>
                </div>
                <div
                  className={cn(
                    isSplit &&
                      'lg:max-h-[calc(100dvh-12rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1'
                  )}
                >
                  <BlogPostPreview
                    title={title}
                    excerpt={excerpt}
                    content={content}
                    category={selectedCategory}
                    tags={previewTags}
                    readingMinutes={readingMinutes}
                    device={previewDevice}
                  />
                </div>
              </aside>
            ) : null}
          </div>

          {!isWrite ? (
            <div className="grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
              {settingsCards}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
